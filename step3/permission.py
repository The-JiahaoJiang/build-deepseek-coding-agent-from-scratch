from enum import Enum

# create a class for PermissionMode enum
class PermissionMode(Enum):
    DEFAULT = "default"
    PLAN_ONLY = "plan_only"
    APPROVAL = "approval"
    ACCEPT_ALL = "accept_all"
    DONT_ASK = "dont_ask"
