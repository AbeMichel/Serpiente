# Spanish -> English keyword/builtin mapping.
# Rules:
#   - All values must be valid Python tokens (keywords, builtin names, or constants).
#   - No key should be an existing Python keyword (that would make valid Python untranslatable).
#   - Avoid keys that are substrings of common Spanish words where possible.
#     That problem cannot be fully solved at this layer; the tokenizer handles word boundaries.

LANGUAGE_NAME = "Spanish"
FILE_EXTENSION = ".esp"

MAPPING = {
    # -----------------------------------------------------------------------
    # Keywords (from keyword.kwlist in CPython 3.x)
    # -----------------------------------------------------------------------
    "falso":        "False",
    "ninguno":      "None",
    "verdadero":    "True",
    "y":            "and",
    "como":         "as",
    "afirmar":      "assert",
    "asincrono":    "async",
    "esperar":      "await",
    "romper":       "break",
    "clase":        "class",
    "continuar":    "continue",
    "definir":      "def",
    "borrar":       "del",
    "sino_si":      "elif",
    "sino":         "else",  
    "excepto":      "except",
    "finalmente":   "finally",
    "para":         "for",
    "desde":        "from",
    "si":           "if",
    "importar":     "import",
    "en":           "in",
    "es":           "is",
    "local":        "nonlocal",
    "no":           "not",
    "o":            "or",
    "pasar":        "pass",
    "levantar":     "raise",
    "retornar":     "return",
    "intentar":     "try",
    "mientras":     "while",
    "con":          "with",
    "producir":     "yield",

    # -----------------------------------------------------------------------
    # Built-in functions (builtins module)
    # -----------------------------------------------------------------------
    "imprimir":     "print",
    "entrada":      "input",
    "rango":        "range",
    "longitud":     "len",
    "tipo":         "type",
    "lista":        "list",
    "diccionario":  "dict",
    "conjunto":     "set",
    "tupla":        "tuple",
    "entero":       "int",
    "flotante":     "float",
    "cadena":       "str",
    "booleano":     "bool",
    "abrir":        "open",
    "enumerar":     "enumerate",
    "comprimir":    "zip",
    "mapa":         "map",
    "filtrar":      "filter",
    "ordenar":      "sorted",
    "revertir":     "reversed",
    "suma":         "sum",
    "minimo":       "min",
    "maximo":       "max",
    "absoluto":     "abs",
    "redondear":    "round",
    "potencia":     "pow",
    "dividir":      "divmod",
    "todos":        "all",
    "alguno":       "any",
    "obtener_attr": "getattr",
    "establecer_attr": "setattr",
    "tiene_attr":   "hasattr",
    "borrar_attr":  "delattr",
    "iterador":     "iter",
    "siguiente":    "next",
    "objeto":       "object",
    "ayuda":        "help",
    "ejecutar":     "exec",
    "evaluar":      "eval",
    "compilar":     "compile",
    "estatico":     "staticmethod",
    "propiedad":    "property",
    "instancia_de": "isinstance",
    "subclase_de":  "issubclass",
    "notimplementado": "NotImplemented",

    # -----------------------------------------------------------------------
    # Built-in constants
    # -----------------------------------------------------------------------
    # True/False/None covered above under keywords.
    "elipsis":      "Ellipsis",
    "depurar":      "__debug__",

    # -----------------------------------------------------------------------
    # Built-in exceptions
    # -----------------------------------------------------------------------
    "Excepcion":            "Exception",
    "ExcepcionBase":        "BaseException",
    "ErrorDeAritmética":    "ArithmeticError",
    "ErrorDeAtributo":      "AttributeError",
    "ErrorDeImportacion":   "ImportError",
    "ErrorDeIndice":        "IndexError",
    "ErrorDeClave":         "KeyError",
    "ErrorDeMemoria":       "MemoryError",
    "ErrorDeNombre":        "NameError",
    "ErrorDeNotImplemented":"NotImplementedError",
    "ErrorDeOS":            "OSError",
    "ErrorDeDesbordamiento":"OverflowError",
    "ErrorDeRecursion":     "RecursionError",
    "ErrorDeReferencia":    "ReferenceError",
    "ErrorDeRuntime":       "RuntimeError",
    "ErrorDeSintaxis":      "SyntaxError",
    "ErrorDeSistema":       "SystemError",
    "ErrorDeTipo":          "TypeError",
    "ErrorDeValor":         "ValueError",
    "ErrorDeZero":          "ZeroDivisionError",
    "ErrorDeUnicode":       "UnicodeError",
    "ErrorDeIO":            "IOError",
    "ErrorDePermiso":       "PermissionError",
    "ErrorDeArchivo":       "FileNotFoundError",
    "Interrupcion":         "KeyboardInterrupt",
    "SalidaDelSistema":     "SystemExit",
    "Advertencia":          "Warning",
    "AdvertenciaDeDepreciacion": "DeprecationWarning",
}
