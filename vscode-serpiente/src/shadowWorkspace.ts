import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Translator } from './translator';
import { UriUtils } from './uriUtils';

export class ShadowWorkspaceManager {
    private cacheDir: string | undefined;
    private activeShadowDocs: Map<string, vscode.TextDocument> = new Map();

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
        }

        // Initial sync
        const files = await vscode.workspace.findFiles('**/*.{esp,frp,rwp}', '.serpiente_cache/**');
        for (const file of files) {
            await this.syncFullFile(file);
        }
    }

    public async syncFullFile(uri: vscode.Uri) {
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
        fs.writeFileSync(shadowPath, translatedText, 'utf8');
        
        // Only open the shadow document if the original is actually visible/open in the editor
        // This follows the "Just-in-Time" shadow management strategy.
        await this.ensureShadowOpen(uri);
    }

    public async syncIncremental(e: vscode.TextDocumentChangeEvent) {
        const uri = e.document.uri;
        const shadowUri = UriUtils.getShadowUri(uri);
        const ext = path.extname(uri.fsPath);
        const shadowPath = shadowUri.fsPath;

        const lines = e.document.getText().split(/\r?\n/);
        const translatedLines = lines.map(line => this.translator.translateLine(line, ext));
        fs.writeFileSync(shadowPath, translatedLines.join('\n'), 'utf8');
    }

    /**
     * Ensures the shadow file is "open" in the extension host.
     */
    public async ensureShadowOpen(customUri: vscode.Uri) {
        if (this.activeShadowDocs.has(customUri.toString())) {
            return;
        }

        const shadowUri = UriUtils.getShadowUri(customUri);
        try {
            const doc = await vscode.workspace.openTextDocument(shadowUri);
            this.activeShadowDocs.set(customUri.toString(), doc);
            
            if (doc.languageId !== 'python') {
                await vscode.languages.setTextDocumentLanguage(doc, 'python');
            }
        } catch (e) {
            console.error(`Failed to open shadow document for ${customUri.fsPath}: ${e}`);
        }
    }

    public handleDidClose(uri: vscode.Uri) {
        this.activeShadowDocs.delete(uri.toString());
    }

    public deleteShadowFile(uri: vscode.Uri) {
        const shadowUri = UriUtils.getShadowUri(uri);
        this.handleDidClose(uri);
        if (fs.existsSync(shadowUri.fsPath)) {
            fs.unlinkSync(shadowUri.fsPath);
        }
    }
}
