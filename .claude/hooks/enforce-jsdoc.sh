#!/bin/bash
# Enforces JSDoc on exported functions/components in TS/TSX files.
# Used as a Claude Code PostToolUse hook on Write and Edit tools.
# Exit 0 = allow, Exit 2 = block (message via stderr).

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // empty')

# Only check TS/TSX files
if [[ ! "$FILE_PATH" =~ \.(ts|tsx)$ ]]; then
  exit 0
fi

# Skip test files, type declaration files, and UI primitives
if [[ "$FILE_PATH" =~ \.(test|spec|d)\.(ts|tsx)$ ]] || [[ "$FILE_PATH" =~ /ui/ ]]; then
  exit 0
fi

# Skip schema files, migration files, and config files
if [[ "$FILE_PATH" =~ \.schema\.(ts|tsx)$ ]] || [[ "$FILE_PATH" =~ /migrations/ ]] || [[ "$FILE_PATH" =~ \.config\.(ts|tsx)$ ]]; then
  exit 0
fi

# Check each exported function/component for a preceding JSDoc block.
# We look for lines like:
#   export function Foo(
#   export async function Foo(
#   export const Foo = (
#   export const Foo = async (
#   export default function Foo(
#
# And verify that within the 5 lines before it, there's a closing */ (end of JSDoc).

MISSING=()

while IFS= read -r line_num; do
  # line_num is 1-indexed from grep -n
  num=$((line_num))
  # Look at the 5 lines before this export for a JSDoc closing "*/"
  start=$((num - 5))
  if [ "$start" -lt 1 ]; then start=1; fi

  preceding=$(echo "$CONTENT" | sed -n "${start},$((num - 1))p")

  if ! echo "$preceding" | grep -q '\*/'; then
    # Get the actual line content for the error message
    export_line=$(echo "$CONTENT" | sed -n "${num}p" | sed 's/^[[:space:]]*//' | head -c 80)
    MISSING+=("  Line ${num}: ${export_line}")
  fi
done < <(echo "$CONTENT" | grep -n -E '^\s*export\s+(default\s+)?(async\s+)?function\s+[A-Za-z_]|^\s*export\s+(default\s+)?const\s+[A-Za-z_][A-Za-z0-9_]*\s*=\s*(async\s+)?\(' | cut -d: -f1)

if [ ${#MISSING[@]} -gt 0 ]; then
  {
    echo "Missing JSDoc: All exported functions and components must have JSDoc comments."
    echo ""
    printf '%s\n' "${MISSING[@]}"
    echo ""
    echo "Add a /** ... */ comment block above each export. Example:"
    echo "  /** Description of what the function does. */"
    echo "  export function myFunction() { ... }"
  } >&2
  exit 2
fi

exit 0
