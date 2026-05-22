import * as vscode from 'vscode';
import { Translator } from './translator';
import { PositionMapper } from './positionMapper';
import { UriUtils } from './uriUtils';
import * as path from 'path';

export class SerpienteCompletionProvider implements vscode.CompletionItemProvider {
    constructor(private translator: Translator) {}

    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionList | vscode.CompletionItem[] | undefined> {
        const shadowUri = UriUtils.getShadowUri(document.uri);
        const ext = path.extname(document.uri.fsPath);
        const mappedPos = PositionMapper.mapToPython(position, document.lineAt(position.line).text, ext, this.translator);

        const completions = await vscode.commands.executeCommand<vscode.CompletionList | vscode.CompletionItem[]>(
            'vscode.executeCompletionItemProvider',
            shadowUri,
            mappedPos,
            context.triggerCharacter
        );

        if (!completions) return undefined;

        const items = Array.isArray(completions) ? completions : completions.items;
        return items.map(item => {
            const newItem = new vscode.CompletionItem(
                this.translator.localizeString(typeof item.label === 'string' ? item.label : item.label.label, ext),
                item.kind
            );
            newItem.detail = item.detail ? this.translator.localizeString(item.detail, ext) : undefined;
            if (item.documentation) {
                if (typeof item.documentation === 'string') {
                    newItem.documentation = this.translator.localizeString(item.documentation, ext);
                } else {
                    newItem.documentation = new vscode.MarkdownString(
                        this.translator.localizeString(item.documentation.value, ext)
                    );
                }
            }
            return newItem;
        });
    }
}

export class SerpienteHoverProvider implements vscode.HoverProvider {
    constructor(private translator: Translator) {}

    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): Promise<vscode.Hover | undefined> {
        const shadowUri = UriUtils.getShadowUri(document.uri);
        const ext = path.extname(document.uri.fsPath);
        const mappedPos = PositionMapper.mapToPython(position, document.lineAt(position.line).text, ext, this.translator);

        const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
            'vscode.executeHoverProvider',
            shadowUri,
            mappedPos
        );

        if (!hovers || hovers.length === 0) return undefined;

        const hover = hovers[0];
        const translatedContents = hover.contents.map(content => {
            const val = typeof content === 'string' ? content : content.value;
            return new vscode.MarkdownString(this.translator.localizeString(val, ext));
        });

        const lineContents = document.getText().split(/\r?\n/);
        const range = hover.range ? PositionMapper.mapRangeToSerpiente(hover.range, lineContents, ext, this.translator) : undefined;

        return new vscode.Hover(translatedContents, range);
    }
}

export class SerpienteDefinitionProvider implements vscode.DefinitionProvider {
    constructor(private translator: Translator) {}

    async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): Promise<vscode.Definition | vscode.DefinitionLink[] | undefined> {
        const shadowUri = UriUtils.getShadowUri(document.uri);
        const ext = path.extname(document.uri.fsPath);
        const mappedPos = PositionMapper.mapToPython(position, document.lineAt(position.line).text, ext, this.translator);

        const definitions = await vscode.commands.executeCommand<vscode.Definition | vscode.DefinitionLink[]>(
            'vscode.executeDefinitionProvider',
            shadowUri,
            mappedPos
        );

        if (!definitions) return undefined;

        const remapLocation = async (loc: any): Promise<vscode.Location> => {
            const uri = loc.uri || (loc as vscode.Location).uri;
            const range = loc.range || (loc as vscode.Location).range;
            
            const originalUri = await UriUtils.getOriginalUri(uri);
            if (originalUri) {
                const doc = await vscode.workspace.openTextDocument(originalUri);
                const lineContents = doc.getText().split(/\r?\n/);
                const originalExt = path.extname(originalUri.fsPath);
                const remappedRange = PositionMapper.mapRangeToSerpiente(range, lineContents, originalExt, this.translator);
                return new vscode.Location(originalUri, remappedRange);
            }
            return new vscode.Location(uri, range);
        };

        if (Array.isArray(definitions)) {
            return Promise.all(definitions.map(remapLocation));
        }
        return remapLocation(definitions);
    }
}
