"""In-memory Aero context handoff for the current Airflow API server process."""

from __future__ import annotations

from time import time
from typing import Any

_CONTEXTS: dict[str, tuple[float, dict[str, Any]]] = {}
_TTL_SECONDS = 60 * 60


def set_aero_context(context_id: str, context: dict[str, Any]) -> None:
    cleanup_expired_contexts()
    _CONTEXTS[context_id] = (time(), context)


def get_aero_context(context_id: str | None) -> dict[str, Any]:
    if not context_id:
        return {}
    created_at, context = _CONTEXTS.get(context_id, (0, {}))
    if not context or time() - created_at > _TTL_SECONDS:
        _CONTEXTS.pop(context_id, None)
        return {}
    return context


def cleanup_expired_contexts() -> None:
    cutoff = time() - _TTL_SECONDS
    expired = [
        context_id
        for context_id, (created_at, _) in _CONTEXTS.items()
        if created_at < cutoff
    ]
    for context_id in expired:
        _CONTEXTS.pop(context_id, None)
