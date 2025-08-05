#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple test runner that just analyzes the structure without requiring full compilation
class SimpleCSharpTester {
  constructor() {
    this.testDir = path.join(__dirname);
  }

  runAllTests() {
    console.log('🧪 C# Test Suite Runner');
    console.log('=' .repeat(50));

    const testFiles = this.getTestFiles(this.testDir);
    console.log(`Found ${testFiles.length} test files\n`);

    const results = [];
    
    for (const filePath of testFiles) {
      const result = this.analyzeFile(filePath);
      results.push(result);
      this.printFileAnalysis(result);
    }

    // Create a summary report
    this.createSummaryReport(results);
    
    return results;
  }

  getTestFiles(dir) {
    const files = [];
    
    if (!fs.existsSync(dir)) {
      return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        files.push(...this.getTestFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.cs')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  analyzeFile(filePath) {
    const fileName = path.relative(this.testDir, filePath);
    const source = fs.readFileSync(filePath, 'utf-8');
    
    const result = {
      fileName,
      filePath,
      source,
      category: this.getCategory(fileName),
      constructs: this.identifyConstructs(source),
      complexity: this.estimateComplexity(source),
      lineCount: source.split('\n').length
    };

    return result;
  }

  getCategory(fileName) {
    if (fileName.includes('basic/')) return 'Basic Methods';
    if (fileName.includes('conditionals/')) return 'Conditionals';
    if (fileName.includes('loops/')) return 'Loops';
    if (fileName.includes('switches/')) return 'Switch Statements';
    if (fileName.includes('exceptions/')) return 'Exception Handling';
    if (fileName.includes('async/')) return 'Async/Await';
    if (fileName.includes('properties/')) return 'Properties';
    return 'Other';
  }

  identifyConstructs(source) {
    const constructs = [];
    
    // Method signatures
    if (source.match(/public\s+\w+\s+\w+\s*\(/)) {
      constructs.push('method_declaration');
    }
    
    // Control flow
    if (source.includes('if (')) constructs.push('if_statement');
    if (source.includes('else')) constructs.push('else_clause');
    if (source.includes('for (')) constructs.push('for_statement');
    if (source.includes('foreach (')) constructs.push('foreach_statement');
    if (source.includes('while (')) constructs.push('while_statement');
    if (source.includes('switch (')) constructs.push('switch_statement');
    if (source.includes('case >=') || source.includes('case >') || source.includes('case <')) {
      constructs.push('relational_pattern');
    }
    if (source.includes('case ')) constructs.push('switch_section');
    
    // Exception handling
    if (source.includes('try')) constructs.push('try_statement');
    if (source.includes('catch')) constructs.push('catch_clause');
    if (source.includes('finally')) constructs.push('finally_clause');
    
    // Flow control
    if (source.includes('return')) constructs.push('return_statement');
    if (source.includes('break')) constructs.push('break_statement');
    if (source.includes('continue')) constructs.push('continue_statement');
    
    // Async
    if (source.includes('async')) constructs.push('async_method');
    if (source.includes('await')) constructs.push('await_expression');
    
    // Properties
    if (source.includes('get')) constructs.push('accessor_declaration');
    if (source.includes('set')) constructs.push('accessor_declaration');
    
    return constructs;
  }

  estimateComplexity(source) {
    let complexity = 1; // Base complexity
    
    // Add complexity for decision points
    complexity += (source.match(/if\s*\(/g) || []).length;
    complexity += (source.match(/else\s+if/g) || []).length;
    complexity += (source.match(/case\s+/g) || []).length;
    complexity += (source.match(/catch\s*\(/g) || []).length;
    complexity += (source.match(/\?\s*:/g) || []).length; // Ternary operators
    complexity += (source.match(/&&|\|\|/g) || []).length; // Logical operators
    
    return complexity;
  }

  printFileAnalysis(result) {
    console.log(`\n📁 ${result.fileName}`);
    console.log(`   Category: ${result.category}`);
    console.log(`   Lines: ${result.lineCount}`);
    console.log(`   Estimated Complexity: ${result.complexity}`);
    console.log(`   Constructs: ${result.constructs.join(', ')}`);
    
    // Show a snippet of the code
    const lines = result.source.split('\n');
    const methodStart = lines.findIndex(line => line.trim().includes('public '));
    if (methodStart !== -1) {
      console.log(`   Method Preview:`);
      for (let i = methodStart; i < Math.min(methodStart + 5, lines.length); i++) {
        console.log(`     ${lines[i].trim()}`);
      }
      if (methodStart + 5 < lines.length) {
        console.log(`     ...`);
      }
    }
  }

  createSummaryReport(results) {
    console.log('\n\n📊 SUMMARY REPORT');
    console.log('=' .repeat(50));
    
    // Group by category
    const byCategory = {};
    results.forEach(result => {
      if (!byCategory[result.category]) {
        byCategory[result.category] = [];
      }
      byCategory[result.category].push(result);
    });
    
    Object.keys(byCategory).forEach(category => {
      console.log(`\n${category}: ${byCategory[category].length} files`);
      byCategory[category].forEach(result => {
        console.log(`  • ${path.basename(result.fileName)} (complexity: ${result.complexity})`);
      });
    });
    
    // All constructs found
    const allConstructs = new Set();
    results.forEach(result => {
      result.constructs.forEach(construct => allConstructs.add(construct));
    });
    
    console.log(`\n📋 All C# Constructs Tested:`);
    Array.from(allConstructs).sort().forEach(construct => {
      console.log(`  • ${construct}`);
    });
    
    // Save detailed report
    const reportPath = path.join(this.testDir, 'test_analysis_report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      summary: {
        totalFiles: results.length,
        categories: Object.keys(byCategory),
        constructs: Array.from(allConstructs)
      },
      details: results
    }, null, 2));
    
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new SimpleCSharpTester();
  tester.runAllTests();
}

module.exports = SimpleCSharpTester;