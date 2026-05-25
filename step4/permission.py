from enum import Enum

# create a class for PermissionMode enum
class PermissionMode(Enum):
    DEFAULT = "default" # don't ask for read permissions, but ask for write permissions for each tool call
    PLAN_ONLY = "plan_only" # read only, could only write to a dedicated temporary plan doc
    ACCEPT_EDITS = "accept_edits" # the user chooses to accept all edits on the files that users already specified, but the agent needs to ask for approval for any new files
    ACCEPT_ALL = "accept_all" # the agent can execute any tool calls without asking for approval


