# Serpiente 🐍

Serpiente allows you to write and run Python scripts using localized keywords and built-ins. It currently supports **Spanish (`.esp`)** and **French (`.frp`)** out of the box.

## Installation

To install the `serpiente` CLI globally in your environment:

```bash
pip install -e .
```

## Usage

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

## Updating

### CLI
If you installed using `pip install -e .`, the CLI updates **automatically**. Any changes you make to the source code or language mappings in `serpiente/langs/` will take effect the next time you run the `serpiente` command.

### VS Code Extension
Whenever you add a new language or modify mappings, you must regenerate the extension:

1. Run the generator: `python3 scripts/generate_vscode_ext.py`
2. Restart VS Code or run the command **"Developer: Reload Window"** from the Command Palette.

### 1. Generate the Extension
Run the generator script to build the extension based on current language mappings. This script generates syntax highlighting, autocomplete snippets, and **language configurations for auto-indentation and Intellisense**:

```bash
python3 scripts/generate_vscode_ext.py
```

### 2. Install
The generator creates a `vscode-serpiente` folder. To install it:

#### Method A: VSIX (Recommended for sharing)
If you have `vsce` installed, you can package it into a `.vsix` file:
```bash
cd vscode-serpiente
vsce package
```
Then in VS Code, go to the Extensions view, click the `...` menu, and select **Install from VSIX...**.

#### Method B: Manual (Recommended for development)
Copy or symlink the folder to your extensions directory:
- **macOS/Linux:** `ln -s $(pwd)/vscode-serpiente ~/.vscode/extensions/vscode-serpiente`
- **Windows (PowerShell):** `New-Item -ItemType SymbolicLink -Path "$HOME\.vscode\extensions\vscode-serpiente" -Target "$((Get-Item .).FullName)\vscode-serpiente"`

Then restart VS Code.
