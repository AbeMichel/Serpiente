import os
import sys
import traceback
import tokenize
import io
import jedi
import logging

# Set up logging to a file for debugging
logging.basicConfig(filename='serpiente_lsp.log', level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Add the project root to sys.path so we can import serpiente
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from pygls.lsp.server import LanguageServer
from lsprotocol.types import (
    TEXT_DOCUMENT_DID_OPEN,
    TEXT_DOCUMENT_DID_CHANGE,
    TEXT_DOCUMENT_COMPLETION,
    CompletionList,
    CompletionItem,
    CompletionItemKind,
    CompletionOptions,
    Diagnostic,
    Position,
    Range,
    PublishDiagnosticsParams,
)
from serpiente.translator import translate_with_offsets
from serpiente.langs_manager import load_languages

class SerpienteServer(LanguageServer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.ext_map = load_languages()
        self.project = None

server = SerpienteServer("serpiente-lsp", "v0.1.0")

@server.feature(TEXT_DOCUMENT_DID_OPEN)
async def did_open(ls: SerpienteServer, params):
    await validate(ls, params.text_document.uri)

@server.feature(TEXT_DOCUMENT_DID_CHANGE)
async def did_change(ls: SerpienteServer, params):
    await validate(ls, params.text_document.uri)

async def validate(ls: SerpienteServer, uri: str):
    doc = ls.workspace.get_text_document(uri)
    path = doc.path
    _, ext = os.path.splitext(path)
    mapping = ls.ext_map.get(ext)

    if not mapping:
        return

    source = doc.source
    diagnostics = []
    
    try:
        # First, try tokenizing to catch basic token errors
        tokens = list(tokenize.generate_tokens(io.StringIO(source).readline))
        
        # Then, try translating and compiling to catch syntax errors
        translated, _ = translate_with_offsets(source, mapping)
        try:
            compile(translated, "<string>", "exec")
        except SyntaxError as e:
            line = (e.lineno or 1) - 1
            col = (e.offset or 1) - 1
            diagnostics.append(Diagnostic(
                range=Range(
                    start=Position(line=line, character=col),
                    end=Position(line=line, character=col + 1)
                ),
                message=f"Syntax Error: {e.msg}",
                source="serpiente"
            ))
            
    except tokenize.TokenError as e:
        msg, (lineno, offset) = e.args
        line = lineno - 1
        col = offset
        diagnostics.append(Diagnostic(
            range=Range(
                start=Position(line=line, character=col),
                end=Position(line=line, character=col + 1)
            ),
            message=f"Token Error: {msg}",
            source="serpiente"
        ))
    except Exception as e:
        diagnostics.append(Diagnostic(
            range=Range(start=Position(line=0, character=0), end=Position(line=0, character=1)),
            message=f"Error: {str(e)}",
            source="serpiente"
        ))

    ls.text_document_publish_diagnostics(
        PublishDiagnosticsParams(uri=uri, diagnostics=diagnostics)
    )

def _jedi_kind_to_lsp_kind(jedi_kind):
    mapping = {
        "module": CompletionItemKind.Module,
        "class": CompletionItemKind.Class,
        "instance": CompletionItemKind.Variable,
        "function": CompletionItemKind.Function,
        "method": CompletionItemKind.Method,
        "keyword": CompletionItemKind.Keyword,
        "statement": CompletionItemKind.Variable,
    }
    return mapping.get(jedi_kind, CompletionItemKind.Text)

@server.feature(
    TEXT_DOCUMENT_COMPLETION,
    CompletionOptions(trigger_characters=[".", "(", " "])
)
async def completions(ls: SerpienteServer, params):
    doc = ls.workspace.get_text_document(params.text_document.uri)
    _, ext = os.path.splitext(doc.path)
    mapping = ls.ext_map.get(ext) or {}
    
    items = []
    seen_labels = set()

    # 1. Localized keywords from mapping
    for loc, eng in mapping.items():
        items.append(CompletionItem(
            label=loc, 
            kind=CompletionItemKind.Keyword,
            detail=f"Python {eng}"
        ))
        seen_labels.add(loc)

    # 2. Jedi completions on translated source
    try:
        translated, _ = translate_with_offsets(doc.source, mapping)
        line = params.position.line + 1
        column = params.position.character
        
        # Help Jedi find the project root and environment
        if not ls.project and ls.workspace.root_path:
            ls.project = jedi.Project(ls.workspace.root_path)
        
        # Ensure Jedi treats the file as Python by giving it a .py extension in its virtual path
        virtual_path = doc.path
        if not virtual_path.endswith(".py"):
            virtual_path = virtual_path + ".py"

        script = jedi.Script(
            code=translated,
            path=virtual_path,
            project=ls.project
        )
        
        jedi_completions = script.complete(line, column)
        
        # Reverse mapping to show localized names if Jedi suggests an English keyword/builtin
        rev_mapping = {eng: loc for loc, eng in mapping.items()}
        
        for comp in jedi_completions:
            label = comp.name
            localized_label = rev_mapping.get(label, label)
            
            if localized_label not in seen_labels:
                items.append(CompletionItem(
                    label=localized_label,
                    kind=_jedi_kind_to_lsp_kind(comp.type),
                    detail=comp.description
                ))
                seen_labels.add(localized_label)
    except Exception as e:
        logger.error(f"Jedi completion error: {e}")
        logger.error(traceback.format_exc())
            
    return CompletionList(is_incomplete=False, items=items)

def main():
    server.start_io()

if __name__ == "__main__":
    main()
