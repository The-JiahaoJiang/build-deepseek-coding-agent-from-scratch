"""
This module manage the tolls that the agent can use, including defining a Tool class and a registry for available tools.
"""

import subprocess
from enum import Enum
from pathlib import Path


# define a class for a Tool, following the OpenAI Tool schema
import os as _os


class OpType(Enum):
    READ = "read"
    WRITE = "write"


def _rel(path: str) -> str:
    try:
        return _os.path.relpath(path)
    except ValueError:
        return path


class Tool:
    def __init__(
        self,
        name: str,
        description: str,
        parameters: dict,
        execute_fn: callable,
        format_fn: callable = None,
        op_type: OpType = OpType.READ,
    ):
        self.type = "function"
        self.name = name
        self.description = description
        self.parameters = parameters
        self.execute_fn = execute_fn
        self.format_fn = format_fn
        self.op_type = op_type

    def execute(self, args: dict):
        return self.execute_fn(args)

    def format_call(self, args: dict) -> str:
        if self.format_fn:
            return self.format_fn(args)
        return f"[tool] {self.name}  {args}"

    def to_openai_schema(self) -> dict:
        return {
            "type": self.type,
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }


# create a registry for available tools
class ToolRegistry:

    _instance = None

    def __init__(self):
        self.tools = {}
        self._register_defaults()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ToolRegistry, cls).__new__(cls)
        return cls._instance

    def _register_defaults(self):
        self.register_tool(Tool(
            name="read_file",
            description="Read the content of a file.",
            parameters={
                "type": "object",
                "properties": {
                    "file_path": {"type": "string", "description": "Path to the file"},
                },
                "required": ["file_path"],
            },
            execute_fn=read_file,
            format_fn=lambda a: f"[tool] read_file   {_rel(a.get('file_path', ''))}",
        ))
        self.register_tool(Tool(
            name="write_file",
            description="Write content to a file.",
            parameters={
                "type": "object",
                "properties": {
                    "file_path": {"type": "string", "description": "Path to the file"},
                    "content": {"type": "string", "description": "Content to write to the file"},
                },
                "required": ["file_path", "content"],
            },
            execute_fn=write_file,
            format_fn=lambda a: (
                f"[tool] write_file  {_rel(a.get('file_path', ''))}  "
                f"({len(a.get('content', '').splitlines())} lines)"
            ),
            op_type=OpType.WRITE,
        ))
        self.register_tool(Tool(
            name="list_files",
            description="List files in a directory.",
            parameters={
                "type": "object",
                "properties": {
                    "dir_path": {"type": "string", "description": "Path to the directory (optional, default is current directory)"},
                },
                "required": [],
            },
            execute_fn=list_files,
            format_fn=lambda a: f"[tool] list_files  {_rel(a.get('dir_path', '.'))}",
        ))
        self.register_tool(Tool(
            name="edit_file",
            description="Edit the content of a file by replacing old_lines with new_lines.",
            parameters={
                "type": "object",
                "properties": {
                    "file_path": {"type": "string", "description": "Path to the file"},
                    "new_lines": {"type": "string", "description": "New content to write to the file"},
                    "old_lines": {"type": "string", "description": "Old content to be replaced, used for concurrency control"},
                },
                "required": ["file_path", "new_lines", "old_lines"],
            },
            execute_fn=edit_file,
            format_fn=lambda a: (
                f"[tool] edit_file   {_rel(a.get('file_path', ''))}  "
                f"(-{len([l for l in a.get('old_lines', '').splitlines() if l])} lines, "
                f"+{len([l for l in a.get('new_lines', '').splitlines() if l])} lines)"
            ),
            op_type=OpType.WRITE,
        ))
        self.register_tool(Tool(
            name="grep_search",
            description="Search for a pattern in a file.",
            parameters={
                "type": "object",
                "properties": {
                    "file_path": {"type": "string", "description": "Path to the file"},
                    "pattern": {"type": "string", "description": "Pattern to search for"},
                },
                "required": ["file_path", "pattern"],
            },
            execute_fn=grep_search,
            format_fn=lambda a: f"[tool] grep_search {_rel(a.get('file_path', ''))}  pattern='{a.get('pattern', '')}'" ,
        ))
        self.register_tool(Tool(
            name="run_command",
            description="Run a shell command.",
            parameters={
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "Shell command to run"},
                },
                "required": ["command"],
            },
            execute_fn=run_command,
            format_fn=lambda a: f"[tool] run_command  $ {a.get('command', '')}",
            op_type=OpType.WRITE,
        ))
        self.register_tool(Tool(
            name="web_search",
            description="Search the web by visiting a URL.",
            parameters={
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "URL to visit and parse the content"},
                },
                "required": ["url"],
            },
            execute_fn=web_search,
            format_fn=lambda a: f"[tool] web_search  {a.get('url', '')}",
        ))

    def register_tool(self, tool: Tool):
        self.tools[tool.name] = tool

    def get_read_tools(self) -> list:
        return [t for t in self.tools.values() if t.op_type == OpType.READ]

    def get_write_tools(self) -> list:
        return [t for t in self.tools.values() if t.op_type == OpType.WRITE]

    def get_tool(self, name):
        return self.tools.get(name)

    def execute_tool(self, tool_call: dict) -> str:
        name = tool_call.get("name")
        args = tool_call.get("args", {})
        tool = self.get_tool(name)
        if tool is None:
            return f"Tool '{name}' not found."
        return tool.execute(args)

    def list_tools(self):
        return list(self.tools.keys())

    def to_openai_tools(self):
        """Return tools in the OpenAI/DeepSeek function-calling schema."""
        return [tool.to_openai_schema() for tool in self.tools.values()]


