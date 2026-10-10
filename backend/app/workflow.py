"""Stable workflow codes; display names and database IDs are not state identifiers."""

from typing import Literal

WorkflowCode = Literal["todo", "doing", "code_review", "ready_for_qa", "done"]

WORKFLOW = (
    ("todo", "To do"),
    ("doing", "Doing"),
    ("code_review", "Code review"),
    ("ready_for_qa", "Ready for QA"),
    ("done", "Done"),
)
WORKFLOW_ORDER = {code: i for i, (code, _) in enumerate(WORKFLOW)}
