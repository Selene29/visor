# C# Test Suite for Visor Extension

This test suite provides comprehensive testing capabilities for the C# language support in the Visor VS Code extension. It allows you to test each C# construct independently and get instant feedback on both tree-sitter parsing and flowchart generation.

## 📁 Directory Structure

```
tests/csharp/
├── README.md                          # This comprehensive guide
├── simple_test_runner.js              # Basic analysis without compilation  
├── integrated_test_runner.js          # Simulation with issue detection
├── vs_code_tester.js                  # Interactive VS Code testing helper
├── test_runner.ts                     # TypeScript version (advanced)
├── basic/                             # Simple method tests
│   ├── simple_method.cs               # Basic return statement
│   └── multiple_returns.cs            # Multiple return paths
├── conditionals/                      # If/else statement tests
│   ├── simple_if_else.cs              # Basic if-else
│   └── nested_if.cs                   # Nested conditionals
├── loops/                             # Loop construct tests
│   ├── for_loop_break_continue.cs     # For loop with break/continue
│   ├── foreach_loop.cs                # Foreach iteration
│   └── while_loop.cs                  # While loop
├── switches/                          # Switch statement tests
│   ├── traditional_switch.cs          # Classic switch with cases
│   └── switch_expressions.cs          # Modern C# switch expressions
├── exceptions/                        # Exception handling tests
│   ├── basic_try_catch.cs             # Simple try-catch
│   └── try_catch_finally.cs           # Full try-catch-finally
├── async/                             # Async/await tests
│   └── async_await.cs                 # Async method patterns
├── properties/                        # Property tests
│   └── property_with_logic.cs         # Properties with getter/setter logic
├── common/                            # Common C# patterns
│   ├── email_validation.cs            # Complex validation logic
│   ├── linq_operations.cs             # LINQ and method chaining
│   ├── constructor_logic.cs           # Constructor with validation
│   └── generic_methods.cs             # Generic methods and constraints
└── issues/                            # Specific issue reproduction
    ├── getgrade_relational_patterns.cs # Switch expression parsing issue
    ├── finally_block_content.cs        # Finally block content issue
    └── simple_add_method.cs            # Simple method representation
```

## 🚀 Running Tests

### 1. Quick Analysis (No Compilation Required)
```bash
cd tests/csharp
node simple_test_runner.js
```

**Provides:**
- File structure analysis
- Construct identification  
- Complexity estimation
- Code snippets
- No dependency on compiled extension

### 2. Integrated Testing (Requires Compilation)
```bash
# First, compile the extension
cd /home/runner/work/visor/visor
npm run compile

# Then run integrated tests
cd tests/csharp
node integrated_test_runner.js
```

**Provides:**
- Simulation of tree-sitter parsing
- Function extraction and analysis
- Flowchart node estimation
- Known issue detection
- Performance metrics

### 3. VS Code Extension Testing (Interactive)
```bash
cd tests/csharp
node vs_code_tester.js
```

**Provides:**
- Interactive menu system
- File browser with categories
- Step-by-step testing instructions
- Known issues checklist
- Expected behavior validation

**Command Line Usage:**
```bash
node vs_code_tester.js list          # List all test files
node vs_code_tester.js show <file>   # Show specific file content
node vs_code_tester.js validate      # Run quick validation
node vs_code_tester.js issues        # Show known issues checklist
```

## 📊 Understanding Test Output

### Simple Test Runner Output
```
🧪 C# Test Suite Runner
==================================================
Found 12 test files

📁 basic/simple_method.cs
   Category: Basic Methods
   Lines: 7
   Estimated Complexity: 1
   Constructs: method_declaration, return_statement
   Method Preview:
     public int Add(int a, int b)
     {
     return a + b;
     }
```

### Advanced Test Runner Output
```
🚀 Advanced C# Test Suite Runner
============================================================
📄 basic/simple_method.cs
Category: Basic Methods | Parse Time: 45ms
✅ Status: SUCCESS

🔍 Functions Found: Add
📊 Flowchart: 3 nodes, 2 edges

🌳 Tree Structure (first 15 lines):
   compilation_unit
     class_declaration
       method_declaration
         identifier [Add]
         return_statement
```

## 🧪 Test Categories

### 1. Basic Methods (`basic/`)
- **simple_method.cs**: Tests basic method with return statement
- **multiple_returns.cs**: Tests multiple return paths

**Expected Issues**: Simple methods should show Start → return → End flowcharts

### 2. Conditionals (`conditionals/`)
- **simple_if_else.cs**: Basic if-else branching  
- **nested_if.cs**: Nested conditional structures

**Expected Issues**: Check if condition nodes are properly created

### 3. Loops (`loops/`)
- **for_loop_break_continue.cs**: For loops with break/continue statements
- **foreach_loop.cs**: Foreach iteration patterns
- **while_loop.cs**: While loop structures

