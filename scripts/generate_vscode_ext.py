import os
import json
import sys

# Add the project root to sys.path so we can import serpiente
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from serpiente.langs_manager import load_languages

def generate_extension():
    ext_map = load_languages()
    output_dir = "vscode-serpiente"
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(os.path.join(output_dir, "syntaxes"), exist_ok=True)
    os.makedirs(os.path.join(output_dir, "snippets"), exist_ok=True)
    os.makedirs(os.path.join(output_dir, "language-configurations"), exist_ok=True)

    # 1. Generate package.json
    package_json = {
        "name": "serpiente",
        "displayName": "Serpiente",
        "description": "Localized Python support (Spanish and more)",
        "version": "0.1.0",
        "publisher": "serpiente",
        "repository": {
            "type": "git",
            "url": "https://github.com/yourusername/serpiente"
        },
        "license": "MIT",
        "engines": {
            "vscode": "^1.60.0"
        },
        "categories": ["Programming Languages"],
        "contributes": {
            "languages": [],
            "grammars": [],
            "snippets": []
        }
    }

    for ext, mapping in ext_map.items():
        lang_id = f"python-{ext[1:]}"
        config_path = f"./language-configurations/{lang_id}.json"

        package_json["contributes"]["languages"].append({
            "id": lang_id,
            "aliases": [f"Python ({ext[1:]})"],
            "extensions": [ext],
            "configuration": config_path
        })
        
        grammar_path = f"./syntaxes/{lang_id}.tmLanguage.json"
        package_json["contributes"]["grammars"].append({
            "language": lang_id,
            "scopeName": f"source.{lang_id}",
            "path": grammar_path
        })

        snippet_path = f"./snippets/{lang_id}.json"
        package_json["contributes"]["snippets"].append({
            "language": lang_id,
            "path": snippet_path
        })
        
        # 2. Generate grammar, snippet and configuration files
        generate_grammar(os.path.join(output_dir, grammar_path), lang_id, mapping)
        generate_snippets(os.path.join(output_dir, snippet_path), mapping)
        generate_language_config(os.path.join(output_dir, config_path), mapping)

    with open(os.path.join(output_dir, "package.json"), "w") as f:
        json.dump(package_json, f, indent=4)

    # 3. Generate .vscodeignore
    with open(os.path.join(output_dir, ".vscodeignore"), "w") as f:
        f.write(".vscode-test\nnode_modules\n.git\n.gitignore\n.vscode\n*.vsix\n")

    # 5. Generate a basic LICENSE file
    with open(os.path.join(output_dir, "LICENSE"), "w") as f:
        f.write("MIT License\n\nCopyright (c) 2026\n")

    print(f"Extension generated in {output_dir}/")

def generate_grammar(output_path, lang_id, mapping):
    # Basic grammar that highlights localized keywords
    keywords = []
    builtins = []
    
    # Heuristic to separate keywords from builtins/exceptions
    # This is simple; in a real scenario we might want better categories.
    for loc, eng in mapping.items():
        if eng in ["False", "None", "True", "and", "as", "assert", "async", "await", "break", "class", "continue", "def", "del", "elif", "else", "except", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "nonlocal", "not", "or", "pass", "raise", "return", "try", "while", "with", "yield"]:
            keywords.append(loc)
        else:
            builtins.append(loc)

    grammar = {
        "scopeName": f"source.{lang_id}",
        "patterns": [
            { "include": "#keywords" },
            { "include": "#builtins" },
            { "include": "#strings" },
            { "include": "#comments" }
        ],
        "repository": {
            "keywords": {
                "patterns": [{
                    "name": "keyword.control.python",
                    "match": f"\\b({'|'.join(keywords)})\\b"
                }]
            },
            "builtins": {
                "patterns": [{
                    "name": "support.function.builtin.python",
                    "match": f"\\b({'|'.join(builtins)})\\b"
                }]
            },
            "strings": {
                "patterns": [
                    {
                        "name": "string.quoted.double.python",
                        "begin": "\"",
                        "end": "\""
                    },
                    {
                        "name": "string.quoted.single.python",
                        "begin": "'",
                        "end": "'"
                    }
                ]
            },
            "comments": {
                "patterns": [{
                    "name": "comment.line.number-sign.python",
                    "match": "#.*$"
                }]
            }
        }
    }
    
    with open(output_path, "w") as f:
        json.dump(grammar, f, indent=4)

