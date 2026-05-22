import * as fs from 'fs';

export interface MappingData {
    languageId: string;
    mapping: { [key: string]: string };
}

export interface AllMappings {
    [extension: string]: MappingData;
}

export class Translator {
    private mappings: AllMappings;
    private reverseMappings: { [extension: string]: { [key: string]: string } } = {};

    constructor(mappingsPath: string) {
        this.mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
        for (const ext in this.mappings) {
            const rev: { [key: string]: string } = {};
            for (const [loc, eng] of Object.entries(this.mappings[ext].mapping)) {
                rev[eng] = loc;
            }
            this.reverseMappings[ext] = rev;
        }
    }

    public getMappingForExtension(ext: string): MappingData | undefined {
        return this.mappings[ext];
    }

    /**
     * Common line processor for both translation and offset mapping.
     */
    public processLine(line: string, ext: string, callback: (loc: string, eng: string, isIdentifier: boolean, isOther: boolean, startIdx: number) => void) {
        const langData = this.mappings[ext];
        const mapping = langData?.mapping || {};
        let i = 0;

        while (i < line.length) {
            const char = line[i];

            if (char === '#') {
                callback(line.substring(i), line.substring(i), false, true, i);
                break;
            }

            if (char === '"' || char === "'") {
                const quote = char;
                let start = i;
                i++;
                while (i < line.length && line[i] !== quote) {
                    if (line[i] === '\\' && i + 1 < line.length) {
                        i += 2;
                    } else {
                        i++;
                    }
                }
                if (i < line.length) i++;
                const str = line.substring(start, i);
                callback(str, str, false, true, start);
                continue;
            }

            const identifierMatch = line.substring(i).match(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ_][a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9_]*/);
            if (identifierMatch) {
                const loc = identifierMatch[0];
                const eng = mapping[loc] || loc;
                callback(loc, eng, true, false, i);
                i += loc.length;
                continue;
            }

            callback(char, char, false, true, i);
            i++;
        }
    }

    public translateLine(line: string, ext: string): string {
        let translated = "";
        this.processLine(line, ext, (_, eng) => {
            translated += eng;
        });
        return translated;
    }

    public localizeString(text: string, ext: string): string {
        const revMapping = this.reverseMappings[ext];
        if (!revMapping) return text;
        return text.replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, (match) => revMapping[match] || match);
    }
}
