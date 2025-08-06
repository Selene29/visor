import Parser from "web-tree-sitter";
import { AbstractParser } from "../../common/AbstractParser";
import {
  FlowchartIR,
  FlowchartNode,
  FlowchartEdge,
  NodeType,
} from "../../../ir/ir";
import { ProcessResult, LoopContext } from "../../common/AstParserTypes";

export class CSharpAstParser extends AbstractParser {
  private currentMethodIsLambda = false;

  private constructor(parser: Parser) {
    super(parser, "csharp");
  }

  /**
   * Asynchronously creates and initializes an instance of CSharpAstParser.
   * This is the required entry point for creating a parser instance.
   * @param wasmPath The file path to the tree-sitter-c-sharp.wasm file.
   * @returns A promise that resolves to a new CSharpAstParser instance.
   */
  public static async create(wasmPath: string): Promise<CSharpAstParser> {
    await Parser.init();
    const language = await Parser.Language.load(wasmPath);
    const parser = new Parser();
    parser.setLanguage(language);
    return new CSharpAstParser(parser);
  }

  public listFunctions(sourceCode: string): string[] {
    return this.measurePerformance("listFunctions", () => {
      const tree = this.parser.parse(sourceCode);

      const functions: string[] = [];

      // Get method declarations (including async methods)
      tree.rootNode
        .descendantsOfType("method_declaration")
        .forEach((m: Parser.SyntaxNode) => {
          const name = m.childForFieldName("name")?.text || "[anonymous method]";
          const isAsync = this.isAsyncMethod(m);
          functions.push(isAsync ? `async ${name}` : name);
        });

      // Get constructor declarations
      tree.rootNode
        .descendantsOfType("constructor_declaration")
        .forEach((c: Parser.SyntaxNode) => {
          const name = c.childForFieldName("name")?.text || "[constructor]";
          functions.push(name);
        });

      // Get property declarations with accessors
      tree.rootNode
        .descendantsOfType("property_declaration")
        .forEach((p: Parser.SyntaxNode) => {
          const name = p.childForFieldName("name")?.text || "[property]";
          const hasGet = p.descendantsOfType("get_accessor_declaration").length > 0;
          const hasSet = p.descendantsOfType("set_accessor_declaration").length > 0;
          
          if (hasGet || hasSet) {
            const accessors = [];
            if (hasGet) {
              accessors.push("get");
            }
            if (hasSet) {
              accessors.push("set");
            }
            functions.push(`${name} { ${accessors.join(", ")} }`);
          } else {
            functions.push(name);
          }
        });

      // Get local function statements
      tree.rootNode
        .descendantsOfType("local_function_statement")
        .forEach((lf: Parser.SyntaxNode) => {
          const name = lf.childForFieldName("name")?.text || "[local function]";
          const isAsync = this.isAsyncMethod(lf);
          functions.push(isAsync ? `local async ${name}` : `local ${name}`);
        });

      return functions;
    });
  }

  public findFunctionAtPosition(
    sourceCode: string,
    position: number
  ): string | undefined {
    const tree = this.parser.parse(sourceCode);

    // Check method declarations
    let method = tree.rootNode
      .descendantsOfType("method_declaration")
      .find((m) => position >= m.startIndex && position <= m.endIndex);
    if (method) {
      const name = method.childForFieldName("name")?.text || "[anonymous method]";
      const isAsync = this.isAsyncMethod(method);
      return isAsync ? `async ${name}` : name;
    }

    // Check constructor declarations
    method = tree.rootNode
      .descendantsOfType("constructor_declaration")
      .find((c) => position >= c.startIndex && position <= c.endIndex);
    if (method) {
      return method.childForFieldName("name")?.text || "[constructor]";
    }

    // Check property declarations
    const property = tree.rootNode
      .descendantsOfType("property_declaration")
      .find((p) => position >= p.startIndex && position <= p.endIndex);
    if (property) {
      const name = property.childForFieldName("name")?.text || "[property]";
      const hasGet = property.descendantsOfType("get_accessor_declaration").length > 0;
      const hasSet = property.descendantsOfType("set_accessor_declaration").length > 0;
      
      if (hasGet || hasSet) {
        const accessors = [];
        if (hasGet) {
          accessors.push("get");
        }
        if (hasSet) {
          accessors.push("set");
        }
        return `${name} { ${accessors.join(", ")} }`;
      } else {
        return name;
      }
    }

    // Check local function statements
    const localFunction = tree.rootNode
      .descendantsOfType("local_function_statement")
      .find((f) => position >= f.startIndex && position <= f.endIndex);
    if (localFunction) {
      const name = localFunction.childForFieldName("name")?.text || "[local function]";
      const isAsync = this.isAsyncMethod(localFunction);
      return isAsync ? `local async ${name}` : `local ${name}`;
    }

    return undefined;
  }

  private isAsyncMethod(methodNode: Parser.SyntaxNode): boolean {
    // Look for async modifier in the modifiers
    const modifiers = methodNode.childForFieldName("modifiers");
    if (modifiers) {
      return modifiers.children.some(modifier => modifier.text === "async");
    }
    
    // Also check direct children for async keyword (in case tree structure varies)
    return methodNode.children.some(child => child.text === "async");
  }

