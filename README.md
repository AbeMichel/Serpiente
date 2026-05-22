# Serpiente

Serpiente allows you to write and run Python scripts using localized keywords and built-ins. It currently supports **Spanish (`.esp`)**, **French (`.frp`)**, and **Kinyarwanda (`.rwp`)** out of the box.

## Using
Files with the supported language extensions will automatically resolve themselves into normal python. This means that you are able to use imports between languages and use regular python syntax all in the same file. Examples of this are shown in the [examples](./examples/) directory.

Once you've installed the `serpiente CLI` (described below) and optionally the VS Code extension, you can run any supported file using,
```bash
serpiente <scriptName>
```

## Installation

### 1. CLI Installation
To install the `serpiente` CLI globally in your environment:

User
```bash
pip install .
```

Developer
```bash
pip install -e .
```

### Running Scripts
Run any localized script directly using the `serpiente` command:

```bash
serpiente main.esp  # Spanish
serpiente main.frp  # French
```

### Adding New Languages
1. Create a new mapping file in `serpiente/langs/` (e.g., `de.py` for German).
2. Define `FILE_EXTENSION` and the `MAPPING` dictionary.
3. The CLI and VS Code generator will automatically detect the new language.

## VS Code Extension

The Serpiente VS Code extension provides localized Python support by acting as a bidirectional proxy for the official Microsoft Python extension (Pylance).

### Architecture: Shadow Workspace Proxy

Unlike traditional LSPs, Serpiente does not implement its own static analysis engine. Instead, it manages a "Shadow Workspace" and proxies requests to Pylance:

1.  **Shadow Mirroring**: All localized files (`.esp`, `.frp`, `.rwp`) are translated into standard Python and cached in a hidden `.serpiente_cache/` directory within the workspace.
2.  **Position Mapping**: A custom translation engine maintains a bidirectional character-offset map for every line. This allows the extension to map positions between localized source code and the translated Python mirror, accounting for keyword length differences.
3.  **LSP Proxying**: When a user requests Intellisense (Autocomplete, Hover, Go to Definition), the extension:
    - Maps the cursor position to the shadow Python file.
    - Queries the Python extension via the VS Code API.
    - Intercepts the response, remaps the coordinates back to the original file, and localizes any Python keywords in the UI.
4.  **Diagnostics**: Syntax errors and type warnings detected by Pylance in the shadow files are remapped and displayed as native Serpiente errors.

### Project Structure

- `serpiente/`: Python core logic and language definitions.
  - `langs/`: Language mapping definitions (Spanish, French, Kinyarwanda).
- `vscode-serpiente/`: TypeScript-based VS Code extension.
  - `src/translator.ts`: Bidirectional translation and mapping engine.
  - `src/shadowWorkspace.ts`: Cache and file synchronization manager.
  - `src/providers.ts`: Intellisense proxy implementation.
  - `src/diagnostics.ts`: Error remapping and reporting.
- `scripts/generate_vscode_ext.py`: Utility to generate static assets and `mappings.json` for the extension.

### Setup and Development

1.  Ensure the official Python extension for VS Code is installed.
2.  Generate extension assets: `python3 scripts/generate_vscode_ext.py`.
3.  Build and package the extension:
    ```bash
    cd vscode-serpiente
    npm install
    npm run compile
    ```
4.  Launch the extension in VS Code via the `Extension Development Host` (F5) or package it as a `.vsix` file using `vsce package`.

### Updating the Extension
Whenever you add a new language or modify mappings:
1. Run `python3 scripts/generate_vscode_ext.py`.
2. Rebuild the extension (`npm run compile`).
3. Reload the VS Code window.
