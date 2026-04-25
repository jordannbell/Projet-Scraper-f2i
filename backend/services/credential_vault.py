import json
import os
from typing import Any, Optional

from cryptography.fernet import Fernet


def _fernet() -> Fernet:
    raw = (os.environ.get("APPLY_SECRETS_KEY") or "").strip().encode()
    if not raw:
        raise RuntimeError(
            "APPLY_SECRETS_KEY manquant : générez une clé Fernet "
            '(ex. python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")'
        )
    return Fernet(raw)


def encrypt_credentials(payload: dict[str, Any]) -> str:
    return _fernet().encrypt(json.dumps(payload, ensure_ascii=False).encode("utf-8")).decode("ascii")


def decrypt_credentials(token: str) -> dict[str, Any]:
    data = _fernet().decrypt(token.encode("ascii"))
    return json.loads(data.decode("utf-8"))


def try_decrypt_credentials(token: Optional[str]) -> Optional[dict[str, Any]]:
    if not token or not (os.environ.get("APPLY_SECRETS_KEY") or "").strip():
        return None
    try:
        return decrypt_credentials(token)
    except Exception:
        return None
