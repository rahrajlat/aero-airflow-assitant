"""Aero mascot plugin for Airflow 3."""

from __future__ import annotations

from pathlib import Path

from airflow.plugins_manager import AirflowPlugin
from aero_context import set_aero_context
from chainlit.utils import mount_chainlit
from fastapi import Depends, FastAPI
from fastapi.staticfiles import StaticFiles

try:
    from airflow.api_fastapi.core_api.security import get_user
except ImportError:
    get_user = None


dependencies = [Depends(get_user)] if get_user is not None else []
app = FastAPI(title="Aero", dependencies=dependencies, root_path="/aero")
static_dir = Path(__file__).parent
chainlit_app_path = Path("/opt/airflow/config/aero_chainlit.py")
app.mount("/static", StaticFiles(directory=static_dir), name="aero_static")


@app.post("/context/{context_id}")
async def save_context(context_id: str, context: dict) -> dict[str, str]:
    set_aero_context(context_id, context)
    return {"status": "ok"}


mount_chainlit(app=app, target=str(chainlit_app_path), path="/chainlit")


class AeroPlugin(AirflowPlugin):
    name = "aero"

    fastapi_apps = [
        {
            "app": app,
            "url_prefix": "/aero",
            "name": "Aero",
        }
    ]

    react_apps = [
        {
            "name": "Aero",
            "bundle_url": "/aero/static/aero.js?v=20261001-skyblue-aero",
            "destination": "base",
            "url_route": "aero",
        }
    ]
