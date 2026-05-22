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
        vscode.languages.registerCompletionItemProvider(selector, new SerpienteCompletionProvider(translator)),
        vscode.languages.registerHoverProvider(selector, new SerpienteHoverProvider(translator)),
        vscode.languages.registerDefinitionProvider(selector, new SerpienteDefinitionProvider(translator)),
        
        vscode.workspace.onDidChangeTextDocument(async e => {
            if (selector.some(s => s.language === e.document.languageId)) {
                await shadowManager.syncIncremental(e);
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
        vscode.workspace.onDidDeleteFiles(e => {
            for (const uri of e.files) {
                shadowManager.deleteShadowFile(uri);
            }
        }),

        vscode.workspace.onDidCloseTextDocument(doc => {
            if (selector.some(s => s.language === doc.languageId)) {
                diagnosticsProxy.delete(doc.uri);
                shadowManager.handleDidClose(doc.uri);
            }
        })
    );

    // Initial sync of already open documents
    for (const doc of vscode.workspace.textDocuments) {
        await syncFile(doc);
    }
}

export function deactivate() {}
