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

### 2. Language Server Setup
The VS Code extension uses a custom Language Server for Intellisense and Diagnostics. You must set up the virtual environment and install dependencies:

```bash
# Create and activate venv
python3 -m venv .venv
source .venv/bin/activate

# Install LSP dependencies
pip install -r requirements.txt
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

## VS Code Extension

### 1. Generate the Extension
Run the generator script to build the extension. This generates syntax highlighting, snippets, and the Language Server client:

```bash
python3 scripts/generate_vscode_ext.py
```

### 2. Install Dependencies
The extension requires the `vscode-languageclient` Node module:

```bash
cd vscode-serpiente
npm install
```

### 3. Install the Extension

#### Method A: Manual (Recommended for development)
Symlink the folder to your extensions directory:
- **macOS/Linux:** `ln -s $(pwd)/vscode-serpiente ~/.vscode/extensions/vscode-serpiente`
- **Windows (PowerShell):** `New-Item -ItemType SymbolicLink -Path "$HOME\.vscode\extensions\vscode-serpiente" -Target "$((Get-Item .).FullName)\vscode-serpiente"`

#### Method B: VSIX (Recommended for sharing)
If you have `vsce` installed:
```bash
cd vscode-serpiente
vsce package
```
Then install the resulting `.vsix` file in VS Code.

## Updating

### CLI
If you installed using `pip install -e .`, the CLI updates **automatically**.

### VS Code Extension
Whenever you add a new language or modify mappings, you must:
1. Run `sh generateExtension.sh`
2. Restart VS Code or run the command **"Developer: Reload Window"**.