def read_file(input_dict: dict) -> str:
    file_path = input_dict.get("file_path")
    if not file_path:
        raise ValueError("file_path is required")

    try:
        # read file with line number enriched
        content = Path(file_path).read_text(encoding="utf-8")
        lines = content.split("\n")
        numbered = "\n".join(f"{i + 1:4d} | {line}" for i, line in enumerate(lines))

        return numbered
    except Exception:
        return f"Faile to read file:{file_path}"


def write_file(input_dict: dict) -> str:
    file_path = input_dict.get("file_path")
    content = input_dict.get("content", "")
    if not file_path:
        raise ValueError("file_path is required")

    try:
        Path(file_path).write_text(content, encoding="utf-8")
        return f"File {file_path} written successfully."
    except Exception as e:
        return f"Failed to write file: {e}"


def list_files(input_dict: dict) -> str:
    dir_path = input_dict.get("dir_path", ".")
    try:
        files = Path(dir_path).iterdir()
        file_list = "\n".join(f.name for f in files)
        return f"Files in {dir_path}:\n{file_list}"
    except Exception as e:
        return f"Failed to list files: {e}"


def normalize_search(source: str, target: str) -> str:
    """
    Normalize special characters like quotes then search in target

    Return the finded content
    """
    if target in source:
        return target


def generate_diff_msg(old_lines: str, new_lines: str) -> str:
    """
    Generate a diff message like git to display the changes made on file content, with old_lines and new_lines as input.
    """
    import difflib

    old = old_lines.splitlines()
    new = new_lines.splitlines()
    diff = difflib.unified_diff(old, new, fromfile="old", tofile="new", lineterm="")
    return "\n".join(diff)


def edit_file(input_dict: dict) -> str:
    """
    Edit the content of a file. Input should be a JSON object with 'file_path', 'new_lines', and 'old_lines' fields.

    Replace the content of the file with 'new_lines' only if the current content of the file contains 'old_lines'.
    This is to prevent overwriting changes that were made after the agent read the file.
    """
    file_path = input_dict.get("file_path")
    new_lines = input_dict.get("new_lines", "")
    old_line = input_dict.get("old_lines", "")

    if not file_path:
        raise ValueError("file_path is required")

    try:
        path = Path(file_path)
        file_content = path.read_text(encoding="utf-8")
        actual_old = normalize_search(file_content, old_line)

        result = file_content.replace(actual_old, new_lines, 1)
        path.write_text(result, encoding="utf-8")

        diff = generate_diff_msg(old_line, new_lines)

        return f"File {file_path} edited successfully \n\n {diff}"
    except Exception as e:
        return f"Failed to edit file: {e}"


def grep_search(input_dict: dict) -> str:
    """
    Search for a pattern in a file. Input should be a JSON object with 'file_path' and 'pattern' fields.

    Return the lines that contain the pattern.
    """
    file_path = input_dict.get("file_path")
    pattern = input_dict.get("pattern", "")

    if not file_path:
        raise ValueError("file_path is required")

    try:
        content = Path(file_path).read_text(encoding="utf-8")
        lines = content.split("\n")
        matched = "\n".join(line for line in lines if pattern in line)
        return f"Lines in {file_path} that contain '{pattern}':\n{matched}"
    except Exception as e:
        return f"Failed to search file: {e}"


def run_command(input_dict: dict) -> str:
    """
    Run a shell command. Input should be a JSON object with 'command' field.

    Return the output of the command.
    """
    command = input_dict.get("command", "")
    if not command:
        raise ValueError("command is required")

    try:
        result = subprocess.check_output(
            command, shell=True, encoding="utf-8", stderr=subprocess.STDOUT
        )
        return f"Output of command '{command}':\n{result}"
    except subprocess.CalledProcessError as e:
        return f"Command '{command}' failed with error:\n{e.output}"


def web_search(input_dict: dict) -> str:
    """
    Search the web for a query. Input should be a JSON object with 'query' field.

    Leverage urllib to search and parse the search results from a search engine

    Return the search results
    """
    url = input_dict.get("url", "")
    if not url:
        raise ValueError("url is required")

    import ssl
    import urllib
    import urllib.request

    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE

    try:
        from bs4 import BeautifulSoup

        with urllib.request.urlopen(request, context=ssl_ctx) as response:
            html = response.read()
            soup = BeautifulSoup(html, "html.parser")
            text = soup.get_text()
            return f"Search results for '{url}':\n{text}"
    except Exception as e:
        return f"Search results for '{url}':\nFailed to fetch or parse page: {e}"


# create a singleton tool registry instance
tool_registry = ToolRegistry()
