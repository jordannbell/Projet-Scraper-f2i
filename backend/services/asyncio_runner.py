"""
asyncio.run() compatible Windows quand le code s’exécute depuis un thread
(FastAPI BackgroundTasks → thread pool) : ProactorEventLoop requis pour les sous-processus Playwright.
"""

from __future__ import annotations

import asyncio
import sys
from typing import Coroutine, TypeVar

T = TypeVar("T")


def run_async(coro: Coroutine[None, None, T]) -> T:
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    return asyncio.run(coro)
