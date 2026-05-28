from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass
class Skill:
    name: str
    description: str
    triggers: list[str]
    instructions: str
    file_path: Path

    @classmethod
    def from_file(cls, path: Path) -> "Skill":
        content = path.read_text(encoding="utf-8")
        meta, body = cls._parse_frontmatter(content)
        return cls(
            name=meta.get("name", path.parent.name),
            description=meta.get("description", ""),
            triggers=meta.get("triggers", []),
            instructions=body.strip(),
            file_path=path,
        )

    @staticmethod
    def _parse_frontmatter(content: str) -> tuple[dict, str]:
        """Parse YAML-like frontmatter between --- delimiters (no external deps)."""
        lines = content.splitlines()
        if not lines or lines[0].strip() != "---":
            return {}, content

        end = None
        for i, line in enumerate(lines[1:], 1):
            if line.strip() == "---":
                end = i
                break

        if end is None:
            return {}, content

        frontmatter_lines = lines[1:end]
        body = "\n".join(lines[end + 1:])

        meta: dict = {}
        for line in frontmatter_lines:
            if ":" not in line:
                continue
            key, _, val = line.partition(":")
            key = key.strip()
            val = val.strip()
            if val.startswith("[") and val.endswith("]"):
                inner = val[1:-1]
                meta[key] = [
                    item.strip().strip("'\"")
                    for item in inner.split(",")
                    if item.strip()
                ]
            else:
                meta[key] = val.strip("'\"")

        return meta, body


class SkillRegistry:

    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, skills_dir: Path | str | None = None):
        if hasattr(self, "_initialized"):
            return
        self._initialized = True
        self._skills: dict[str, Skill] = {}
        if skills_dir is not None:
            self._scan(Path(skills_dir))

    def _scan(self, skills_dir: Path) -> None:
        if not skills_dir.exists():
            return
        for skill_file in skills_dir.rglob("SKILL.md"):
            try:
                skill = Skill.from_file(skill_file)
                self._skills[skill.name] = skill
            except Exception as e:
                print(f"\033[1;33m[skills] Failed to load {skill_file}: {e}\033[0m")

    def list_skills(self) -> list[Skill]:
        return list(self._skills.values())

    def get_skill(self, name: str) -> Skill | None:
        return self._skills.get(name)

    def load_skill(self, name: str) -> str:
        skill = self._skills.get(name)
        if skill is None:
            available = ", ".join(self._skills.keys()) or "none"
            return f"Skill '{name}' not found. Available skills: {available}"
        return skill.instructions
