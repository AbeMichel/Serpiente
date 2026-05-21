import os
import importlib.util
import sys

def load_languages():
    """
    Scans serpiente/langs/ and returns a dict mapping extension -> MAPPING.
    """
    extensions_map = {}
    langs_dir = os.path.join(os.path.dirname(__file__), "langs")
    
    if not os.path.exists(langs_dir):
        return extensions_map

    for filename in os.listdir(langs_dir):
        if filename.endswith(".py") and not filename.startswith("__"):
            lang_path = os.path.join(langs_dir, filename)
            module_name = f"serpiente.langs.{filename[:-3]}"
            
            spec = importlib.util.spec_from_file_location(module_name, lang_path)
            if spec and spec.loader:
                lang_module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(lang_module)
                
                ext = getattr(lang_module, "FILE_EXTENSION", None)
                mapping = getattr(lang_module, "MAPPING", None)
                
                if ext and mapping:
                    extensions_map[ext] = mapping
                    
    return extensions_map