  public generateFlowchart(
    sourceCode: string,
    functionName?: string,
    position?: number
  ): FlowchartIR {
    const tree = this.parser.parse(sourceCode);
    this.resetState();

    let targetNode: Parser.SyntaxNode | undefined;
    let isConstructor = false;
    let isProperty = false;
    let isLocalFunction = false;

    if (position !== undefined) {
      // Try to find method declaration at position
      targetNode = tree.rootNode
        .descendantsOfType("method_declaration")
        .find((m) => position >= m.startIndex && position <= m.endIndex);

      if (!targetNode) {
        // Try to find constructor declaration at position
        targetNode = tree.rootNode
          .descendantsOfType("constructor_declaration")
          .find((c) => position >= c.startIndex && position <= c.endIndex);
        isConstructor = !!targetNode;
      }

      if (!targetNode) {
        // Try to find property declaration at position
        targetNode = tree.rootNode
          .descendantsOfType("property_declaration")
          .find((p) => position >= p.startIndex && position <= p.endIndex);
        isProperty = !!targetNode;
      }

      if (!targetNode) {
        // Try to find local function statement at position
        targetNode = tree.rootNode
          .descendantsOfType("local_function_statement")
          .find((f) => position >= f.startIndex && position <= f.endIndex);
        isLocalFunction = !!targetNode;
      }
    } else if (functionName) {
      // Find by function name
      targetNode = tree.rootNode
        .descendantsOfType("method_declaration")
        .find((m) => m.childForFieldName("name")?.text === functionName);

      if (!targetNode) {
        targetNode = tree.rootNode
          .descendantsOfType("constructor_declaration")
          .find((c) => c.childForFieldName("name")?.text === functionName);
        isConstructor = !!targetNode;
      }

      if (!targetNode) {
        targetNode = tree.rootNode
          .descendantsOfType("property_declaration")
          .find((p) => p.childForFieldName("name")?.text === functionName);
        isProperty = !!targetNode;
      }

      if (!targetNode) {
        targetNode = tree.rootNode
          .descendantsOfType("local_function_statement")
          .find((f) => f.childForFieldName("name")?.text === functionName);
        isLocalFunction = !!targetNode;
      }
    } else {
      // Get first method/constructor/property/local function
      targetNode =
        tree.rootNode.descendantsOfType("method_declaration")[0] ||
        tree.rootNode.descendantsOfType("constructor_declaration")[0] ||
        tree.rootNode.descendantsOfType("property_declaration")[0] ||
        tree.rootNode.descendantsOfType("local_function_statement")[0];

      if (targetNode?.type === "constructor_declaration") {
        isConstructor = true;
      } else if (targetNode?.type === "property_declaration") {
        isProperty = true;
      } else if (targetNode?.type === "local_function_statement") {
        isLocalFunction = true;
      }
    }

    if (!targetNode) {
      return {
        nodes: [
          {
            id: "A",
            label: "Place cursor inside a method to generate a flowchart.",
            shape: "rect",
          },
        ],
        edges: [],
        locationMap: [],
      };
    }

    // Get method body and name
    let bodyToProcess: Parser.SyntaxNode | null = null;
    let funcNameStr = "";

    if (isProperty) {
      bodyToProcess = targetNode.childForFieldName("accessors");
      funcNameStr = this.escapeString(
        targetNode.childForFieldName("name")?.text || "[property]"
      );
    } else if (isConstructor) {
      bodyToProcess = targetNode.childForFieldName("body");
      funcNameStr = this.escapeString(
        targetNode.childForFieldName("name")?.text || "[constructor]"
      );
    } else if (isLocalFunction) {
      bodyToProcess = targetNode.childForFieldName("body");
      funcNameStr = this.escapeString(
        targetNode.childForFieldName("name")?.text || "[local function]"
      );
    } else {
      bodyToProcess = targetNode.childForFieldName("body");
      funcNameStr = this.escapeString(
        targetNode.childForFieldName("name")?.text || "[anonymous method]"
      );
    }

    const title = `Flowchart for ${
      isProperty ? "property" : isConstructor ? "constructor" : isLocalFunction ? "local function" : "method"
    }: ${funcNameStr}`;

    if (!bodyToProcess) {
      return {
        nodes: [
          this.createSemanticNode("A", "Method has no body.", NodeType.PROCESS),
        ],
        edges: [],
        locationMap: [],
      };
    }

    const nodes: FlowchartNode[] = [];
    const edges: FlowchartEdge[] = [];
    const entryId = this.generateNodeId("start");
    const exitId = this.generateNodeId("end");

    // Create semantic entry and exit nodes
    nodes.push(
      this.createSemanticNode(entryId, "Start", NodeType.ENTRY, targetNode)
    );
    nodes.push(
      this.createSemanticNode(exitId, "End", NodeType.EXIT, targetNode)
    );

    // Process the body
    const bodyResult = this.processBlock(bodyToProcess, exitId);

    nodes.push(...bodyResult.nodes);
    edges.push(...bodyResult.edges);

    // Connect entry to first statement or exit
    if (bodyResult.entryNodeId) {
      edges.push({ from: entryId, to: bodyResult.entryNodeId });
    } else {
      edges.push({ from: entryId, to: exitId });
    }

    // Connect all exit points to exit node
    for (const exitPoint of bodyResult.exitPoints) {
      if (!bodyResult.nodesConnectedToExit.has(exitPoint.id)) {
        edges.push({ from: exitPoint.id, to: exitId, label: exitPoint.label });
      }
    }

    return {
      nodes,
      edges,
      entryNodeId: entryId,
      exitNodeId: exitId,
      locationMap: this.locationMap,
      functionRange: {
        start: targetNode.startIndex,
        end: targetNode.endIndex,
      },
      title,
    };
  }

