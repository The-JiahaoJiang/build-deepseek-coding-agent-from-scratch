# build-deepseek-coding-agent-from-scratch
This repo try to provide a step-by-step knowledge and coding tutorial to build a coding agent based on DeepSeek V4 models and Claude Code architecture.


## Architecture

An coding agent is composed of six components:

1. Loop - the main place to continuously process the user queries, send context to models and return responsed
2. Task - the working units that our agent relys on to finish its job
3. Tools - where we provide definitions, permissions checks and everything related to tools that our agent can leverage, for example, edit a coding file, search materials on internet and .....
4. State - a centralized place to store states to initialize our agent and managing runtime configs
5. Memory - where to persistent context, skills across multiple user sessions
6. Hooks - predefined lifecyle interceptors on each stage to execute customized logics, for example, check the permissions before a tool is called.


## Step-by-Step

### 1. Create a simplest loop to interact with models

In `step1/agent.py`, we build a minimal `Agent` class that:

- Accepts a `name` and `role` on initialization
- Reads a DeepSeek API key from a `deepseek.keys` file in the project root
- Maintains `conversation_history` to preserve context across turns
- Sends user messages to `deepseek-v4-pro` via the OpenAI-compatible API with high reasoning effort
- Runs a simple REPL loop (`start_loop`) — type `exit` or `quit` to stop

**Setup:**

1. Create a `deepseek.keys` file in the project root containing your DeepSeek API key.
2. Install dependencies:
   ```bash
   uv sync
   ```
3. Run the agent:
   ```bash
   uv run step1/agent.py
   ```

4. Interact with the agent by typing messages. The agent will respond based on the DeepSeek model's output. Type `exit` or `quit` to end the session.

```shell
user: I am Jaho, who are you

DeepSeekAgent (coding assistant): Hi Jaho! I'm DeepSeek, an AI assistant created by the company DeepSeek (深度求索).

I'm here to help you with questions, problem-solving, creative tasks, or just chatting. I'm free to use, and I can handle pretty long conversations (up to 1M tokens of context—think processing entire books at once!). I can also read uploaded files like PDFs, Word docs, Excel sheets, and images, though I can't generate images myself. I have web search capabilities if you turn them on manually, and there's a mobile app with voice input too.

What can I help you with today?

user: what is my name

DeepSeekAgent (coding assistant): Your name is Jaho! You introduced yourself at the start of our conversation. 😊
```
