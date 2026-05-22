import * as vscode from 'vscode';
import * as path from 'path';
import { UriUtils } from './uriUtils';
import { PositionMapper } from './positionMapper';
import { Translator } from './translator';

export class DiagnosticsProxy {
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor(
        private translator: Translator
    ) {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('serpiente');
    }

    public activate(context: vscode.ExtensionContext) {
        context.subscriptions.push(
            vscode.languages.onDidChangeDiagnostics(e => this.handleDiagnosticsChange(e))
        );
    }

    public delete(uri: vscode.Uri) {
        this.diagnosticCollection.delete(uri);
    }

    private async handleDiagnosticsChange(e: vscode.DiagnosticChangeEvent) {
        for (const uri of e.uris) {
            // Check if this is a shadow file in our cache
            // We use fsPath.includes for a quick check, then more robust UriUtils
            if (uri.fsPath.includes('.serpiente_cache')) {
                console.log(`Detected diagnostics update for shadow: ${uri.fsPath}`);
                await this.remapAndPublish(uri);
            }
        }
    }

    private async remapAndPublish(shadowUri: vscode.Uri) {
        const originalUri = await UriUtils.getOriginalUri(shadowUri);
        if (!originalUri) {
            console.log(`No original URI found for shadow: ${shadowUri.fsPath}`);
            return;
        }

        const diagnostics = vscode.languages.getDiagnostics(shadowUri);
        console.log(`Found ${diagnostics.length} diagnostics for ${shadowUri.fsPath}`);

        const document = await vscode.workspace.openTextDocument(originalUri);
        const lineContents = document.getText().split(/\r?\n/);
        const ext = path.extname(originalUri.fsPath);

        const remapped = diagnostics.map(d => {
            const remappedRange = PositionMapper.mapRangeToSerpiente(d.range, lineContents, ext, this.translator);
            const newDiag = new vscode.Diagnostic(remappedRange, d.message, d.severity);
            newDiag.source = 'Serpiente (via Pylance)';
            newDiag.code = d.code;
            return newDiag;
        });

        console.log(`Publishing ${remapped.length} remapped diagnostics to ${originalUri.fsPath}`);
        this.diagnosticCollection.set(originalUri, remapped);
    }
}