  protected processStatement(
    statement: Parser.SyntaxNode,
    exitId: string,
    loopContext?: LoopContext,
    finallyContext?: { finallyEntryId: string }
  ): ProcessResult {
    // Handle different types of C# statements
    switch (statement.type) {
      case "if_statement":
        return this.processIfStatement(statement, exitId, loopContext);

      case "while_statement":
      case "do_statement":
        return this.processWhileStatement(statement, exitId, loopContext);

      case "for_statement":
      case "foreach_statement":
        return this.processForStatement(statement, exitId, loopContext);

      case "switch_statement":
        return this.processSwitchStatement(statement, exitId, loopContext);

      case "switch_expression":
        return this.processSwitchExpression(statement, exitId, loopContext);

      case "try_statement":
        return this.processTryStatement(statement, exitId, loopContext, finallyContext);

      case "return_statement":
        return this.processReturnStatement(statement, exitId);

      case "break_statement":
        return this.processBreakStatement(statement, exitId, loopContext);

      case "continue_statement":
        return this.processContinueStatement(statement, exitId, loopContext);

      case "throw_statement":
        return this.processThrowStatement(statement, exitId);

      case "using_statement":
        return this.processUsingStatement(statement, exitId, loopContext, finallyContext);

      case "lock_statement":
        return this.processLockStatement(statement, exitId, loopContext, finallyContext);

      case "yield_statement":
        return this.processYieldStatement(statement, exitId);

      case "goto_statement":
        return this.processGotoStatement(statement, exitId);

      case "labeled_statement":
        return this.processLabeledStatement(statement, exitId, loopContext, finallyContext);

      case "checked_statement":
      case "unchecked_statement":
        return this.processCheckedStatement(statement, exitId, loopContext, finallyContext);

      case "unsafe_statement":
        return this.processUnsafeStatement(statement, exitId, loopContext, finallyContext);

      case "fixed_statement":
        return this.processFixedStatement(statement, exitId, loopContext, finallyContext);

      case "local_function_statement":
        return this.processLocalFunctionStatement(statement, exitId);

      case "block":
        return this.processBlock(statement, exitId, loopContext, finallyContext);

      default:
        return this.processDefaultStatement(statement);
    }
  }

  private processIfStatement(
    node: Parser.SyntaxNode,
    exitId: string,
    loopContext?: LoopContext
  ): ProcessResult {
    const condition = node.childForFieldName("condition");
    const conditionText = condition ? this.escapeString(condition.text) : "condition";

    const decisionId = this.generateNodeId("if");
    const decisionNode = this.createSemanticNode(
      decisionId,
      conditionText,
      NodeType.DECISION,
      condition || undefined
    );

    const nodes = [decisionNode];
    const edges: FlowchartEdge[] = [];
    const exitPoints: { id: string; label?: string }[] = [];
    const nodesConnectedToExit = new Set<string>();

    // Process then statement
    const thenStatement = node.childForFieldName("consequence");
    if (thenStatement) {
      const thenResult = this.processStatement(thenStatement, exitId, loopContext);
      nodes.push(...thenResult.nodes);
      edges.push(...thenResult.edges);

      if (thenResult.entryNodeId) {
        edges.push({ from: decisionId, to: thenResult.entryNodeId, label: "Yes" });
      }

      exitPoints.push(...thenResult.exitPoints);
      thenResult.nodesConnectedToExit.forEach(id => nodesConnectedToExit.add(id));
    }

    // Process else statement
    const elseStatement = node.childForFieldName("alternative");
    if (elseStatement) {
      const elseResult = this.processStatement(elseStatement, exitId, loopContext);
      nodes.push(...elseResult.nodes);
      edges.push(...elseResult.edges);

      if (elseResult.entryNodeId) {
        edges.push({ from: decisionId, to: elseResult.entryNodeId, label: "No" });
      }

      exitPoints.push(...elseResult.exitPoints);
      elseResult.nodesConnectedToExit.forEach(id => nodesConnectedToExit.add(id));
    } else {
      // No else, decision directly connects to exit on "No"
      exitPoints.push({ id: decisionId, label: "No" });
    }

    return this.createProcessResult(nodes, edges, decisionId, exitPoints, nodesConnectedToExit);
  }

  private processWhileStatement(
    node: Parser.SyntaxNode,
    exitId: string,
    parentLoopContext?: LoopContext
  ): ProcessResult {
    const condition = node.childForFieldName("condition");
    const conditionText = condition ? this.escapeString(condition.text) : "condition";

    const loopId = this.generateNodeId("while");
    const loopNode = this.createSemanticNode(
      loopId,
      conditionText,
      NodeType.DECISION,
      condition || undefined
    );

    const nodes = [loopNode];
    const edges: FlowchartEdge[] = [];
    const exitPoints: { id: string; label?: string }[] = [{ id: loopId, label: "No" }];
    const nodesConnectedToExit = new Set<string>();

    // Create loop context
    const loopContext: LoopContext = {
      continueTargetId: loopId,
      breakTargetId: exitId,
    };

    // Process loop body
    const body = node.childForFieldName("body");
    if (body) {
      const bodyResult = this.processStatement(body, exitId, loopContext);
      nodes.push(...bodyResult.nodes);
      edges.push(...bodyResult.edges);

      if (bodyResult.entryNodeId) {
        edges.push({ from: loopId, to: bodyResult.entryNodeId, label: "Yes" });
      }

      // Connect body exits back to loop condition
      for (const exitPoint of bodyResult.exitPoints) {
        if (!bodyResult.nodesConnectedToExit.has(exitPoint.id)) {
          edges.push({ from: exitPoint.id, to: loopId, label: exitPoint.label });
        }
      }

      bodyResult.nodesConnectedToExit.forEach(id => nodesConnectedToExit.add(id));
    }

    return this.createProcessResult(nodes, edges, loopId, exitPoints, nodesConnectedToExit);
  }

