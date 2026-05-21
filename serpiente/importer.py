import sys
import os
import importlib.abc
import importlib.util
import importlib.machinery
from serpiente.translator import translate_source

class SerpienteLoader(importlib.abc.SourceLoader):
    def __init__(self, fullname, path, mapping):
        self.fullname = fullname
        self.path = path
        self.mapping = mapping

    def get_filename(self, fullname):
        return self.path

    def get_data(self, path):
        with open(path, 'r', encoding='utf-8') as f:
            source = f.read()
        translated = translate_source(source, self.mapping)
        return translated.encode('utf-8')

class SerpienteFinder(importlib.abc.MetaPathFinder):
    def __init__(self, extensions_map):
        self.extensions_map = extensions_map

    def find_spec(self, fullname, path, target=None):
        if path is None or path == "":
            path = [os.getcwd()]

        basename = fullname.split(".")[-1]
        for entry in path:
            for ext, mapping in self.extensions_map.items():
                filename = f"{basename}{ext}"
                filepath = os.path.join(entry, filename)
                if os.path.isfile(filepath):
                    return importlib.util.spec_from_loader(
                        fullname, 
                        SerpienteLoader(fullname, filepath, mapping),
                        origin=filepath
                    )
        return None

def register_hooks(extensions_map):
    sys.meta_path.insert(0, SerpienteFinder(extensions_map))
