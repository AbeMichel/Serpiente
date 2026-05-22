import * as vscode from 'vscode';
import * as path from 'path';

export class UriUtils {
    public static getShadowUri(uri: vscode.Uri): vscode.Uri {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return uri;
        
        const projectRoot = workspaceFolders[0].uri.fsPath;
        const cacheDir = path.join(projectRoot, '.serpiente_cache');
        
        // Get relative path from project root
        const relativePath = path.relative(projectRoot, uri.fsPath);
        
        const shadowPath = path.join(cacheDir, relativePath).replace(/\.(esp|frp|rwp)$/, '.py');
        return vscode.Uri.file(shadowPath);
    }

    public static async getOriginalUri(shadowUri: vscode.Uri): Promise<vscode.Uri | undefined> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return undefined;

        const projectRoot = workspaceFolders[0].uri.fsPath;
        const cacheDir = path.join(projectRoot, '.serpiente_cache');
        
        if (!shadowUri.fsPath.startsWith(cacheDir)) return undefined;

        const relativePath = path.relative(cacheDir, shadowUri.fsPath).replace(/\.py$/, '');
        const extensions = ['.esp', '.frp', '.rwp'];

        for (const ext of extensions) {
            const originalPath = path.join(projectRoot, relativePath + ext);
            // Check in open documents first for speed and accuracy
            const openDoc = vscode.workspace.textDocuments.find(d => d.uri.fsPath === originalPath);
            if (openDoc) return openDoc.uri;
            
            // Fallback to searching all files if not open (less likely for diagnostics we care about)
            const files = await vscode.workspace.findFiles(relativePath + ext);
            if (files.length > 0) return files[0];
        }
        return undefined;
    }
}
