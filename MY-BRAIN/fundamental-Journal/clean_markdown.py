"""
Replace Markdown inline/blocks escapes:
\\[  -> $$
\\]  -> $$
\\(  -> $
\\)  -> $
"""

from pathlib import Path
import argparse


def transform(text: str) -> str:
    return (
        text.replace(r"\[", "$$")
        .replace(r"\]", "$$")
        .replace(r"\(", "$")
        .replace(r"\)", "$")
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert LaTeX escape forms.")
    parser.add_argument("input", type=Path, help="Input Markdown file")
    parser.add_argument(
        "-o", "--output", type=Path, help="Write to this file (default: stdout)"
    )
    parser.add_argument(
        "--in-place", action="store_true", help="Overwrite the input file"
    )
    args = parser.parse_args()

    text = args.input.read_text(encoding="utf-8")
    cleaned = transform(text)

    if args.in_place:
        args.input.write_text(cleaned, encoding="utf-8")
    elif args.output:
        args.output.write_text(cleaned, encoding="utf-8")
    else:
        print(cleaned, end="")


if __name__ == "__main__":
    main()
