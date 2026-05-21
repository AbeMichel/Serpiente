const { LanguageClient } = require('vscode-languageclient/node');
const vscode = require('vscode');
const path = require('path');
const os = require('os');
const fs = require('fs');

let client;

function activate(context) {
    console.log('Serpiente extension activating...');

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        console.log('No workspace folder found.');
        return;
    }

    const projectRoot = workspaceFolders[0].uri.fsPath;
    const isWindows = os.platform() === 'win32';
    const pythonBinary = isWindows ? 'Scripts/python.exe' : 'bin/python';
    
    // 1. Try workspace .venv
    let pythonPath = path.join(projectRoot, '.venv', pythonBinary);
    
    // 2. Fallback to a hardcoded path for the developer environment
    if (!fs.existsSync(pythonPath)) {
        pythonPath = '/Users/abrahammichel/Projects/Serpiente/.venv/bin/python';
    }

    const serverPath = path.join(projectRoot, 'serpiente', 'lsp.py');

    console.log('Using Python:', pythonPath);
    console.log('Using Server:', serverPath);

    if (!fs.existsSync(pythonPath)) {
        vscode.window.showErrorMessage(`Serpiente: Could not find Python venv at ${pythonPath}`);
        return;
    }

    const serverOptions = {
        command: pythonPath,
        args: [serverPath],
    };

    const clientOptions = {
        documentSelector: [
            { scheme: 'file', language: 'python-esp' },
            { scheme: 'file', language: 'python-frp' }
        ],
    };

    client = new LanguageClient(
        'serpienteLSP',
        'Serpiente Language Server',
        serverOptions,
        clientOptions
    );

    client.start().catch(err => {
        console.error('Failed to start Serpiente LSP:', err);
    });
}

function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

module.exports = {
    activate,
    deactivate
};