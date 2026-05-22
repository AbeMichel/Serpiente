import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Translator } from './translator';
import { UriUtils } from './uriUtils';

export class ShadowWorkspaceManager {
    private cacheDir: string | undefined;
    private activeShadowDocs: Map<string, vscode.TextDocument> = new Map();
    private updateQueues: Map<string, Promise<void>> = new Map();

    constructor(private translator: Translator) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            this.cacheDir = path.join(workspaceFolders[0].uri.fsPath, '.serpiente_cache');
        }
    }

    public async initialize() {
        if (!this.cacheDir) return;

        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }

        // Add .serpiente_cache to .gitignore
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            const gitignorePath = path.join(workspaceFolders[0].uri.fsPath, '.gitignore');
            if (fs.existsSync(gitignorePath)) {
                const content = fs.readFileSync(gitignorePath, 'utf8');
                if (!content.includes('.serpiente_cache')) {
                    fs.appendFileSync(gitignorePath, '\n.serpiente_cache/\n');
                }
            } else {
                fs.writeFileSync(gitignorePath, '.serpiente_cache/\n');
            }

            // Hide .serpiente_cache from VS Code Explorer
            const config = vscode.workspace.getConfiguration('files');
            const exclude = config.get<{[key: string]: boolean}>('exclude', {});
            if (!exclude['**/.serpiente_cache']) {
                const newExclude = { ...exclude, '**/.serpiente_cache': true };
                config.update('exclude', newExclude, vscode.ConfigurationTarget.Workspace);
            }
        }

        // Initial sync - don't open everything in the background, just ensure shadow files exist
        const files = await vscode.workspace.findFiles('**/*.{esp,frp,rwp}', '.serpiente_cache/**');
        for (const file of files) {
            await this.syncFullFile(file, false);
        }
    }

    public async syncFullFile(uri: vscode.Uri, shouldOpen: boolean = true) {
        await this.runInQueue(uri, async () => {
            const shadowUri = UriUtils.getShadowUri(uri);
            const ext = path.extname(uri.fsPath);
            const document = await vscode.workspace.openTextDocument(uri);
            
            const lines = document.getText().split(/\r?\n/);
            const translatedLines = lines.map(line => this.translator.translateLine(line, ext));
            const translatedText = translatedLines.join('\n');

            const shadowPath = shadowUri.fsPath;
            const shadowDir = path.dirname(shadowPath);
            if (!fs.existsSync(shadowDir)) {
                fs.mkdirSync(shadowDir, { recursive: true });
            }
            
            const shadowDoc = this.activeShadowDocs.get(uri.toString());
            if (shadowDoc && !shadowDoc.isClosed) {
                const edit = new vscode.WorkspaceEdit();
                const fullRange = new vscode.Range(
                    shadowDoc.positionAt(0),
                    shadowDoc.positionAt(shadowDoc.getText().length)
                );
                edit.replace(shadowUri, fullRange, translatedText);
                await vscode.workspace.applyEdit(edit);
            } else {
                fs.writeFileSync(shadowPath, translatedText, 'utf8');
            }
            
            if (shouldOpen) {
                await this.ensureShadowOpen(uri);
            }
        });
    }

    public async syncIncremental(e: vscode.TextDocumentChangeEvent) {
        const uri = e.document.uri;
        await this.runInQueue(uri, async () => {
            const shadowUri = UriUtils.getShadowUri(uri);
            const ext = path.extname(uri.fsPath);

            const lines = e.document.getText().split(/\r?\n/);
            const translatedLines = lines.map(line => this.translator.translateLine(line, ext));
            const translatedText = translatedLines.join('\n');

            const shadowDoc = this.activeShadowDocs.get(uri.toString());
            if (shadowDoc && !shadowDoc.isClosed) {
                const edit = new vscode.WorkspaceEdit();
                const fullRange = new vscode.Range(
                    shadowDoc.positionAt(0),
                    shadowDoc.positionAt(shadowDoc.getText().length)
                );
                edit.replace(shadowUri, fullRange, translatedText);
                await vscode.workspace.applyEdit(edit);
            } else {
                fs.writeFileSync(shadowUri.fsPath, translatedText, 'utf8');
                // If it's not open but we're getting incremental changes, we should open it
                await this.ensureShadowOpen(uri);
            }
        });
    }

    private async runInQueue(uri: vscode.Uri, task: () => Promise<void>) {
        const key = uri.toString();
        const previous = this.updateQueues.get(key) || Promise.resolve();
        const next = previous.then(async () => {
            try {
                await task();
            } catch (e) {
                console.error(`Error in sync queue for ${uri.fsPath}: ${e}`);
            }
        });
        this.updateQueues.set(key, next);
        return next;
    }

    /**
     * Ensures the shadow file is "open" in the extension host.
     */
    public async ensureShadowOpen(customUri: vscode.Uri) {
        const existing = this.activeShadowDocs.get(customUri.toString());
        if (existing && !existing.isClosed) {
            return;
        }

        const shadowUri = UriUtils.getShadowUri(customUri);
        
        // If it's already open in the workspace, we should track it
        const existingDoc = vscode.workspace.textDocuments.find(d => d.uri.toString() === shadowUri.toString());
        if (existingDoc && !existingDoc.isClosed) {
            this.activeShadowDocs.set(customUri.toString(), existingDoc);
            return;
        }

        try {
            const doc = await vscode.workspace.openTextDocument(shadowUri);
            this.activeShadowDocs.set(customUri.toString(), doc);
            
            // Only set language if absolutely necessary, as it can cause the document to be revealed
            if (doc.languageId !== 'python' && doc.uri.fsPath.endsWith('.py')) {
                await vscode.languages.setTextDocumentLanguage(doc, 'python');
            }
        } catch (e) {
            console.error(`Failed to open shadow document for ${customUri.fsPath}: ${e}`);
        }
    }

    /**
     * Mirrors the active state of an editor to its shadow file.
     */
    public async mirrorActiveEditor(editor: vscode.TextEditor) {
        const originalUri = editor.document.uri;
        // Avoid infinite loops if the shadow file somehow gets the "original" language ID
        if (originalUri.fsPath.includes('.serpiente_cache')) {
            return;
        }

        // Always ensure it's in memory for LSP
        await this.ensureShadowOpen(originalUri);

        const config = vscode.workspace.getConfiguration('serpiente');
        if (!config.get<boolean>('showShadowFiles', false)) {
            return;
        }

        const shadowUri = UriUtils.getShadowUri(originalUri);
        
        // Check if already visible in any editor
        const visibleEditor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === shadowUri.toString());
        
        if (!visibleEditor) {
            // 1. Open the shadow file
            const shadowDoc = await vscode.workspace.openTextDocument(shadowUri);
            
            // 2. Show it (this makes it active)
            await vscode.window.showTextDocument(shadowDoc, {
                viewColumn: vscode.ViewColumn.Beside,
                preserveFocus: false, // We NEED focus to move it
                preview: true
            });
            
            // 3. Move it to the secondary sidebar
            await vscode.commands.executeCommand('workbench.action.moveEditorToSecondarySideBar');
            
            // 4. Ensure the secondary sidebar is actually open/visible
            await vscode.commands.executeCommand('workbench.action.focusSecondarySideBar');

            // 5. Return focus to original editor
            await vscode.window.showTextDocument(editor.document, { preserveFocus: false });
        }
    }

    public async closeAllShadowEditors() {
        for (const group of vscode.window.tabGroups.all) {
            for (const tab of group.tabs) {
                if (tab.input instanceof vscode.TabInputText && 
                    tab.input.uri.fsPath.includes('.serpiente_cache')) {
                    await vscode.window.tabGroups.close(tab);
                }
            }
        }
    }

    public handleDidClose(uri: vscode.Uri) {
        this.activeShadowDocs.delete(uri.toString());
    }

    public async saveShadowFile(uri: vscode.Uri) {
        const shadowDoc = this.activeShadowDocs.get(uri.toString());
        if (shadowDoc) {
            await shadowDoc.save();
        }
    }

    public async closeShadowEditor(uri: vscode.Uri) {
        const shadowUri = UriUtils.getShadowUri(uri);
        // Find if any tab is showing this shadow file and close it
        for (const group of vscode.window.tabGroups.all) {
            for (const tab of group.tabs) {
                if (tab.input instanceof vscode.TabInputText && 
                    tab.input.uri.toString() === shadowUri.toString()) {
                    await vscode.window.tabGroups.close(tab);
                }
            }
        }
    }

    public handleShadowDidClose(shadowUri: vscode.Uri) {
        for (const [originalUriStr, doc] of this.activeShadowDocs.entries()) {
            if (doc.uri.toString() === shadowUri.toString()) {
                this.activeShadowDocs.delete(originalUriStr);
                break;
            }
        }
    }

    public async renameShadow(oldUri: vscode.Uri, newUri: vscode.Uri) {
        const oldShadowUri = UriUtils.getShadowUri(oldUri);
        const newShadowUri = UriUtils.getShadowUri(newUri);

        if (fs.existsSync(oldShadowUri.fsPath)) {
            const newShadowDir = path.dirname(newShadowUri.fsPath);
            if (!fs.existsSync(newShadowDir)) {
                fs.mkdirSync(newShadowDir, { recursive: true });
            }
            try {
                fs.renameSync(oldShadowUri.fsPath, newShadowUri.fsPath);
            } catch (e) {
                console.error(`Failed to rename shadow from ${oldShadowUri.fsPath} to ${newShadowUri.fsPath}: ${e}`);
                // Fallback to sync if rename fails
                await this.syncFullFile(newUri);
            }
        } else {
            // If shadow doesn't exist, just sync the new one
            await this.syncFullFile(newUri);
        }
    }

    public async deleteShadowFile(uri: vscode.Uri) {
        const shadowUri = UriUtils.getShadowUri(uri);
        this.handleDidClose(uri);
        await this.closeShadowEditor(uri);
        if (fs.existsSync(shadowUri.fsPath)) {
            try {
                // Use rmSync with recursive: true to handle both files and folders
                fs.rmSync(shadowUri.fsPath, { recursive: true, force: true });
            } catch (e) {
                console.error(`Failed to delete shadow at ${shadowUri.fsPath}: ${e}`);
            }
        }
    }
}
