#!/usr/bin/env node

/**
 * VS Code Extension Tester
 * This script helps test individual C# files with the actual VS Code extension
 * by providing clear instructions and validation steps
 */

const fs = require('fs');
const path = require('path');

class VSCodeExtensionTester {
  constructor() {
    this.testDir = path.join(__dirname);
    this.extensionPath = path.join(__dirname, '../../');
  }

  showMainMenu() {
    console.log('\n🔧 VS Code Extension Tester for C# Support');
    console.log('═'.repeat(60));
    console.log('1. List all test files');
    console.log('2. Show specific test file');
    console.log('3. Get testing instructions for a file');
    console.log('4. Run quick validation');
    console.log('5. Show known issues checklist');
    console.log('6. Exit');
    console.log('═'.repeat(60));
  }

  listAllTestFiles() {
    console.log('\n📁 Available Test Files:');
    console.log('─'.repeat(40));
    
    const files = this.getTestFiles(this.testDir);
    const categories = {};
    
    files.forEach(filePath => {
      const relativePath = path.relative(this.testDir, filePath);
      const category = relativePath.split('/')[0];
      
      if (!categories[category]) {
        categories[category] = [];
      }
      
      categories[category].push({
        name: path.basename(filePath),
        path: relativePath,
        fullPath: filePath
      });
    });
    
    Object.keys(categories).sort().forEach(category => {
      console.log(`\n📂 ${category.toUpperCase()}:`);
      categories[category].forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name}`);
      });
    });
    
    console.log(`\n📊 Total: ${files.length} test files`);
    return categories;
  }

  showTestFile(filePath) {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(this.testDir, filePath);
    
    console.log(`\n📄 ${relativePath}`);
    console.log('─'.repeat(60));
    
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      console.log(`${(i + 1).toString().padStart(3)}: ${line}`);
    });
    
    console.log('─'.repeat(60));
    
    // Extract functions for quick reference
    const functions = this.extractFunctions(content);
    if (functions.length > 0) {
      console.log(`🔧 Functions: ${functions.join(', ')}`);
    }
    
    // Show complexity estimate
    const complexity = this.estimateComplexity(content);
    console.log(`📊 Estimated Complexity: ${complexity}`);
  }

  getTestingInstructions(filePath) {
    const relativePath = path.relative(this.testDir, filePath);
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const functions = this.extractFunctions(content);
    
    console.log(`\n🧪 Testing Instructions for ${fileName}`);
    console.log('═'.repeat(60));
    
    console.log('\n📋 STEP 1: Open in VS Code');
    console.log(`   1. Open VS Code in the project directory`);
    console.log(`   2. Open file: ${relativePath}`);
    console.log(`   3. Make sure Visor extension is enabled`);
    
    console.log('\n📋 STEP 2: Generate Flowchart');
    if (functions.length > 0) {
      functions.forEach((func, i) => {
        console.log(`   ${i + 1}. Select the ${func} method (lines with the method)`);
        console.log(`   ${i + 1}. Right-click → "Generate Flowchart"`);
        console.log(`   ${i + 1}. Or use Command Palette → "Visor: Generate Flowchart"`);
      });
    } else {
      console.log(`   1. Select the entire class or method`);
      console.log(`   2. Right-click → "Generate Flowchart"`);
    }
    
    console.log('\n📋 STEP 3: Verify Output');
    this.getExpectedBehavior(relativePath, content);
    
    console.log('\n📋 STEP 4: Check for Issues');
    this.getKnownIssues(relativePath, content);
    
    console.log('\n💡 DEBUGGING TIPS:');
    console.log('   • Check VS Code Developer Console (Help → Toggle Developer Tools)');
    console.log('   • Look for parsing errors in the console');
    console.log('   • Verify the C# WASM file loaded correctly');
    console.log('   • Try smaller code selections if full method fails');
  }

  getExpectedBehavior(relativePath, content) {
    console.log('\n✅ Expected Behavior:');
    
    if (relativePath.includes('simple_method') || relativePath.includes('simple_add')) {
      console.log('   • Should show: Start → return a + b → End');
      console.log('   • Simple flowchart with 3 nodes');
      console.log('   • This is CORRECT behavior for simple methods');
    }
    
    if (content.includes('switch') && content.includes('case >=')) {
      console.log('   • Should handle relational patterns (>=, <=, >, <)');
      console.log('   • Should NOT show "Syntax error in text"');
      console.log('   • Each case should be a separate decision node');
    }
    
    if (content.includes('finally') && content.includes('Console.WriteLine')) {
      console.log('   • Finally block should show actual content');
      console.log('   • Should display "Console.WriteLine(...)" not just "finally"');
      console.log('   • Finally node should connect to its content');
    }
    
    if (content.includes('foreach') || content.includes('for (')) {
      console.log('   • Loop should show entry, condition, body, and exit');
      console.log('   • Break/continue statements should show proper flow');
    }
    
    if (content.includes('if (') && content.includes('else')) {
      console.log('   • Should show diamond decision node');
      console.log('   • True/false branches should be clearly labeled');
      console.log('   • Nested conditions should show proper nesting');
    }
  }

  getKnownIssues(relativePath, content) {
    console.log('\n⚠️  Known Issues to Check:');
    
    if (content.includes('case >=') || content.includes('case <=')) {
      console.log('   🔍 ISSUE: Switch expressions with relational patterns');
      console.log('      • Check if it shows "Syntax error in text"');
      console.log('      • Verify relational patterns are parsed correctly');
    }
    
    if (content.includes('finally')) {
      console.log('   🔍 ISSUE: Finally block content');
      console.log('      • Check if finally shows actual content or just "finally"');
      console.log('      • Verify Console.WriteLine statements appear');
    }
    
    if (relativePath.includes('simple') && content.includes('return')) {
      console.log('   🔍 ISSUE: Simple method representation');
      console.log('      • Simple methods SHOULD only show Start → return → End');
      console.log('      • This is expected behavior, not a bug');
    }
  }

  runQuickValidation() {
    console.log('\n🔍 Quick Validation Checklist');
    console.log('═'.repeat(60));
    
    // Check extension compilation
    const distExists = fs.existsSync(path.join(this.extensionPath, 'dist'));
    console.log(`✅ Extension compiled: ${distExists ? 'YES' : 'NO'}`);
    
    if (!distExists) {
      console.log('   ⚠️  Run: npm run compile');
    }
    
    // Check WASM files
    const wasmPath = path.join(this.extensionPath, 'dist', 'tree-sitter-c-sharp.wasm');
    const wasmExists = fs.existsSync(wasmPath);
    console.log(`✅ C# WASM file: ${wasmExists ? 'YES' : 'NO'}`);
    
    if (wasmExists) {
      const wasmSize = fs.statSync(wasmPath).size;
      console.log(`   📦 Size: ${(wasmSize / 1024 / 1024).toFixed(2)} MB`);
    }
    
    // Check test files
    const testFiles = this.getTestFiles(this.testDir);
    console.log(`✅ Test files available: ${testFiles.length}`);
    
    // List problematic test cases
    console.log('\n⚠️  Test Files with Known Issues:');
    const problematicFiles = testFiles.filter(f => {
      const content = fs.readFileSync(f, 'utf-8');
      return content.includes('case >=') || content.includes('finally');
    });
    
    problematicFiles.forEach(f => {
      const relativePath = path.relative(this.testDir, f);
      console.log(`   • ${relativePath}`);
    });
  }

  showKnownIssuesChecklist() {
    console.log('\n📋 Known Issues Checklist');
    console.log('═'.repeat(60));
    
    console.log('\n1. 🔍 GetGrade Switch Expression Issue:');
    console.log('   File: issues/getgrade_relational_patterns.cs');
    console.log('   Problem: "Syntax error in text" when using case >= 90');
    console.log('   Fix Status: Should be fixed in recent commits');
    console.log('   Test: Select GetGrade method and generate flowchart');
    
    console.log('\n2. 🔍 Finally Block Content Issue:');
    console.log('   File: issues/finally_block_content.cs');
    console.log('   Problem: Finally shows just "finally" instead of actual content');
    console.log('   Fix Status: Needs investigation');
    console.log('   Test: Select ComplexCalculation method and check finally node');
    
    console.log('\n3. 🔍 Simple Method Representation:');
    console.log('   File: issues/simple_add_method.cs');
    console.log('   Problem: Only shows Start → return → End');
    console.log('   Fix Status: This is CORRECT behavior');
    console.log('   Test: Simple methods should have minimal flowcharts');
    
    console.log('\n4. 🔍 Relational Pattern Parsing:');
    console.log('   Files: switches/switch_expressions.cs');
    console.log('   Problem: Modern C# patterns may not parse correctly');
    console.log('   Fix Status: Parser updated to handle relational_pattern nodes');
    console.log('   Test: All switch expressions with >=, <=, >, < operators');
    
    console.log('\n📊 Priority Order:');
    console.log('   1. Switch expressions (blocking user workflows)');
    console.log('   2. Finally block content (confusing output)');
    console.log('   3. Complex pattern matching (edge cases)');
  }

  extractFunctions(content) {
    const functions = [];
    const methodRegex = /public\s+(?:async\s+)?(?:static\s+)?[\w<>[\]]+\s+(\w+)\s*\(/g;
    const constructorRegex = /public\s+(\w+)\s*\(/g;
    
    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }
    
    while ((match = constructorRegex.exec(content)) !== null) {
      // Only add if it looks like a constructor (same name as class)
      if (content.includes(`class ${match[1]}`)) {
        functions.push(`${match[1]} (constructor)`);
      }
    }
    
    return functions;
  }

  estimateComplexity(content) {
    let complexity = 1;
    complexity += (content.match(/if\s*\(/g) || []).length;
    complexity += (content.match(/case\s+/g) || []).length;
    complexity += (content.match(/catch\s*\(/g) || []).length;
    complexity += (content.match(/\?\s*:/g) || []).length;
    return complexity;
  }

  getTestFiles(dir) {
    const files = [];
    
    if (!fs.existsSync(dir)) return files;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        files.push(...this.getTestFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.cs')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  async runInteractiveMode() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askQuestion = (question) => {
      return new Promise((resolve) => {
        rl.question(question, resolve);
      });
    };

    let running = true;
    while (running) {
      this.showMainMenu();
      const choice = await askQuestion('\nEnter your choice (1-6): ');
      
      switch (choice.trim()) {
        case '1':
          this.listAllTestFiles();
          break;
          
        case '2':
          const categories = this.listAllTestFiles();
          const fileName = await askQuestion('\nEnter file name or path: ');
          const matchingFiles = this.getTestFiles(this.testDir).filter(f => 
            f.includes(fileName) || path.basename(f) === fileName
          );
          
          if (matchingFiles.length === 1) {
            this.showTestFile(matchingFiles[0]);
          } else if (matchingFiles.length > 1) {
            console.log('\nMultiple matches found:');
            matchingFiles.forEach((f, i) => {
              console.log(`${i + 1}. ${path.relative(this.testDir, f)}`);
            });
          } else {
            console.log('❌ No matching files found');
          }
          break;
          
        case '3':
          const fileName2 = await askQuestion('\nEnter file name for testing instructions: ');
          const matchingFiles2 = this.getTestFiles(this.testDir).filter(f => 
            f.includes(fileName2) || path.basename(f) === fileName2
          );
          
          if (matchingFiles2.length === 1) {
            this.getTestingInstructions(matchingFiles2[0]);
          } else {
            console.log('❌ No matching file found or multiple matches');
          }
          break;
          
        case '4':
          this.runQuickValidation();
          break;
          
        case '5':
          this.showKnownIssuesChecklist();
          break;
          
        case '6':
          running = false;
          break;
          
        default:
          console.log('❌ Invalid choice. Please enter 1-6.');
      }
      
      if (running) {
        await askQuestion('\nPress Enter to continue...');
      }
    }
    
    rl.close();
    console.log('\n👋 Goodbye!');
  }
}

// Run in interactive mode if called directly
if (require.main === module) {
  const tester = new VSCodeExtensionTester();
  
  // Check if specific arguments provided
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Interactive mode
    tester.runInteractiveMode().catch(console.error);
  } else {
    // Command line mode
    const command = args[0];
    
    switch (command) {
      case 'list':
        tester.listAllTestFiles();
        break;
      case 'validate':
        tester.runQuickValidation();
        break;
      case 'issues':
        tester.showKnownIssuesChecklist();
        break;
      case 'show':
        if (args[1]) {
          const files = tester.getTestFiles(tester.testDir).filter(f => 
            f.includes(args[1]) || path.basename(f) === args[1]
          );
          if (files.length === 1) {
            tester.showTestFile(files[0]);
          } else {
            console.log('File not found or multiple matches');
          }
        }
        break;
      default:
        console.log('Usage: node vs_code_tester.js [list|validate|issues|show <filename>]');
    }
  }
}

module.exports = VSCodeExtensionTester;