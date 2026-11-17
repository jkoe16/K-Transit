from typing import Any


def redact_secret(value: Any, secret: str) -> Any:
    if isinstance(value, str):
        return value.replace(secret, "[redacted]")
    if isinstance(value, list):
        return [redact_secret(item, secret) for item in value]
    if isinstance(value, dict):
        return {
            str(key).replace(secret, "[redacted]"): redact_secret(item, secret)
            for key, item in value.items()
        }
    return value
