from pathlib import Path
import openai
import pyfiglet
from system_prompt import build_system_prompt
from termcolor import colored

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

        self._system_prompt = build_system_prompt({})
        self.conversation_history.append({"role": "system", "content": self._system_prompt})

    def _abort(self):
        self._aborted = True

    def _read_api_key(self):
        with open(root_dir / "deepseek.keys", "r") as f:
            return f.read().strip()
        
    def clear_conversation_history(self):
        self.conversation_history = [{"role": "system", "content": self._system_prompt}]

    def send_message(self, message):
        self.conversation_history.append({"role": "user", "content": message})
        response = self.get_response()
        self.conversation_history.append({"role": "assistant", "content": response})

        print(f"{self.name} :: {response}")

    def get_response(self):
        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=self.conversation_history,
            stream=False,
            reasoning_effort="high",
            extra_body={"thinking": {"type": "enabled"}},
        )

        return response.choices[0].message.content.strip()

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
            user_input = input("user >> ")
            if user_input.lower() in ["exit", "quit"]:
                print(f"{self.name} is shutting down.")
                break
            self.send_message(user_input)


if __name__ == "__main__":
    agent = Agent()
    agent.start_loop()
