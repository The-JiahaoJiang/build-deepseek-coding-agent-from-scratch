"""
This module manage the tolls that the agent can use, including defining a Tool class and a registry for available tools.
"""

from asyncio import subprocess
from pathlib import Path
from typing import List


class Param:
    def __init__(self, name: str, data_type: str, description: str, required: bool):
        self.name = name
        self.data_type = data_type
        self.description = description
        self.required = required


# define a class for a Tool, including name, description, input schema, and a function to execute the tool
class Tool:
    def __init__(
        self,
        name: str,
        description: str,
        params: List[Param],
        execute_fn: callable,
    ):
        self.name = name
        self.description = description
        self.params = params
        self.execute_fn = execute_fn

    def execute(self, **kwargs):
        return self.execute_fn(**kwargs)


# create a registry for available tools
class ToolRegistry:
    def __init__(self):
        self.tools = {}
        self._register_defaults()

    def _register_defaults(self):
        self.register_tool(Tool(
            name="read_file",
            description="Read the content of a file. Input should be a JSON object with 'file_path' field.",
            params=[
                Param(name="file_path", data_type="str", description="Path to the file", required=True)
            ],
            execute_fn=read_file,
        ))
        self.register_tool(Tool(
            name="write_file",
            description="Write content to a file. Input should be a JSON object with 'file_path' and 'content' fields.",
            params=[
                Param(name="file_path", data_type="str", description="Path to the file", required=True),
                Param(name="content", data_type="str", description="Content to write to the file", required=True),
            ],
            execute_fn=write_file,
        ))
        self.register_tool(Tool(
            name="list_files",
            description="List files in a directory. Input should be a JSON object with 'dir_path' field (optional, default is current directory).",
            params=[
                Param(name="dir_path", data_type="str", description="Path to the directory", required=False)
            ],
            execute_fn=list_files,
        ))
        self.register_tool(Tool(
            name="edit_file",
            description="Edit the content of a file. Input should be a JSON object with 'file_path', 'new_lines', and 'old_lines' fields.",
            params=[
                Param(name="file_path", data_type="str", description="Path to the file", required=True),
                Param(name="new_lines", data_type="str", description="New content to write to the file", required=True),
                Param(name="old_lines", data_type="str", description="Old content to be replaced, used for concurrency control", required=True),
            ],
            execute_fn=edit_file,
        ))
        self.register_tool(Tool(
            name="grep_search",
            description="Search for a pattern in a file. Input should be a JSON object with 'file_path' and 'pattern' fields.",
            params=[
                Param(name="file_path", data_type="str", description="Path to the file", required=True),
                Param(name="pattern", data_type="str", description="Pattern to search for", required=True),
            ],
            execute_fn=grep_search,
        ))
        self.register_tool(Tool(
            name="run_command",
            description="Run a shell command. Input should be a JSON object with 'command' field.",
            params=[
                Param(name="command", data_type="str", description="Shell command to run", required=True)
            ],
            execute_fn=run_command,
        ))
        self.register_tool(Tool(
            name="web_search",
            description="Search the web for a query. Input should be a JSON object with 'url' field.",
            params=[
                Param(name="url", data_type="str", description="URL to visit and parse the content", required=True)
            ],
            execute_fn=web_search,
        ))

    def register_tool(self, tool: Tool):
        self.tools[tool.name] = tool

    def get_tool(self, name):
        return self.tools.get(name)

    def list_tools(self):
        return list(self.tools.keys())

    def to_specs(self):
        # convert the registered tools to a list of dicts with name, description, and input schema
        return [
            {
                "name": tool.name,
                "description": tool.description,
                "params": [
                    {
                        "name": param.name,
                        "data_type": param.data_type,
                        "description": param.description,
                        "required": param.required,
                    }
                    for param in tool.params
                ],
            }
            for tool in self.tools.values()
        ]


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

    import urllib

    request = urllib.request.Request(url, headers={"User-Agent": f"Mozilla/5.0"})
    
    # try to parse the results with BeautifulSoup, if fails return the raw html
    try:
        from bs4 import BeautifulSoup

        with urllib.request.urlopen(request) as response:
            html = response.read()
            soup = BeautifulSoup(html, "html.parser")
            text = soup.get_text()
            return f"Search results for '{url}':\n{text}"
    except Exception:
        return f"Search results for '{url}':\nFailed to open and parse the search results, returning raw html.\n{response.read()}"


# create a singleton tool registry instance
tool_registry = ToolRegistry()
