"""
Worker optionnel : traite la file apply_queue en boucle.
Usage (depuis le dossier backend) :
  set PYTHONPATH=.
  python worker_apply_loop.py

En production : exécuter ce processus sur une machine avec Playwright (voir Dockerfile.worker).
"""
import os
import sys
import time

from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.apply_processor import worker_poll_once


def main() -> None:
    interval = int(os.environ.get("APPLY_WORKER_POLL_SEC", "5") or "5")
    max_jobs = int(os.environ.get("APPLY_WORKER_BATCH", "3") or "3")
    print(f"Apply worker started (poll={interval}s, batch={max_jobs})")
    while True:
        try:
            n = worker_poll_once(max_jobs=max_jobs)
            if n == 0:
                time.sleep(interval)
        except KeyboardInterrupt:
            print("Apply worker stopped.")
            break
        except Exception as exc:
            print(f"Apply worker error: {exc}")
            time.sleep(interval)


if __name__ == "__main__":
    main()