**Expected Issues**: Loop nodes and break/continue flow control

### 4. Switch Statements (`switches/`)
- **traditional_switch.cs**: Classic switch with integer cases
- **switch_expressions.cs**: Modern C# relational patterns (`case >= 90`)

**Expected Issues**: Relational patterns (`>=`, `<=`) may cause parsing errors

### 5. Exception Handling (`exceptions/`)
- **basic_try_catch.cs**: Simple try-catch block
- **try_catch_finally.cs**: Full try-catch-finally with actual content

**Expected Issues**: Finally blocks should show their actual content, not just "finally"

### 6. Async/Await (`async/`)
- **async_await.cs**: Async method patterns with await

**Expected Issues**: Async/await flow representation

### 7. Properties (`properties/`)
- **property_with_logic.cs**: Properties with getter/setter logic

**Expected Issues**: Property accessors as separate flowcharts

## 🐛 Debugging Specific Issues

### Issue 1: GetGrade Switch Expression Error
```bash
# Test the specific switch expression pattern
cd tests/csharp
cat switches/switch_expressions.cs
node advanced_test_runner.js | grep -A 20 "switch_expressions.cs"
```

**What to look for**:
- Tree output should show `relational_pattern` nodes
- No "Syntax error in text" messages
- Proper case handling for `>=`, `<=` operators

### Issue 2: Finally Block Content Missing
```bash
# Test the try-catch-finally pattern
cd tests/csharp
cat exceptions/try_catch_finally.cs
node advanced_test_runner.js | grep -A 30 "try_catch_finally.cs"
```

**What to look for**:
- Finally clause should show actual content (Console.WriteLine statements)
- Tree should include finally_clause with child nodes
- Flowchart should show finally content, not just "finally"

### Issue 3: Simple Method Only Shows Return
```bash
# Test basic method structure
cd tests/csharp
cat basic/simple_method.cs
node advanced_test_runner.js | grep -A 20 "simple_method.cs"
```

**What to look for**:
- For simple methods like `return a + b;`, showing only Start → return → End is correct
- More complex methods should show additional processing nodes

## 🔧 Adding New Test Cases

### 1. Create a new test file
```csharp
// Test: Your specific C# pattern
public class TestClass
{
    public void YourMethod()
    {
        // Your C# code here
    }
}
```

### 2. Place in appropriate category
```bash
# Save to the right directory
touch tests/csharp/your_category/your_test.cs
```

### 3. Run tests to see results
```bash
cd tests/csharp
node simple_test_runner.js | grep "your_test.cs"
```

## 📈 Performance Benchmarking

The advanced test runner provides performance metrics:

```bash
node advanced_test_runner.js | grep -A 10 "Performance:"
```

Expected performance:
- Simple methods: < 50ms
- Complex methods: < 200ms  
- Switch expressions: < 100ms
- Exception handling: < 150ms

## 🔍 Extending the Test Suite

### Adding New Constructs
1. Create test files for the new construct
2. Update construct identification in `identifyConstructs()` method
3. Add category mapping in `getCategory()` method
4. Test with both runners

### Integration with VS Code Extension
1. Compile the extension: `npm run compile`
2. Open VS Code in the project directory
3. Test individual files using the Visor extension
4. Compare results with test runner output

### Debugging Parser Issues
1. Use `advanced_test_runner.js` to see tree structure
2. Compare with expected tree-sitter output
3. Check for missing node types in the parser
4. Verify WASM file loading

## 🎯 Future Enhancements

1. **Visual Diff Tool**: Compare expected vs actual flowcharts
2. **Mermaid Output Testing**: Generate and validate mermaid syntax
3. **Regression Testing**: Save expected outputs and compare
4. **Performance Regression**: Track parsing performance over time
5. **Integration Tests**: Full end-to-end testing with VS Code API

## 🤝 Contributing

When adding new test cases or fixing issues:

1. **Create isolated test cases** for each specific issue
2. **Use descriptive file names** that indicate what is being tested
3. **Include comments** in test files explaining expected behavior
4. **Test with both runners** to verify behavior
5. **Update this README** when adding new categories or features

## 📞 Troubleshooting

### Common Issues

**"Parser not found" errors**:
- Run `npm run compile` in the extension root
- Check that WASM files exist in `src/logic/language-services/csharp/`

**"No functions found"**:
- Verify C# syntax is correct
- Check that methods are marked `public`
- Ensure file contains complete class structure

**Performance issues**:
- Large files may take longer to parse
- Complex nested structures increase parse time
- Check available memory for WASM loading

### Getting Help

1. Check the test output for specific error messages
2. Compare working vs failing test cases
3. Use the simple runner first to verify file structure
4. Check VS Code developer console for additional errors

---

*This test suite is designed to evolve with the C# language support. Add new test cases as you encounter edge cases or new language features.*