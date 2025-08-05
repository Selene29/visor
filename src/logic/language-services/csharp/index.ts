import { CSharpAstParser } from "./CSharpAstParser";
import { FlowchartIR } from "../../../ir/ir";

let parserPromise: Promise<CSharpAstParser> | null = null;

/**
 * Initializes the C# language service.
 * @param wasmPath The absolute path to the tree-sitter-c-sharp.wasm file.
 */
export function initCSharpLanguageService(wasmPath: string) {
  parserPromise = CSharpAstParser.create(wasmPath);
}

/**
 * Analyzes C# code.
 */
export async function analyzeCSharpCode(
  code: string,
  position: number
): Promise<FlowchartIR> {
  if (!parserPromise) {
    throw new Error("C# language service not initialized.");
  }
  const parser = await parserPromise;
  return parser.generateFlowchart(code, undefined, position);
}

export { CSharpAstParser };