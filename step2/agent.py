from pathlib import Path
import openai
from system_prompt import build_system_prompt

root_dir = Path(__file__).parent.parent


class Agent:
    """
    A simple agent that can take input, send messages to DeepSeek, and receive responses."""

    def __init__(self, name, role):
        self.name = name
        self.role = role
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

        print(f"{self.name} ({self.role}): {response}")

    def get_response(self):
        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=self.conversation_history,
            stream=False,
            reasoning_effort="high",
            extra_body={"thinking": {"type": "enabled"}},
        )

        return response.choices[0].message.content.strip()

    def start_loop(self):
        print(f"{self.name} ({self.role}) is ready to receive messages.")
        while True:
            user_input = input("user: ")
            if user_input.lower() in ["exit", "quit"]:
                print(f"{self.name} is shutting down.")
                break
            self.send_message(user_input)


if __name__ == "__main__":
    agent = Agent(name="NanaCode", role="coding agentß")
    agent.start_loop()