  private processForStatement(
    node: Parser.SyntaxNode,
    exitId: string,
    parentLoopContext?: LoopContext
  ): ProcessResult {
    let loopLabel = "";
    if (node.type === "foreach_statement") {
      const left = node.childForFieldName("left");
      const right = node.childForFieldName("right");
      const leftText = left ? left.text : "item";
      const rightText = right ? right.text : "collection";
      loopLabel = `foreach (${leftText} in ${rightText})`;
    } else {
      const condition = node.childForFieldName("condition");
      loopLabel = condition ? this.escapeString(condition.text) : "for loop";
    }

    const loopId = this.generateNodeId("for");
    const loopNode = this.createSemanticNode(
      loopId,
      loopLabel,
      NodeType.DECISION,
      node
    );

    const nodes = [loopNode];
    const edges: FlowchartEdge[] = [];
    const exitPoints: { id: string; label?: string }[] = [{ id: loopId, label: "No" }];
    const nodesConnectedToExit = new Set<string>();

    // Create loop context
    const loopContext: LoopContext = {
      continueTargetId: loopId,
      breakTargetId: exitId,
    };

    // Process loop body
    const body = node.childForFieldName("body");
    if (body) {
      const bodyResult = this.processStatement(body, exitId, loopContext);
      nodes.push(...bodyResult.nodes);
      edges.push(...bodyResult.edges);

      if (bodyResult.entryNodeId) {
        edges.push({ from: loopId, to: bodyResult.entryNodeId, label: "Yes" });
      }

      // Connect body exits back to loop condition
      for (const exitPoint of bodyResult.exitPoints) {
        if (!bodyResult.nodesConnectedToExit.has(exitPoint.id)) {
          edges.push({ from: exitPoint.id, to: loopId, label: exitPoint.label });
        }
      }

      bodyResult.nodesConnectedToExit.forEach(id => nodesConnectedToExit.add(id));
    }

    return this.createProcessResult(nodes, edges, loopId, exitPoints, nodesConnectedToExit);
  }

  private processSwitchStatement(
    node: Parser.SyntaxNode,
    exitId: string,
    loopContext?: LoopContext
  ): ProcessResult {
    const switchExpression = node.childForFieldName("value");
    const switchText = switchExpression
      ? `switch (${this.escapeString(switchExpression.text)})`
      : "switch";

    const switchId = this.generateNodeId("switch");
    const switchNode = this.createSemanticNode(
      switchId,
      switchText,
      NodeType.DECISION,
      node
    );

    const nodes = [switchNode];
    const edges: FlowchartEdge[] = [];
    const exitPoints: { id: string; label?: string }[] = [];
    const nodesConnectedToExit = new Set<string>();

    // Process switch sections
    const switchBody = node.childForFieldName("body");
    if (switchBody) {
      const sections = switchBody.children.filter(child => child.type === "switch_section");

      for (const section of sections) {
        const sectionResult = this.processSwitchSection(section, exitId, loopContext);
        nodes.push(...sectionResult.nodes);
        edges.push(...sectionResult.edges);

        if (sectionResult.entryNodeId) {
          const label = this.getSwitchSectionLabel(section);
          edges.push({ from: switchId, to: sectionResult.entryNodeId, label });
        }

        exitPoints.push(...sectionResult.exitPoints);
        sectionResult.nodesConnectedToExit.forEach(id => nodesConnectedToExit.add(id));
      }
    }

    return this.createProcessResult(nodes, edges, switchId, exitPoints, nodesConnectedToExit);
  }

  private processSwitchSection(
    section: Parser.SyntaxNode,
    exitId: string,
    loopContext?: LoopContext
  ): ProcessResult {
    const statements = section.children.filter(
      child => !["case_pattern_switch_label", "default_switch_label"].includes(child.type)
    );

    if (statements.length === 0) {
      return this.createProcessResult();
    }

    const nodes: FlowchartNode[] = [];
    const edges: FlowchartEdge[] = [];
    let entryNodeId: string | undefined;
    let exitPoints: { id: string; label?: string }[] = [];
    const nodesConnectedToExit = new Set<string>();

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const result = this.processStatement(statement, exitId, loopContext);

      nodes.push(...result.nodes);
      edges.push(...result.edges);

      if (i === 0 && result.entryNodeId) {
        entryNodeId = result.entryNodeId;
      }

      if (i > 0 && exitPoints.length > 0 && result.entryNodeId) {
        for (const exitPoint of exitPoints) {
          if (!nodesConnectedToExit.has(exitPoint.id)) {
            edges.push({ from: exitPoint.id, to: result.entryNodeId, label: exitPoint.label });
          }
        }
      }

      exitPoints = result.exitPoints;
      result.nodesConnectedToExit.forEach(id => nodesConnectedToExit.add(id));
    }

