import json
from pathlib import Path
import openai
import pyfiglet
from permission import PermissionMode
from system_prompt import build_system_prompt
from tools import OpType, ToolRegistry

root_dir = Path(__file__).parent.parent


class Agent:
    """
    A simple agent that can take input, send messages to DeepSeek, and receive responses."""

    def __init__(self):
        self.name = "NanaCode"
        self.role = "Coding Agent"

        self.conversation_history = []

        self.client = openai.OpenAI(
            api_key=self._read_api_key(), base_url="https://api.deepseek.com"
        )
        self.model_name = "deepseek-v4-pro"

        self._aborted = False

        self.tool_registry = ToolRegistry()
        self._system_prompt = build_system_prompt(self.tool_registry)
        self.conversation_history.append({"role": "system", "content": self._system_prompt})

        self._permission_mode = PermissionMode.DEFAULT
        self._accepted_files: set = set()
        self._pre_tool_hooks = []
        self.register_pre_tool_hook(self.inspect_permission)

    def _abort(self):
        self._aborted = True

    def _read_api_key(self):
        with open(root_dir / "deepseek.keys", "r") as f:
            return f.read().strip()
        
    def clear_conversation_history(self):
        self.conversation_history = [{"role": "system", "content": self._system_prompt}]

    def _get_user_input(self) -> str:
        return input("\033[1;37m >> \033[0m")

    def _print_agent(self, message: str):
        # Bold blue label + cyan-colored message
        print(f"[\033[1;34m{self.name}\033[0m] >> \033[36m{message}\033[0m")

    @property
    def permission_mode(self) -> PermissionMode:
        return self._permission_mode

    @permission_mode.setter
    def permission_mode(self, mode: PermissionMode):
        self._permission_mode = mode

    def register_pre_tool_hook(self, fn):
        self._pre_tool_hooks.append(fn)

    def inspect_permission(self, tc: dict) -> bool:
        tool = self.tool_registry.get_tool(tc["name"])
        if tool is None or tool.op_type != OpType.WRITE:
            return True

        if self._permission_mode == PermissionMode.ACCEPT_ALL:
            return True

        if self._permission_mode == PermissionMode.PLAN_ONLY:
            print(f"\033[1;33m[permission] Denied: PLAN_ONLY mode blocks write op '{tc['name']}'\033[0m")
            return False

        file_path = tc["args"].get("file_path") or tc["args"].get("command", "")
        if self._permission_mode == PermissionMode.ACCEPT_EDITS and file_path in self._accepted_files:
            return True

        print("\n\033[1;33m[permission] Write operation requested:\033[0m")
        print(f"  {tool.format_call(tc['args'])}")
        print("\t[a] Accept this tool call")
        print(f"\t[b] Accept all edits for this file ({file_path or 'N/A'})")
        print("\t[c] Accept all edits for this session")
        print("\t[d] Deny this tool call")

        while True:
            choice = input("\033[1;37m  Your choice (a/b/c/d): \033[0m").strip().lower()
            if choice == "a":
                return True
            elif choice == "b":
                if file_path:
                    self._accepted_files.add(file_path)
                    self._permission_mode = PermissionMode.ACCEPT_EDITS
                return True
            elif choice == "c":
                self._permission_mode = PermissionMode.ACCEPT_ALL
                return True
            elif choice == "d":
                return False
            else:
                print("  Please enter a, b, c, or d.")

    def send_message(self, message):
        self.conversation_history.append({"role": "user", "content": message})

        while True:
            msg = self.get_response()
            tool_calls = self.inspect_response_for_tools(msg)

            # Append assistant turn to history (include tool_calls if present)
            msg_dict = {"role": "assistant", "content": msg.content or ""}
            if getattr(msg, "reasoning_content", None):
                msg_dict["reasoning_content"] = msg.reasoning_content
            if msg.tool_calls:
                msg_dict["tool_calls"] = [
                    {
                        "id": tc.id,
                        "type": tc.type,
                        "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                    }
                    for tc in msg.tool_calls
                ]
            self.conversation_history.append(msg_dict)

            if not tool_calls:
                break

            # Execute each tool and feed results back
            for tc in tool_calls:
                tool = self.tool_registry.get_tool(tc["name"])
                # Run pre-tool hooks; any denial skips execution
                if not all(hook(tc) for hook in self._pre_tool_hooks):
                    self.conversation_history.append({
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": "Tool call denied by user.",
                    })
                    continue
                tool_response = self.tool_registry.execute_tool(tc)
                print(tool.format_call(tc["args"]))
                self.conversation_history.append({
                    "role": "tool",
                    "tool_call_id": tc["id"],
                    "content": str(tool_response),
                })

        self._print_agent(msg.content or "")

    def inspect_response_for_tools(self, message):
        if not message.tool_calls:
            return []
        return [
            {
                "id": tc.id,
                "name": tc.function.name,
                "args": json.loads(tc.function.arguments),
            }
            for tc in message.tool_calls
        ]

    def get_response(self):
        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=self.conversation_history,
            tools=self.tool_registry.to_openai_tools(),
            stream=False,
            reasoning_effort="high",
            extra_body={"thinking": {"type": "enabled"}},
        )

        return response.choices[0].message

    def _print_banner(self):
        r, g, b = 0x1e, 0x88, 0xe5
        banana_art = [
            "         _   ",
            "       _ \\'-_,#",
            "      _\\'--','`|",
            "      \\`---`  /",
            "       `----'`",
        ]
        name_lines = pyfiglet.figlet_format(self.name).splitlines()
        height = max(len(banana_art), len(name_lines))
        banana_width = max(len(l) for l in banana_art)
        banana_art = [l.ljust(banana_width) for l in banana_art]
        banana_art += [" " * banana_width] * (height - len(banana_art))
        name_lines += [""] * (height - len(name_lines))
        for bl, nl in zip(banana_art, name_lines):
            print(f"\033[38;2;255;225;0m{bl}\033[0m  \033[38;2;{r};{g};{b}m{nl}\033[0m")

    def start_loop(self):
        self._print_banner()
        print(f"Welocome to {self.name} ! I am your coding assistant. How can I help you today?")
        
        while True:
            user_input = self._get_user_input()
            if user_input.lower() in ["exit", "quit"]:
                self._print_agent("Shutting down. Goodbye!")
                break
            self.send_message(user_input)


if __name__ == "__main__":
    agent = Agent()
    agent.start_loop()
