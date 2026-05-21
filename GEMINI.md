# Serpiente
## Goal
Create a cli tool which can be run similar to python (`python [scriptName]`) but will accept files with builtin names and keywords translated into other languages defined by the script extension. We want to run it with something like `serpiente [scriptName]`

We also want to create a vscode extension which will support intellisense and autocomplete like the regular python extension.

The python executable which will run the translated code should be the same as if the user ran `python [scriptName]` and should support the same options.

## Language contribution
Will utilize defined language mapping and file extensions (i.e. `.espy`) to determine which language mapping to use. New languages can be defined by creating additional files in "serpiente/langs/".

## Functionality
The CLI will automatically translate the passed script into a normal `.py` string using the proper mappings then run it using the normal python distribution used in the environment.

### Errors
Errors will have to be mapped back to the specified language taking into account the difference in words. This can be done by tracking the translated word length differences in the current line.

# GEMINI
ASK CLARIFYING QUESTIONS WHEN IT IS NOT CLEAR

BREAK TASKS DOWN INTO CLEAN COMPONENTS WHEN NEEDED

ONLY LEAVE COMMENTS WHERE CODE IS NOT SELF-EXPLAINING