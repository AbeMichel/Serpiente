import tokenize
import io

def translate_source(source: str, mapping: dict) -> str:
    """
    Translates localized Python source code into standard English Python source.
    Pads English keywords with spaces to match the length of localized keywords
    whenever possible to preserve column offsets.
    """
    result = []
    tokens = tokenize.generate_tokens(io.StringIO(source).readline)
    
    for toknum, tokval, start, end, line in tokens:
        if toknum == tokenize.NAME:
            translated_val = mapping.get(tokval, tokval)
            
            # Padding strategy to keep columns aligned
            if len(translated_val) < len(tokval):
                # English is shorter: pad with spaces
                translated_val = translated_val + (" " * (len(tokval) - len(translated_val)))
            # If English is longer (e.g., 'y' -> 'and'), we can't pad
            # but untokenize will handle it by shifting the rest of the line.
            
            result.append((toknum, translated_val, start, end, line))
        else:
            result.append((toknum, tokval, start, end, line))
            
    return tokenize.untokenize(result)

def translate_with_offsets(source: str, mapping: dict):
    """
    Legacy wrapper for translate_source until we build the full mapping engine.
    """
    return translate_source(source, mapping), {}