def generate_snippets(output_path, mapping):
    snippets = {}
    
    # We'll create snippets for each mapping
    for loc, eng in mapping.items():
        # Heuristic for snippet body: functions get parentheses
        # This can be improved by checking if it's a known builtin function
        if eng in ["print", "input", "range", "len", "type", "int", "float", "str", "bool", "list", "dict", "set", "tuple", "open", "enumerate", "zip", "map", "filter", "sorted", "reversed", "sum", "min", "max", "abs", "round", "pow", "divmod", "all", "any", "getattr", "setattr", "hasattr", "delattr", "iter", "next", "object", "help", "exec", "eval", "compile", "staticmethod", "property", "isinstance", "issubclass"]:
            body = f"{loc}(${{1}})"
            description = f"Built-in function {eng}"
        elif eng == "def":
            body = f"{loc} ${{1:func_name}}(${{2:params}}):\n\t${{0:pass}}"
            description = "Function definition"
        elif eng == "class":
            body = f"{loc} ${{1:ClassName}}:\n\t${{0:pass}}"
            description = "Class definition"
        elif eng == "if":
            body = f"{loc} ${{1:condition}}:\n\t${{0:pass}}"
            description = "If statement"
        elif eng == "for":
            body = f"{loc} ${{1:item}} in ${{2:iterable}}:\n\t${{0:pass}}"
            description = "For loop"
        elif eng == "while":
            body = f"{loc} ${{1:condition}}:\n\t${{0:pass}}"
            description = "While loop"
        elif eng == "try":
            body = f"{loc}:\n\t${{1:pass}}\nexcept ${{2:Exception}}:\n\t${{0:pass}}"
            description = "Try-except block"
        elif eng == "with":
            body = f"{loc} ${{1:expression}} as ${{2:target}}:\n\t${{0:pass}}"
            description = "With statement"
        else:
            body = loc
            description = f"Python {eng}"

        snippets[f"Serpiente {eng}"] = {
            "prefix": loc,
            "body": body,
            "description": description
        }

    with open(output_path, "w") as f:
        json.dump(snippets, f, indent=4)

def generate_language_config(output_path, mapping):
    # Identify localized keywords that should trigger indentation (end with :)
    indent_keywords = [loc for loc, eng in mapping.items() if eng in ["def", "class", "for", "if", "elif", "else", "while", "with", "try", "except", "finally"]]
    
    # Regex for indentation trigger
    # Matches a line that starts with whitespace, followed by one of the keywords, ending with a colon
    indent_regex = f"^\\s*(?:{'|'.join(indent_keywords)}).*?:\\s*$"

    lang_config = {
        "comments": {
            "lineComment": "#",
            "blockComment": ['"""', '"""']
        },
        "brackets": [
            ["{", "}"],
            ["[", "]"],
            ["(", ")"]
        ],
        "autoClosingPairs": [
            {"open": "{", "close": "}"},
            {"open": "[", "close": "]"},
            {"open": "(", "close": ")"},
            {"open": "\"", "close": "\""},
            {"open": "'", "close": "'"}
        ],
        "surroundingPairs": [
            ["{", "}"],
            ["[", "]"],
            ["(", ")"],
            ["\"", "\""],
            ["'", "'"]
        ],
        "onEnterRules": [
            {
                "beforeText": indent_regex,
                "action": { "indent": "indent" }
            }
        ],
        "wordPattern": "(-?\\d*\\.\\d\\w*)|([^\\`\\~\\!\\@\\#\\%\\^\\&\\*\\(\\)\\-\\=\\+\\[\\{\\]\\}\\\\\\|\\;\\:\\'\\\"\\,\\.\\<\\>\\/\\?\\s]+)"
    }
    
    with open(output_path, "w") as f:
        json.dump(lang_config, f, indent=4)

if __name__ == "__main__":
    generate_extension()
