import * as vscode from 'vscode';
import * as path from 'path';
import { Translator } from './translator';
import { ShadowWorkspaceManager } from './shadowWorkspace';
import { DiagnosticsProxy } from './diagnostics';
import { SerpienteCompletionProvider, SerpienteHoverProvider, SerpienteDefinitionProvider } from './providers';

export async function activate(context: vscode.ExtensionContext) {
    console.log('Serpiente extension (Official Proxy) is now active!');

    const mappingsPath = path.join(context.extensionPath, 'mappings.json');
    const translator = new Translator(mappingsPath);
    const shadowManager = new ShadowWorkspaceManager(translator);
    const diagnosticsProxy = new DiagnosticsProxy(translator);

    await shadowManager.initialize();
    diagnosticsProxy.activate(context);

    const selector = [
        { language: 'python-esp', scheme: 'file' },
        { language: 'python-frp', scheme: 'file' },
        { language: 'python-rwp', scheme: 'file' }
    ];

    const syncFile = async (doc: vscode.TextDocument) => {
        if (selector.some(s => s.language === doc.languageId)) {
            await shadowManager.syncFullFile(doc.uri);
        }
    };

    context.subscriptions.push(
        vscode.commands.registerCommand('serpiente.toggleShadowFiles', async () => {
            const config = vscode.workspace.getConfiguration('serpiente');
            const current = config.get<boolean>('showShadowFiles', false);
            const newValue = !current;
            await config.update('showShadowFiles', newValue, vscode.ConfigurationTarget.Global);
            
            if (newValue) {
                vscode.window.showInformationMessage('Serpiente: Shadow files enabled (check Secondary Side Bar).');
                const editor = vscode.window.activeTextEditor;
                if (editor && selector.some(s => s.language === editor.document.languageId)) {
                    await shadowManager.mirrorActiveEditor(editor);
                }
            } else {
                vscode.window.showInformationMessage('Serpiente: Shadow files hidden.');
                await shadowManager.closeAllShadowEditors();
                await vscode.commands.executeCommand('workbench.action.closeSecondarySideBar');
            }
        }),

        vscode.languages.registerCompletionItemProvider(selector, new SerpienteCompletionProvider(translator)),
        vscode.languages.registerHoverProvider(selector, new SerpienteHoverProvider(translator)),
        vscode.languages.registerDefinitionProvider(selector, new SerpienteDefinitionProvider(translator)),
        
        vscode.workspace.onDidChangeTextDocument(async e => {
            if (selector.some(s => s.language === e.document.languageId)) {
                await shadowManager.syncIncremental(e);
            }
        }),

        vscode.window.onDidChangeActiveTextEditor(async editor => {
            if (editor && selector.some(s => s.language === editor.document.languageId)) {
                await shadowManager.mirrorActiveEditor(editor);
            }
        }),

        vscode.window.tabGroups.onDidChangeTabs(async e => {
            for (const closedTab of e.closed) {
                if (closedTab.input instanceof vscode.TabInputText) {
                    const uri = closedTab.input.uri;
                    // Check if the closed tab was an original file
                    const doc = vscode.workspace.textDocuments.find(d => d.uri.toString() === uri.toString());
                    if (doc && selector.some(s => s.language === doc.languageId)) {
                        console.log(`Original file tab closed: ${uri.fsPath}`);
                        diagnosticsProxy.delete(uri);
                        await shadowManager.closeShadowEditor(uri);
                        shadowManager.handleDidClose(uri);
                    } 
                    // Check if it was a shadow file
                    else if (uri.fsPath.includes('.serpiente_cache')) {
                        console.log(`Shadow file tab closed: ${uri.fsPath}`);
                        shadowManager.handleShadowDidClose(uri);
                    }
                }
            }
        }),

        vscode.workspace.onDidOpenTextDocument(syncFile),
        vscode.workspace.onDidCreateFiles(async e => {
            for (const uri of e.files) {
                if (uri.fsPath.match(/\.(esp|frp|rwp)$/)) {
                    await shadowManager.syncFullFile(uri);
                }
            }
        }),
        vscode.workspace.onDidDeleteFiles(async e => {
            for (const uri of e.files) {
                await shadowManager.deleteShadowFile(uri);
            }
        }),
        vscode.workspace.onDidRenameFiles(async e => {
            for (const { oldUri, newUri } of e.files) {
                await shadowManager.renameShadow(oldUri, newUri);
            }
        }),

        vscode.workspace.onDidSaveTextDocument(async doc => {
            if (selector.some(s => s.language === doc.languageId)) {
                await shadowManager.saveShadowFile(doc.uri);
            }
        })
    );

    // Initial sync of already open documents
    for (const doc of vscode.workspace.textDocuments) {
        await syncFile(doc);
    }
}

export function deactivate() {}
