import sys
import os
import traceback
import tokenize
from serpiente.langs_manager import load_languages
from serpiente.importer import register_hooks
from serpiente.translator import translate_with_offsets

def main():
    if len(sys.argv) < 2:
        print("Usage: serpiente <script.esp>")
        sys.exit(1)

    # 1. Load language mappings and register hooks for imports
    ext_map = load_languages()
    register_hooks(ext_map)

    # 2. Prepare to run the script
    script_path = os.path.abspath(sys.argv[1])
    if not os.path.exists(script_path):
        print(f"File not found: {script_path}")
        sys.exit(1)

    _, ext = os.path.splitext(script_path)
    mapping = ext_map.get(ext)
    
    if not mapping:
        print(f"Unsupported file extension: {ext}")
        sys.exit(1)

    # 3. Read and translate the entry point script
    with open(script_path, 'r', encoding='utf-8') as f:
        source = f.read()

    try:
        translated_source, offset_map = translate_with_offsets(source, mapping)
        
        # 4. Set up execution environment
        sys.argv = sys.argv[1:]
        script_dir = os.path.dirname(script_path)
        if script_dir not in sys.path:
            sys.path.insert(0, script_dir)

        exec_globals = {
            "__name__": "__main__",
            "__file__": script_path,
            "__builtins__": __builtins__,
        }

        # 5. Compile and Execute
        # Use the original script_path so tracebacks point to the right file
        code = compile(translated_source, script_path, "exec")
        exec(code, exec_globals)

    except (tokenize.TokenError, SyntaxError) as e:
        # These are "compile-time" errors in the user's script
        handle_user_error(e, mapping, script_path)
    except Exception:
        # Runtime errors
        handle_exception(mapping, offset_map)

def handle_user_error(exc, mapping, script_path):
    reverse_mapping = {v: k for k, v in mapping.items()}
    exc_type_name = type(exc).__name__
    localized_name = reverse_mapping.get(exc_type_name, exc_type_name)
    
    if isinstance(exc, tokenize.TokenError):
        # TokenError: (message, (lineno, offset))
        msg, pos = exc.args
        print(f"  File \"{script_path}\", line {pos[0]}")
        print(f"{localized_name}: {msg}")
    elif isinstance(exc, SyntaxError):
        # SyntaxError has lineno, offset, text, etc.
        print(f"  File \"{script_path}\", line {exc.lineno}")
        if exc.text:
            print(f"    {exc.text.strip()}")
            if exc.offset is not None:
                print(f"    {' ' * (exc.offset - 1)}^")
        print(f"{localized_name}: {exc.msg}")

def handle_exception(mapping, offset_map):
    # Create reverse mapping for error names
    reverse_mapping = {v: k for k, v in mapping.items()}
    
    exc_type, exc_value, exc_traceback = sys.exc_info()
    
    # Translate the exception type name if it exists in the mapping
    exc_type_name = exc_type.__name__
    localized_name = reverse_mapping.get(exc_type_name, exc_type_name)
    
    print("Traceback (most recent call last):")
    traceback.print_tb(exc_traceback)
    print(f"{localized_name}: {exc_value}")

if __name__ == "__main__":
    main()