    return this.createProcessResult(nodes, edges, entryNodeId, exitPoints, nodesConnectedToExit);
  }

  private getSwitchSectionLabel(section: Parser.SyntaxNode): string {
    // Look for switch labels (case or default)
    const labels = section.children.filter(child => 
      child.type === "case_pattern_switch_label" || 
      child.type === "default_switch_label"
    );

    if (labels.length === 0) {
      return "case";
    }

    // Process all labels (there can be multiple case labels for one section)
    const labelTexts: string[] = [];
    
    for (const label of labels) {
      if (label.type === "default_switch_label") {
        labelTexts.push("default");
        continue;
      }

      // For case_pattern_switch_label, extract the pattern
      const caseKeyword = label.children.find(child => child.type === "case");
      if (!caseKeyword) {
        labelTexts.push("case");
        continue;
      }

      // Find the pattern after case keyword
      const patternTypes = [
        "relational_pattern",      // case >= 90:
        "constant_pattern",        // case 70:
        "literal_expression",      // case "A":
        "variable_pattern",        // case var x:
        "null_literal",           // case null:
        "list_pattern",           // case [1, 2]:
        "property_pattern",       // case { X: 1 }:
        "parenthesized_pattern",  // case (>= 90):
        "type_pattern",           // case int x:
        "identifier",             // case SomeConstant:
        "member_access_expression", // case MyEnum.Value:
        "integer_literal",        // case 42:
        "string_literal",         // case "text":
        "boolean_literal"         // case true:
      ];

      let patternFound = false;
      for (const patternType of patternTypes) {
        const pattern = label.descendantsOfType(patternType)[0];
        if (pattern) {
          labelTexts.push(`case ${this.escapeString(pattern.text)}`);
          patternFound = true;
          break;
        }
      }

      if (!patternFound) {
        // Fallback: try to extract everything between case and colon
        const caseIndex = label.children.findIndex(child => child.type === "case");
        const colonIndex = label.children.findIndex(child => child.text === ":");
        
        if (caseIndex >= 0 && colonIndex > caseIndex) {
          const patternNodes = label.children.slice(caseIndex + 1, colonIndex);
          const patternText = patternNodes.map(node => node.text).join("").trim();
          if (patternText) {
            labelTexts.push(`case ${this.escapeString(patternText)}`);
          } else {
            labelTexts.push("case");
          }
        } else {
          labelTexts.push("case");
        }
      }
    }

    return labelTexts.join(", ");
  }

  private processTryStatement(
    node: Parser.SyntaxNode,
    exitId: string,
    loopContext?: LoopContext,
    finallyContext?: { finallyEntryId: string }
  ): ProcessResult {
    const tryId = this.generateNodeId("try");
    const tryNode = this.createSemanticNode(tryId, "try", NodeType.PROCESS, node);

    const nodes = [tryNode];
    const edges: FlowchartEdge[] = [];
    let exitPoints: { id: string; label?: string }[] = [];
    const nodesConnectedToExit = new Set<string>();

    // Process try body
    const tryBody = node.childForFieldName("body");
    if (tryBody) {
      const tryResult = this.processStatement(tryBody, exitId, loopContext, finallyContext);
      nodes.push(...tryResult.nodes);
      edges.push(...tryResult.edges);

      if (tryResult.entryNodeId) {
        edges.push({ from: tryId, to: tryResult.entryNodeId });
      }

      exitPoints.push(...tryResult.exitPoints);
      tryResult.nodesConnectedToExit.forEach(id => nodesConnectedToExit.add(id));
    }

    // Process catch clauses
    const catchClauses = node.children.filter(child => child.type === "catch_clause");
    for (const catchClause of catchClauses) {
      const catchResult = this.processCatchClause(catchClause, exitId, loopContext, finallyContext);
      nodes.push(...catchResult.nodes);
      edges.push(...catchResult.edges);

      if (catchResult.entryNodeId) {
        edges.push({ from: tryId, to: catchResult.entryNodeId, label: "exception" });
      }

      exitPoints.push(...catchResult.exitPoints);
      catchResult.nodesConnectedToExit.forEach(id => nodesConnectedToExit.add(id));
    }

    // Process finally clause
    const finallyClause = node.children.find(child => child.type === "finally_clause");
    if (finallyClause) {
      const finallyResult = this.processFinallyClause(finallyClause, exitId, loopContext);
      nodes.push(...finallyResult.nodes);
      edges.push(...finallyResult.edges);

      // Connect all exits to finally
      if (finallyResult.entryNodeId) {
        for (const exitPoint of exitPoints) {
          if (!nodesConnectedToExit.has(exitPoint.id)) {
            edges.push({ from: exitPoint.id, to: finallyResult.entryNodeId, label: exitPoint.label });
          }
        }
        exitPoints = finallyResult.exitPoints;
        finallyResult.nodesConnectedToExit.forEach(id => nodesConnectedToExit.add(id));
      }
    }

    return this.createProcessResult(nodes, edges, tryId, exitPoints, nodesConnectedToExit);
  }

  private processCatchClause(
    node: Parser.SyntaxNode,
    exitId: string,
    loopContext?: LoopContext,
    finallyContext?: { finallyEntryId: string }
  ): ProcessResult {
    const declaration = node.childForFieldName("declaration");
    const catchLabel = declaration
      ? `catch (${this.escapeString(declaration.text)})`
      : "catch";

    const catchId = this.generateNodeId("catch");
    const catchNode = this.createSemanticNode(catchId, catchLabel, NodeType.EXCEPTION, node);

    const nodes = [catchNode];
    const edges: FlowchartEdge[] = [];
    let exitPoints: { id: string; label?: string }[] = [{ id: catchId }];
    const nodesConnectedToExit = new Set<string>();

    // Process catch body
    const body = node.childForFieldName("body");
    if (body) {
      const bodyResult = this.processStatement(body, exitId, loopContext, finallyContext);
      nodes.push(...bodyResult.nodes);
      edges.push(...bodyResult.edges);

      if (bodyResult.entryNodeId) {
        edges.push({ from: catchId, to: bodyResult.entryNodeId });
      }

      exitPoints = bodyResult.exitPoints;
      bodyResult.nodesConnectedToExit.forEach(id => nodesConnectedToExit.add(id));
    }

    return this.createProcessResult(nodes, edges, catchId, exitPoints, nodesConnectedToExit);
  }

  private processFinallyClause(
    node: Parser.SyntaxNode,
    exitId: string,
    loopContext?: LoopContext
  ): ProcessResult {
    const finallyId = this.generateNodeId("finally");
    const finallyNode = this.createSemanticNode(finallyId, "finally", NodeType.PROCESS, node);

    const nodes = [finallyNode];
    const edges: FlowchartEdge[] = [];
    let exitPoints: { id: string; label?: string }[] = [{ id: finallyId }];
    const nodesConnectedToExit = new Set<string>();

    // Process finally body
    const body = node.childForFieldName("body");
    if (body) {
      const bodyResult = this.processStatement(body, exitId, loopContext);
      nodes.push(...bodyResult.nodes);
      edges.push(...bodyResult.edges);

      if (bodyResult.entryNodeId) {
        edges.push({ from: finallyId, to: bodyResult.entryNodeId });
      }

      exitPoints = bodyResult.exitPoints;
      bodyResult.nodesConnectedToExit.forEach(id => nodesConnectedToExit.add(id));
    }

    return this.createProcessResult(nodes, edges, finallyId, exitPoints, nodesConnectedToExit);
  }

  private processReturnStatement(node: Parser.SyntaxNode, exitId: string): ProcessResult {
    const expression = node.childForFieldName("expression");
    const returnText = expression
      ? `return ${this.escapeString(expression.text)}`
      : "return";

    const returnId = this.generateNodeId("return");
    const returnNode = this.createSemanticNode(returnId, returnText, NodeType.RETURN, node);

    const nodesConnectedToExit = new Set<string>();
    nodesConnectedToExit.add(returnId);

    return this.createProcessResult(
      [returnNode],
      [{ from: returnId, to: exitId }],
      returnId,
      [],
      nodesConnectedToExit
    );
  }

  private processBreakStatement(
    node: Parser.SyntaxNode,
    exitId: string,
    loopContext?: LoopContext
  ): ProcessResult {
    const breakId = this.generateNodeId("break");
    const breakNode = this.createSemanticNode(breakId, "break", NodeType.BREAK_CONTINUE, node);

    const edges: FlowchartEdge[] = [];
    const nodesConnectedToExit = new Set<string>();

    if (loopContext) {
      edges.push({ from: breakId, to: loopContext.breakTargetId });
      nodesConnectedToExit.add(breakId);
    }

    return this.createProcessResult([breakNode], edges, breakId, [], nodesConnectedToExit);
  }

  private processContinueStatement(
    node: Parser.SyntaxNode,
    exitId: string,
    loopContext?: LoopContext
  ): ProcessResult {
    const continueId = this.generateNodeId("continue");
    const continueNode = this.createSemanticNode(continueId, "continue", NodeType.BREAK_CONTINUE, node);

    const edges: FlowchartEdge[] = [];
    const nodesConnectedToExit = new Set<string>();

    if (loopContext) {
      edges.push({ from: continueId, to: loopContext.continueTargetId });
      nodesConnectedToExit.add(continueId);
    }

    return this.createProcessResult([continueNode], edges, continueId, [], nodesConnectedToExit);
  }

  private processThrowStatement(node: Parser.SyntaxNode, exitId: string): ProcessResult {
    const expression = node.childForFieldName("expression");
    const throwText = expression
      ? `throw ${this.escapeString(expression.text)}`
      : "throw";

    const throwId = this.generateNodeId("throw");
    const throwNode = this.createSemanticNode(throwId, throwText, NodeType.EXCEPTION, node);

    const nodesConnectedToExit = new Set<string>();
    nodesConnectedToExit.add(throwId);

    return this.createProcessResult(
      [throwNode],
      [{ from: throwId, to: exitId }],
      throwId,
      [],
      nodesConnectedToExit
    );
  }

  private processSwitchExpression(
    node: Parser.SyntaxNode,
    exitId: string,
    loopContext?: LoopContext
  ): ProcessResult {
    const switchExpression = node.childForFieldName("expression") || node.childForFieldName("value");
    const switchText = switchExpression
      ? `switch ${this.escapeString(switchExpression.text)}`
      : "switch expression";

    const switchId = this.generateNodeId("switch_expr");
    const switchNode = this.createSemanticNode(
      switchId,
      switchText,
      NodeType.DECISION,
      node
    );

    return this.createProcessResult([switchNode], [], switchId, [{ id: switchId }]);
  }

  private processUsingStatement(
    node: Parser.SyntaxNode,
    exitId: string,
    loopContext?: LoopContext,
    finallyContext?: { finallyEntryId: string }
  ): ProcessResult {
    const declaration = node.childForFieldName("declaration");
    const expression = node.childForFieldName("expression");
    
    let usingText = "using";
    if (declaration) {
      usingText = `using (${this.escapeString(declaration.text)})`;
    } else if (expression) {
      usingText = `using (${this.escapeString(expression.text)})`;
    }

    const usingId = this.generateNodeId("using");
    const usingNode = this.createSemanticNode(usingId, usingText, NodeType.PROCESS, node);

    const nodes = [usingNode];
    const edges: FlowchartEdge[] = [];
    let exitPoints: { id: string; label?: string }[] = [];
    const nodesConnectedToExit = new Set<string>();

    // Process the using body
    const body = node.childForFieldName("body");
    if (body) {
      const bodyResult = this.processStatement(body, exitId, loopContext, finallyContext);
      nodes.push(...bodyResult.nodes);
      edges.push(...bodyResult.edges);

      if (bodyResult.entryNodeId) {
        edges.push({ from: usingId, to: bodyResult.entryNodeId });
      }

      exitPoints = bodyResult.exitPoints;
      bodyResult.nodesConnectedToExit.forEach(id => nodesConnectedToExit.add(id));
    } else {
      exitPoints = [{ id: usingId }];
    }

    return this.createProcessResult(nodes, edges, usingId, exitPoints, nodesConnectedToExit);
  }

  private processLockStatement(
    node: Parser.SyntaxNode,
    exitId: string,
    loopContext?: LoopContext,
    finallyContext?: { finallyEntryId: string }
  ): ProcessResult {
    const expression = node.childForFieldName("expression");
    const lockText = expression
      ? `lock (${this.escapeString(expression.text)})`
      : "lock";

    const lockId = this.generateNodeId("lock");
    const lockNode = this.createSemanticNode(lockId, lockText, NodeType.PROCESS, node);

    const nodes = [lockNode];
    const edges: FlowchartEdge[] = [];
    let exitPoints: { id: string; label?: string }[] = [];
    const nodesConnectedToExit = new Set<string>();

    // Process the lock body
    const body = node.childForFieldName("body");
    if (body) {
      const bodyResult = this.processStatement(body, exitId, loopContext, finallyContext);
      nodes.push(...bodyResult.nodes);
      edges.push(...bodyResult.edges);

      if (bodyResult.entryNodeId) {
        edges.push({ from: lockId, to: bodyResult.entryNodeId });
      }

      exitPoints = bodyResult.exitPoints;
      bodyResult.nodesConnectedToExit.forEach(id => nodesConnectedToExit.add(id));
    } else {
      exitPoints = [{ id: lockId }];
    }

    return this.createProcessResult(nodes, edges, lockId, exitPoints, nodesConnectedToExit);
  }

  private processYieldStatement(node: Parser.SyntaxNode, exitId: string): ProcessResult {
    const expression = node.childForFieldName("expression");
    const yieldKeyword = node.children.find(child => child.text === "yield");
    const yieldType = node.children.find(child => child.text === "return" || child.text === "break");
    
    let yieldText = "yield";
    if (yieldType) {
      yieldText = `yield ${yieldType.text}`;
      if (expression && yieldType.text === "return") {
        yieldText = `yield return ${this.escapeString(expression.text)}`;
      }
    }

    const yieldId = this.generateNodeId("yield");
    const yieldNode = this.createSemanticNode(yieldId, yieldText, NodeType.PROCESS, node);

    return this.createProcessResult([yieldNode], [], yieldId, [{ id: yieldId }]);
  }

  private processGotoStatement(node: Parser.SyntaxNode, exitId: string): ProcessResult {
    const label = node.childForFieldName("label");
    const gotoText = label
      ? `goto ${this.escapeString(label.text)}`
      : "goto";

    const gotoId = this.generateNodeId("goto");
    const gotoNode = this.createSemanticNode(gotoId, gotoText, NodeType.PROCESS, node);

    const nodesConnectedToExit = new Set<string>();
    nodesConnectedToExit.add(gotoId);

    return this.createProcessResult(
      [gotoNode],
      [{ from: gotoId, to: exitId }],
      gotoId,
      [],
      nodesConnectedToExit
    );
  }

  private processLabeledStatement(
    node: Parser.SyntaxNode,
    exitId: string,
    loopContext?: LoopContext,
    finallyContext?: { finallyEntryId: string }
  ): ProcessResult {
    const label = node.childForFieldName("label");
    const labelText = label ? `${this.escapeString(label.text)}:` : "label:";

    const labelId = this.generateNodeId("label");
    const labelNode = this.createSemanticNode(labelId, labelText, NodeType.PROCESS, node);

    const nodes = [labelNode];
    const edges: FlowchartEdge[] = [];
    let exitPoints: { id: string; label?: string }[] = [];
    const nodesConnectedToExit = new Set<string>();

    // Process the statement after the label
    const statement = node.childForFieldName("statement");
    if (statement) {
      const stmtResult = this.processStatement(statement, exitId, loopContext, finallyContext);
      nodes.push(...stmtResult.nodes);
      edges.push(...stmtResult.edges);

      if (stmtResult.entryNodeId) {
        edges.push({ from: labelId, to: stmtResult.entryNodeId });
      }

      exitPoints = stmtResult.exitPoints;
      stmtResult.nodesConnectedToExit.forEach(id => nodesConnectedToExit.add(id));
    } else {
      exitPoints = [{ id: labelId }];
    }

    return this.createProcessResult(nodes, edges, labelId, exitPoints, nodesConnectedToExit);
  }

  private processCheckedStatement(
    node: Parser.SyntaxNode,
    exitId: string,
    loopContext?: LoopContext,
    finallyContext?: { finallyEntryId: string }
  ): ProcessResult {
    const checkedText = node.type === "checked_statement" ? "checked" : "unchecked";
    const checkedId = this.generateNodeId(checkedText);
    const checkedNode = this.createSemanticNode(checkedId, checkedText, NodeType.PROCESS, node);

    const nodes = [checkedNode];
    const edges: FlowchartEdge[] = [];
    let exitPoints: { id: string; label?: string }[] = [];
    const nodesConnectedToExit = new Set<string>();

    // Process the body
    const body = node.childForFieldName("body");
    if (body) {
      const bodyResult = this.processStatement(body, exitId, loopContext, finallyContext);
      nodes.push(...bodyResult.nodes);
      edges.push(...bodyResult.edges);

      if (bodyResult.entryNodeId) {
        edges.push({ from: checkedId, to: bodyResult.entryNodeId });
      }

      exitPoints = bodyResult.exitPoints;
      bodyResult.nodesConnectedToExit.forEach(id => nodesConnectedToExit.add(id));
    } else {
      exitPoints = [{ id: checkedId }];
    }

    return this.createProcessResult(nodes, edges, checkedId, exitPoints, nodesConnectedToExit);
  }

  private processUnsafeStatement(
    node: Parser.SyntaxNode,
    exitId: string,
    loopContext?: LoopContext,
    finallyContext?: { finallyEntryId: string }
  ): ProcessResult {
    const unsafeId = this.generateNodeId("unsafe");
    const unsafeNode = this.createSemanticNode(unsafeId, "unsafe", NodeType.PROCESS, node);

    const nodes = [unsafeNode];
    const edges: FlowchartEdge[] = [];
    let exitPoints: { id: string; label?: string }[] = [];
    const nodesConnectedToExit = new Set<string>();

    // Process the body
    const body = node.childForFieldName("body");
    if (body) {
      const bodyResult = this.processStatement(body, exitId, loopContext, finallyContext);
      nodes.push(...bodyResult.nodes);
      edges.push(...bodyResult.edges);

      if (bodyResult.entryNodeId) {
        edges.push({ from: unsafeId, to: bodyResult.entryNodeId });
      }

      exitPoints = bodyResult.exitPoints;
      bodyResult.nodesConnectedToExit.forEach(id => nodesConnectedToExit.add(id));
    } else {
      exitPoints = [{ id: unsafeId }];
    }

    return this.createProcessResult(nodes, edges, unsafeId, exitPoints, nodesConnectedToExit);
  }

  private processFixedStatement(
    node: Parser.SyntaxNode,
    exitId: string,
    loopContext?: LoopContext,
    finallyContext?: { finallyEntryId: string }
  ): ProcessResult {
    const declaration = node.childForFieldName("declaration");
    const fixedText = declaration
      ? `fixed (${this.escapeString(declaration.text)})`
      : "fixed";

    const fixedId = this.generateNodeId("fixed");
    const fixedNode = this.createSemanticNode(fixedId, fixedText, NodeType.PROCESS, node);

    const nodes = [fixedNode];
    const edges: FlowchartEdge[] = [];
    let exitPoints: { id: string; label?: string }[] = [];
    const nodesConnectedToExit = new Set<string>();

    // Process the body
    const body = node.childForFieldName("body");
    if (body) {
      const bodyResult = this.processStatement(body, exitId, loopContext, finallyContext);
      nodes.push(...bodyResult.nodes);
      edges.push(...bodyResult.edges);

      if (bodyResult.entryNodeId) {
        edges.push({ from: fixedId, to: bodyResult.entryNodeId });
      }

      exitPoints = bodyResult.exitPoints;
      bodyResult.nodesConnectedToExit.forEach(id => nodesConnectedToExit.add(id));
    } else {
      exitPoints = [{ id: fixedId }];
    }

    return this.createProcessResult(nodes, edges, fixedId, exitPoints, nodesConnectedToExit);
  }

  private processLocalFunctionStatement(node: Parser.SyntaxNode, exitId: string): ProcessResult {
    const name = node.childForFieldName("name");
    const functionText = name
      ? `local function ${this.escapeString(name.text)}`
      : "local function";

    const functionId = this.generateNodeId("local_func");
    const functionNode = this.createSemanticNode(functionId, functionText, NodeType.PROCESS, node);

    return this.createProcessResult([functionNode], [], functionId, [{ id: functionId }]);
  }

  protected processDefaultStatement(statement: Parser.SyntaxNode): ProcessResult {
    const nodeId = this.generateNodeId("stmt");

    // C#-specific statement processing
    let label = this.escapeString(statement.text);
    let nodeType = NodeType.PROCESS;

    // Handle C#-specific statement types
    switch (statement.type) {
      case "expression_statement":
        // Extract the actual expression from expression_statement
        const expr = statement.children[0];
        if (expr) {
          label = this.escapeString(expr.text);
          nodeType = this.inferCSharpNodeTypeFromExpression(expr);
        }
        break;

      case "local_declaration_statement":
      case "variable_declaration":
        nodeType = NodeType.ASSIGNMENT;
        // Try to extract a cleaner variable declaration text
        const declarator = statement.descendantsOfType("variable_declarator")[0];
        if (declarator) {
          const varName = declarator.childForFieldName("name");
          const initializer = declarator.childForFieldName("initializer");
          if (varName && initializer) {
            label = `${varName.text} = ${this.escapeString(initializer.text)}`;
          } else if (varName) {
            label = `declare ${varName.text}`;
          }
        }
        break;

      case "assignment_expression":
        nodeType = NodeType.ASSIGNMENT;
        break;

      case "invocation_expression":
      case "await_expression":
        nodeType = NodeType.FUNCTION_CALL;
        if (statement.type === "await_expression") {
          nodeType = NodeType.ASYNC_OPERATION;
          const expr = statement.childForFieldName("expression");
          if (expr) {
            label = `await ${this.escapeString(expr.text)}`;
          } else {
            label = "await";
          }
        }
        break;

      case "interpolated_string_expression":
        // Handle string interpolation
        label = this.processInterpolatedString(statement);
        nodeType = NodeType.PROCESS;
        break;

      default:
        nodeType = this.inferCSharpNodeType(statement);
        break;
    }

    const node = this.createSemanticNode(nodeId, label, nodeType, statement);

    this.locationMap.push({
      start: statement.startIndex,
      end: statement.endIndex,
      nodeId,
    });

    return this.createProcessResult([node], [], nodeId, [{ id: nodeId }]);
  }

  private inferCSharpNodeTypeFromExpression(expr: Parser.SyntaxNode): NodeType {
    switch (expr.type) {
      case "assignment_expression":
        return NodeType.ASSIGNMENT;
      case "invocation_expression":
        return NodeType.FUNCTION_CALL;
      case "await_expression":
        return NodeType.ASYNC_OPERATION;
      case "conditional_expression": // ternary operator
        return NodeType.DECISION;
      default:
        return NodeType.PROCESS;
    }
  }

  private inferCSharpNodeType(syntaxNode: Parser.SyntaxNode): NodeType {
    const nodeType = syntaxNode.type.toLowerCase();

    // C#-specific node type inference
    if (nodeType.includes("assignment") || nodeType.includes("declaration")) {
      return NodeType.ASSIGNMENT;
    }

    if (nodeType.includes("invocation") || nodeType.includes("call")) {
      return NodeType.FUNCTION_CALL;
    }

    if (nodeType.includes("await") || nodeType.includes("async")) {
      return NodeType.ASYNC_OPERATION;
    }

    if (nodeType.includes("condition") || nodeType.includes("ternary")) {
      return NodeType.DECISION;
    }

    if (nodeType.includes("interpolat")) {
      return NodeType.PROCESS;
    }

    // Fall back to base class inference
    return this.inferNodeTypeFromSyntax(syntaxNode);
  }

  private processInterpolatedString(node: Parser.SyntaxNode): string {
    // Handle C# string interpolation like $"Error: {ex.Message}"
    const parts: string[] = [];
    
    for (const child of node.children) {
      if (child.type === "interpolated_string_text") {
        parts.push(child.text);
      } else if (child.type === "interpolation") {
        const expression = child.childForFieldName("expression");
        if (expression) {
          parts.push(`{${expression.text}}`);
        } else {
          parts.push("{...}");
        }
      } else if (child.type === '"' || child.type === '$') {
        // Skip string delimiters
        continue;
      } else {
        parts.push(child.text);
      }
    }
    
    return `$"${parts.join('')}"`;
  }
}