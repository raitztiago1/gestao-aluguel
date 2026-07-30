#!/usr/bin/env python3
"""Extract and install Cursor spec-driven kit skills from the bundled markdown."""

import re
import sys
from pathlib import Path

KIT_PATH = Path(r"C:\Users\raitz\Downloads\cursor-spec-driven-kit-amigo.md")
SKILLS_ROOT = Path.home() / ".cursor" / "skills"


def extract_files(content: str) -> list[tuple[str, str]]:
    pattern = re.compile(
        r"#### Ficheiro: `~/.cursor/skills/([^`]+)`\s*\n\n```(\w+)?\n(.*?)```",
        re.DOTALL,
    )
    return [(m.group(1), m.group(3)) for m in pattern.finditer(content)]


def main() -> int:
    kit = KIT_PATH
    if len(sys.argv) > 1:
        kit = Path(sys.argv[1])

    if not kit.is_file():
        print(f"Kit not found: {kit}", file=sys.stderr)
        return 1

    content = kit.read_text(encoding="utf-8")
    files = extract_files(content)
    if not files:
        print("No skill files found in kit.", file=sys.stderr)
        return 1

    SKILLS_ROOT.mkdir(parents=True, exist_ok=True)
    created: list[str] = []

    for rel_path, body in files:
        dest = SKILLS_ROOT / rel_path.replace("/", "\\")
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(body, encoding="utf-8", newline="\n")
        created.append(str(dest))

    skills = sorted({p.split("/")[0] for p, _ in files})
    print(f"Installed {len(created)} files across {len(skills)} skills:")
    for name in skills:
        print(f"  - {name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
