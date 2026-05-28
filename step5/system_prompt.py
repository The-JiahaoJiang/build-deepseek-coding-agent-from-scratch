import platform
import subprocess
import sys
import os

from pathlib import Path


from prompt_template import SYSTEM_PROMPT_TEMPLATE
from tools import ToolRegistry

def get_git_context() -> str:
    opts = {"encoding": "utf-8", "timeout": 3}
    try:
        # read repo name
        toplevel = subprocess.check_output(
            ["git", "rev-parse", "--show-toplevel"], **opts
        ).strip()
        repo_name = Path(toplevel).name

        # read git branch info
        branch = subprocess.check_output(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"], **opts
        ).strip()

        # read git status
        status = subprocess.check_output(["git", "status", "--short"], **opts).strip()

        # read git log
        log = subprocess.check_output(
            ["git", "log", "-5", "--pretty=format:%h %s"], **opts
        ).strip()

        result = f"Git repo: {repo_name}\nGit branch: {branch}\nGit status:\n{status}\nRecent commits:\n{log}"

        return result

    except Exception:
        return "Not a git repository or git command failed."


def _build_skills_description(toolRegistry: ToolRegistry) -> str:
    skills = toolRegistry.list_skills() if toolRegistry else []
    if not skills:
        return "Not available"
    return "\n".join(f"- {s.name} — {s.description}" for s in skills)


def build_system_prompt(toolRegistry: ToolRegistry) -> str:
    from datetime import date

    today = date.today().isoformat()

    git_context = get_git_context()
    plat = f"{platform.system()} {platform.machine()}"
    shell = (
        (os.environ.get("ComSpec") or "cmd.exe")
        if sys.platform == "win32"
        else os.environ.get("SHELL", "/bin/sh")
    )

    replacements = {
        "{{cwd}}": str(Path.cwd()),
        "{{date}}": today,
        "{{platform}}": plat,
        "{{shell}}": shell,
        "{{git_context}}": git_context,
        "{{claude_md}}": "Not available",
        "{{memory}}": "Not available",
        "{{skills}}": _build_skills_description(toolRegistry),
        "{{agents}}": "Not available",
        "{{tools}}": str(toolRegistry.to_openai_tools()) if toolRegistry else "Not available",
    }
    result = SYSTEM_PROMPT_TEMPLATE
    for key, value in replacements.items():
        result = result.replace(key, value)
    return result
