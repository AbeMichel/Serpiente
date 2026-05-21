# Kinyarwanda -> English keyword/builtin mapping.
# Rules:
#   - All values must be valid Python tokens (keywords, builtin names, or constants).
#   - No key should be an existing Python keyword (that would make valid Python untranslatable).
#   - Avoid keys that are substrings of common Kinyarwanda words where possible.

LANGUAGE_NAME = "Kinyarwanda"
FILE_EXTENSION = ".rwp"

MAPPING = {
    # -----------------------------------------------------------------------
    # Keywords
    # -----------------------------------------------------------------------
    "ibinyoma": "False",
    "ubusa": "None",
    "ukuri": "True",
    "na": "and",
    "nka": "as",
    "emeza": "assert",
    "asinkironi": "async",
    "tegereza": "await",
    "hagarara": "break",
    "ishuri": "class",
    "komeza": "continue",
    "rema": "def",
    "siba": "del",
    "icyakora_niba": "elif",
    "naho_ubundi": "else",
    "usibye": "except",
    "amaherezo": "finally",
    "kuri": "for",
    "kuva": "from",
    "rusange": "global",
    "niba": "if",
    "imura": "import",
    "mu": "in",
    "ni": "is",
    "lambda": "lambda",
    "si_hafi": "nonlocal",
    "si": "not",
    "cyangwa": "or",
    "hita": "pass",
    "zamura": "raise",
    "garura": "return",
    "gerageza": "try",
    "mugihe": "while",
    "hamwe": "with",
    "tanga": "yield",

    # -----------------------------------------------------------------------
    # Built-in Functions
    # -----------------------------------------------------------------------
    "mpamo": "abs",
    "aiter": "aiter",
    "byose": "all",
    "anext": "anext",
    "icyaricyo_cyose": "any",
    "ascii": "ascii",
    "bin": "bin",
    "hagarika_hano": "breakpoint",
    "ihamagaye": "callable",
    "inyuguti": "chr",
    "uburyo_bwishuri": "classmethod",
    "kumbila": "compile",
    "siba_ibiranga": "delattr",
    "ibiranga": "dir",
    "divmod": "divmod",
    "bara": "enumerate",
    "evail": "eval",
    "ekizekiti": "exec",
    "sohoka": "exit",
    "ayungurura": "filter",
    "fomata": "format",
    "fata_ikiranga": "getattr",
    "isi": "globals",
    "fite_ikiranga": "hasattr",
    "hashi": "hash",
    "bufasha": "help",
    "hekizadesimali": "hex",
    "id": "id",
    "injiza": "input",
    "ni_urugero_rwa": "isinstance",
    "ni_ishuri_ryungirije": "issubclass",
    "itera": "iter",
    "uburebure": "len",
    "ibyaha": "locals",
    "mapu": "map",
    "kinini": "max",
    "gito": "min",
    "ukurikiyeho": "next",
    "okita": "oct",
    "fungura": "open",
    "odi": "ord",
    "imbaraga": "pow",
    "andika": "print",
    "umwihariko": "property",
    "reka": "quit",
    "intera": "range",
    "repuru": "repr",
    "subira_inyuma": "reversed",
    "gereranya": "round",
    "shyiraho_ikiranga": "setattr",
    "isila": "slice",
    "tonda": "sorted",
    "uburyo_budahinduka": "staticmethod",
    "teranya": "sum",
    "hejuru": "super",
    "vasi": "vars",
    "zipu": "zip",

    # -----------------------------------------------------------------------
    # Built-in Types
    # -----------------------------------------------------------------------
    "buliyani": "bool",
    "bayite_areyi": "bytearray",
    "bayite": "bytes",
    "kompurekisi": "complex",
    "inkoranyamagambo": "dict",
    "furoti": "float",
    "furozenseti": "frozenset",
    "umubare_usesuye": "int",
    "urutonde": "list",
    "memori_viyu": "memoryview",
    "ikintu": "object",
    "iseti": "set",
    "amagambo": "str",
    "tupuru": "tuple",
    "ubwoko": "type",

    # -----------------------------------------------------------------------
    # Built-in Constants
    # -----------------------------------------------------------------------
    "eripusi": "Ellipsis",
    "ntibyashyizweho": "NotImplemented",
    "debugu": "__debug__",

    # -----------------------------------------------------------------------
    # Built-in Exceptions
    # -----------------------------------------------------------------------
    "IkosaRyImibare": "ArithmeticError",
    "IkosaRyEmeza": "AssertionError",
    "IkosaRyIkiranga": "AttributeError",
    "IcyahaShingiro": "BaseException",
    "ItsindaRyIcyahaShingiro": "BaseExceptionGroup",
    "IkosaRyIO": "IOError",
    "IkosaRyIhuriro": "ConnectionError",
    "IkosaRyIdosiye": "FileNotFoundError",
    "IkosaRyIzina": "NameError",
    "IkosaRyUbwoko": "TypeError",
    "IkosaRyAgaciro": "ValueError",
    "IkosaRyIgapanyuma": "ZeroDivisionError",
    "Icyaha": "Exception",
    "__izina__": "__name__",
}
