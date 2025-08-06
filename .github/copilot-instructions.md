# Visor - VS Code Extension for Multi-Language Code-to-Flowchart Visualization

Visor is a TypeScript-based VS Code extension that generates real-time, interactive flowcharts for code in 6+ programming languages (Python, TypeScript/JavaScript, Java, C++, C, C#). It uses Tree-sitter for parsing and Mermaid.js for diagram rendering with cyclomatic complexity analysis.

**ALWAYS reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Quick Bootstrap & Build Process
- Prerequisites: Node.js v20+ (verified v20.19.4), Yarn 1.22+ (verified 1.22.22)
- Install dependencies: `yarn install` -- takes 45 seconds. NEVER CANCEL. Set timeout to 300+ seconds.
- Development build: `yarn compile` -- takes 4 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
- Production build: `yarn package` -- takes 6 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
- Watch mode: `yarn watch` -- compiles in ~3.4 seconds, then watches for changes
- Lint code: `yarn lint` -- takes 2 seconds (expect 48 warnings about curly braces - these are acceptable)

### Critical Build Timing Expectations
- **yarn install**: 45 seconds (network dependent). NEVER CANCEL before 5 minutes.
- **yarn compile**: 4 seconds. NEVER CANCEL before 2 minutes.
- **yarn package**: 6 seconds. NEVER CANCEL before 2 minutes.  
- **yarn watch**: Initial build ~3.4 seconds, then watches. NEVER CANCEL.
- **yarn lint**: 2 seconds. NEVER CANCEL before 30 seconds.

### Testing & Validation
- **CRITICAL**: The main VS Code test suite (`yarn test`) requires internet connectivity to download VS Code and will fail in restricted environments.
- **Alternative Testing**: Use the comprehensive C# test runners in `tests/csharp/` (20 test files across 8 categories):
  - `cd tests/csharp && node simple_test_runner.js` -- takes <100ms, analyzes all test files
  - `cd tests/csharp && node integrated_test_runner.js` -- takes <100ms, simulates parsing  
  - `cd tests/csharp && node vs_code_tester.js` -- interactive testing helper with menu
  - Always run these after making changes to language parsers
- **Test Categories**: basic/, conditionals/, loops/, switches/, exceptions/, async/, properties/, common/, issues/
- **Manual Extension Testing**: Use VS Code F5 debug mode to launch Extension Development Host

## Project Structure & Key Files

### Repository Root Files
```
.
├── .vscode/           # VS Code config (tasks, launch settings)
├── .github/           # GitHub configuration 
├── src/               # TypeScript source code
├── tests/             # Test files and runners
├── media/             # Extension icons and assets
├── dist/              # Compiled extension output
├── package.json       # Extension manifest and dependencies
├── tsconfig.json      # TypeScript configuration
├── webpack.config.js  # Build configuration with WASM copying
├── eslint.config.mjs  # Linting rules
└── yarn.lock          # Dependency lock file
```

### Source Code Organization  
```
src/
├── extension.ts                    # Extension entry point
├── view/                          # UI components
│   ├── BaseFlowchartProvider.ts   # Shared webview logic
│   ├── FlowchartViewProvider.ts   # Sidebar integration
│   └── FlowchartPanelProvider.ts  # External window management
├── logic/                         # Core parsing logic
│   ├── analyzer.ts               # Language router
│   ├── EnhancedMermaidGenerator.ts # Flowchart generation
│   ├── language-services/        # Language-specific parsers
│   │   ├── python/
│   │   ├── typescript/
│   │   ├── java/
│   │   ├── cpp/
│   │   ├── c/
│   │   └── csharp/
│   └── utils/
│       ├── ComplexityAnalyzer.ts # McCabe complexity calculation
│       └── StringProcessor.ts    # String utilities
├── ir/
│   └── ir.ts                     # Intermediate representation
└── types/                        # TypeScript declarations
```

## Development Workflow

### Setting Up Development Environment
1. **Clone and Bootstrap**: 
   ```bash
   git clone <repo-url>
   cd visor
   yarn install  # 45 seconds - NEVER CANCEL
   ```

2. **Development Build**:
   ```bash
   yarn compile  # 4 seconds - builds extension.js and copies WASM files
   ```

3. **Start VS Code Development**:
   ```bash
   code .  # Open project in VS Code
   # Press F5 to launch Extension Development Host
   # OR use "Run Extension" from Run and Debug panel
   ```

### Making Code Changes
1. **Watch Mode for Active Development**:
   ```bash
   yarn watch  # Automatically rebuilds on file changes
   ```

2. **Always lint before committing**:
   ```bash
   yarn lint  # Expect 48 curly brace warnings - these are acceptable
   ```

3. **Test your changes**:
   ```bash
   cd tests/csharp
   node simple_test_runner.js     # Quick analysis
   node integrated_test_runner.js # Simulated parsing test
   ```

4. **Manual Extension Testing**:
   - Press F5 in VS Code to launch Extension Development Host
   - Open test files (test_csharp_features.cs, test_c_features.c)
   - Click Visor icon in Activity Bar
   - Place cursor inside functions to see flowcharts
   - Test complexity metrics display
   - Test export functionality (SVG/PNG)

## Extension Functionality Testing

### Manual Extension Testing - Complete Validation Workflow

**CRITICAL**: Always manually test the extension functionality after making changes. Simply building is NOT sufficient validation.

#### Complete User Scenario Testing (REQUIRED)
After building (`yarn compile`), perform these end-to-end scenarios in VS Code Extension Development Host:

1. **Launch Extension Development Host**:
   ```bash
   code .  # Open project in VS Code
   # Press F5 OR use "Run Extension" from Run and Debug panel
   ```

2. **Test Basic C# Functionality**:
   - Open `test_csharp_features.cs` in Extension Development Host
   - Click Visor icon in Activity Bar (sidebar should open)
   - Place cursor inside `Add` method on line 9
   - **VERIFY**: Flowchart appears showing Start → return a + b → End
   - **VERIFY**: Complexity panel shows "Low (CC=1)" 
   - **VERIFY**: Click flowchart nodes → cursor jumps to corresponding code

3. **Test Complex Method Analysis**:
   - Place cursor inside `ComplexCalculation` method on line 14
   - **VERIFY**: Flowchart shows multiple decision diamonds for if statements
   - **VERIFY**: Loop node appears for foreach loop
   - **VERIFY**: Try/catch/finally blocks are rendered
   - **VERIFY**: Complexity shows Medium/High with ⚠️ or 🔴 indicators on nodes
   - **VERIFY**: Finally block shows actual content (Console.WriteLine), not just "finally"

4. **Test Multi-Language Support**:
   - Open `test_c_features.c`  
   - Place cursor inside `fibonacci` function
   - **VERIFY**: C parsing works, flowchart generates
   - **VERIFY**: Switch statement renders correctly
   - Create simple Python file with function, test parsing

5. **Test Interactive Features**:
   - Click various flowchart nodes → **VERIFY** cursor jumps to code
   - Move cursor through code lines → **VERIFY** flowchart nodes highlight
   - Click 🚀 "Open in New Window" → **VERIFY** external window opens
   - Test pan/zoom in external window → **VERIFY** controls work
   - Test SVG/PNG export → **VERIFY** files download correctly

6. **Test Error Handling**:
   - Open file with syntax errors → **VERIFY** extension doesn't crash
   - Place cursor outside functions → **VERIFY** graceful handling
   - Test with very large functions → **VERIFY** reasonable performance (<5 seconds)

#### Performance Validation
- Simple methods (Add, Max): Should generate flowchart in <200ms
- Complex methods (ComplexCalculation): Should complete in <1 second  
- WASM loading (first use per language): <1 second
- External window launch: <500ms

**If any scenario fails, debug using VS Code Developer Console (Help > Toggle Developer Tools) and fix before proceeding.**

### Common Extension Issues & Fixes

**Flowchart not generating**:
- Ensure cursor is inside a function/method
- Check VS Code Developer Console (Help > Toggle Developer Tools)
- Try "Visor: Generate Flowchart" from Command Palette (Cmd/Ctrl+Shift+P)

**WASM loading errors**:
- Run `yarn compile` to ensure WASM files are copied to dist/
- Check that tree-sitter-*.wasm files exist in dist/ directory

**Performance issues**: 
- Large functions may take 2-3 seconds to parse - this is normal
- Complex nested structures increase parse time

## Language Parser Development

### Adding New Language Support
1. **Add Tree-sitter Grammar**: Place WASM file in `src/logic/language-services/[language]/`
2. **Create Parser Class**: Extend `AbstractParser` in new language directory  
3. **Update Webpack Config**: Add WASM file copy rule to webpack.config.js
4. **Register Language**: Add to analyzer.ts and language-services/index.ts
5. **Test thoroughly**: Create test files and validate parsing

### Parser Architecture
- **AbstractParser**: Base class with complexity analysis and semantic node creation
- **Language-specific parsers**: Handle language syntax and AST traversal
- **FlowchartIR**: Intermediate representation with node types and complexity metrics
- **EnhancedMermaidGenerator**: Converts IR to Mermaid.js syntax with styling

## Build System Details

### Webpack Configuration
- **Entry**: src/extension.ts  
- **Output**: dist/extension.js (CommonJS for Node.js)
- **WASM Files**: Automatically copied to dist/ for 6 languages + web-tree-sitter
- **Development**: No minification, source maps disabled
- **Production**: Minified output (~252KB vs ~460KB)

### Dependencies
- **Runtime**: @vscode/tree-sitter-wasm, web-tree-sitter
- **Development**: TypeScript, Webpack, ESLint, VS Code test framework
- **Tree-sitter Languages**: Python, TypeScript, Java, C++, C, C# parsers as WASM

### Scripts Reference
```json
{
  "compile": "yarn clean && webpack",
  "watch": "webpack --watch", 
  "package": "yarn clean && webpack --mode production",
  "lint": "eslint src",
  "test": "yarn pretest && vscode-test",
  "pretest": "yarn compile-tests && yarn compile && yarn lint"
}
```

## Configuration & Settings

The extension supports these VS Code settings:
- `visor.nodeReadability.theme`: Theme for flowchart nodes (monokai, github, etc.)
- `visor.complexity.*`: Complexity analysis settings and thresholds  
- `visor.panel.*`: External window behavior and positioning

## Common Tasks Quick Reference

### Daily Development
```bash
# Start development session
yarn install && yarn watch
# In another terminal/VS Code: Press F5 to debug

# Before committing
yarn lint && cd tests/csharp && node integrated_test_runner.js
```

### Release Preparation
```bash
yarn package  # Production build
yarn lint     # Check for issues
# Manual testing in Extension Development Host
```

### Debugging Parser Issues
```bash
cd tests/csharp
node simple_test_runner.js | grep "your-test-file"     # Quick analysis
node integrated_test_runner.js | grep -A 20 "your-test-file"  # Detailed parsing
```

### Performance Monitoring
- Simple methods: <100ms parse time
- Complex methods: <300ms parse time  
- WASM loading: <500ms on first use per language

## Troubleshooting

### Build Issues
- **"Cannot find module" errors**: Run `yarn install`  
- **WASM not found errors**: Run `yarn compile` to copy files
- **TypeScript errors**: Check tsconfig.json, ensure Node.js v20+

### Extension Development
- **Extension not loading**: Check VS Code version (requires 1.102.0+)
- **Flowcharts not showing**: Verify Extension Development Host launched correctly
- **Parser errors**: Check Developer Console for specific error messages

### Network-Related Issues
- **yarn test fails**: This is expected in restricted environments - use C# test runners instead
- **yarn install slow**: Network dependent, may take up to 5 minutes

---

**Remember**: Always run `yarn compile` after making changes to TypeScript code. Always test with the C# test runners and manual Extension Development Host scenarios before committing changes.