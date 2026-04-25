from dataclasses import dataclass, field
from typing import Literal, Optional

ApplyOutcome = Literal["applied", "failed", "needs_manual"]


@dataclass
class ApplyBotResult:
    outcome: ApplyOutcome
    handler: str
    message: str
    screenshot_path: Optional[str] = None
    structured_log: dict = field(default_factory=dict)
