import * as vscode from 'vscode';
import { Translator } from './translator';

export class PositionMapper {
    /**
     * Calculates the column offsets for a single line on the fly.
     * Returns an array where index is Python character position, value is Serpiente character position.
     */
    private static getLineOffsets(line: string, ext: string, translator: Translator): number[] {
        const offsets: number[] = [];
        
        translator.processLine(line, ext, (loc, eng, _isIdentifier, _isOther, startIdx) => {
            for (let j = 0; j < eng.length; j++) {
                // Map each char of the English token back to a corresponding char in the local token.
                // If English is longer, we clamp to the last char of the local token.
                // If English is shorter, we just map one-to-one.
                offsets.push(startIdx + Math.min(j, loc.length - 1));
            }
        });
        
        offsets.push(line.length);
        return offsets;
    }

    public static mapToPython(pos: vscode.Position, lineContent: string, ext: string, translator: Translator): vscode.Position {
        const offsets = this.getLineOffsets(lineContent, ext, translator);
        
        for (let pythonCol = 0; pythonCol < offsets.length; pythonCol++) {
            if (offsets[pythonCol] === pos.character) return new vscode.Position(pos.line, pythonCol);
            if (offsets[pythonCol] > pos.character) return new vscode.Position(pos.line, Math.max(0, pythonCol - 1));
        }
        return new vscode.Position(pos.line, offsets.length - 1);
    }

    public static mapToSerpiente(pos: vscode.Position, lineContent: string, ext: string, translator: Translator): vscode.Position {
        const offsets = this.getLineOffsets(lineContent, ext, translator);
        const serpienteCol = offsets[Math.min(pos.character, offsets.length - 1)];
        return new vscode.Position(pos.line, serpienteCol);
    }

    public static mapRangeToSerpiente(range: vscode.Range, lineContents: string[], ext: string, translator: Translator): vscode.Range {
        return new vscode.Range(
            this.mapToSerpiente(range.start, lineContents[range.start.line] || "", ext, translator),
            this.mapToSerpiente(range.end, lineContents[range.end.line] || "", ext, translator)
        );
    }
}
