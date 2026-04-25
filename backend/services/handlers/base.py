from dataclasses import dataclass
from typing import Any, Optional

from playwright.async_api import Page


@dataclass
class ApplyContext:
    page: Page
    job_url: str
    cover_letter: str
    cv_path: Optional[str]
    applicant: dict[str, Any]
    platform_login: Optional[dict[str, Any]] = None
