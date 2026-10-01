"""Aero Chainlit app for Airflow DAG assistance."""

from __future__ import annotations

import asyncio
import json
import os
import sys
from http.cookies import SimpleCookie
from pathlib import Path
from typing import Any, AsyncIterator

import chainlit as cl

AERO_PLUGIN_DIR = Path(
    os.getenv("AERO_PLUGIN_DIR", "/opt/airflow/plugins/aero")
)

if str(AERO_PLUGIN_DIR) not in sys.path:
    sys.path.insert(0, str(AERO_PLUGIN_DIR))

from aero_context import get_aero_context as get_stored_aero_context


DAGS_FOLDER = Path(
    os.getenv("AIRFLOW__CORE__DAGS_FOLDER", "/opt/airflow/dags")
)


# ---------------------------------------------------------------------------
# Aero / Airflow context
# ---------------------------------------------------------------------------


def get_aero_context() -> dict:
    from chainlit.context import context

    environ = getattr(context.session, "environ", None) or {}
    cookies = SimpleCookie(environ.get("HTTP_COOKIE", ""))

    context_id = cookies.get("aero_context_id")

    return get_stored_aero_context(
        context_id.value if context_id else None
    )


def normalize_context(context: dict) -> dict[str, str | None]:
    return {
        "page_type": context.get("pageType") or context.get("page_type"),
        "dag_id": context.get("dagId") or context.get("dag_id"),
        "run_id": context.get("runId") or context.get("run_id"),
        "task_id": context.get("taskId") or context.get("task_id"),
        "path": context.get("path"),
        "source_url": context.get("url") or context.get("source_url"),
    }


# ---------------------------------------------------------------------------
# DAG discovery / metadata
# ---------------------------------------------------------------------------


def find_dag_file(dag_id: str) -> Path | None:
    for path in DAGS_FOLDER.rglob("*.py"):
        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            content = path.read_text(errors="ignore")

        if dag_id in content:
            return path

    return None


def get_dag_metadata(dag_id: str) -> dict[str, Any]:
    from airflow.dag_processing.dagbag import DagBag

    dag_bag = DagBag(
        dag_folder=DAGS_FOLDER,
        safe_mode=False,
        collect_dags=True,
    )

    dag = dag_bag.get_dag(dag_id)

    if dag is None:
        return {}

    tasks = []

    for task in dag.tasks:
        tasks.append(
            {
                "task_id": task.task_id,
                "operator": task.task_type,
                "upstream_task_ids": sorted(task.upstream_task_ids),
                "downstream_task_ids": sorted(task.downstream_task_ids),
                "retries": getattr(task, "retries", None),
            }
        )

    return {
        "dag_id": dag.dag_id,
        "description": dag.description,
        "tags": sorted(dag.tags),
        "fileloc": dag.fileloc,
        "schedule": getattr(dag, "timetable_summary", None)
        or str(getattr(dag, "schedule_interval", "") or ""),
        "catchup": getattr(dag, "catchup", None),
        "max_active_runs": getattr(dag, "max_active_runs", None),
        "tasks": tasks,
    }


def truncate_content(
    content: str,
    limit: int = 18000,
) -> str:
    if len(content) <= limit:
        return content

    return content[:limit] + "\n\n# ... truncated by Aero ..."


def get_dag_source(
    dag_id: str,
    dag_metadata: dict[str, Any],
) -> tuple[Path | None, str]:
    fileloc = dag_metadata.get("fileloc")

    path = Path(fileloc) if fileloc else find_dag_file(dag_id)

    if path is None:
        return None, ""

    try:
        return (
            path,
            truncate_content(
                path.read_text(encoding="utf-8")
            ),
        )
    except UnicodeDecodeError:
        return (
            path,
            truncate_content(
                path.read_text(errors="ignore")
            ),
        )


# ---------------------------------------------------------------------------
# Mock response helpers
# ---------------------------------------------------------------------------


def mock_dag_explanation(
    dag_id: str,
    dag_metadata: dict[str, Any],
    dag_path: Path | None,
) -> str:
    location = str(dag_path) if dag_path else "unknown"

    description = (
        dag_metadata.get("description")
        or "No description set."
    )

    tags = (
        ", ".join(dag_metadata.get("tags") or [])
        or "-"
    )

    schedule = dag_metadata.get("schedule") or "-"

    tasks = dag_metadata.get("tasks") or []

    task_details = "\n".join(
        "- `{task_id}` ({operator}) -> {downstream}".format(
            task_id=task["task_id"],
            operator=task["operator"],
            downstream=", ".join(
                task["downstream_task_ids"]
            )
            or "end",
        )
        for task in tasks
    ) or "- No tasks found from Airflow metadata."

    return (
        f"Mock response: I found DAG `{dag_id}` in `{location}`.\n\n"
        f"Description: {description}\n\n"
        f"Tags: {tags}\n\n"
        f"Schedule: {schedule}\n\n"
        "Tasks and dependencies:\n"
        f"{task_details}"
    )


# ---------------------------------------------------------------------------
# Airflow metadata helpers
# ---------------------------------------------------------------------------


def get_airflow_dag_metadata(dag_id: str) -> str:
    """Return read-only Airflow DAG metadata, tasks, operators,
    and dependencies."""

    return json.dumps(
        get_dag_metadata(dag_id),
        indent=2,
        default=str,
    )


def get_airflow_dag_source(dag_id: str) -> str:
    """Return the Python source code for an Airflow DAG."""

    dag_metadata = get_dag_metadata(dag_id)

    dag_path, dag_source = get_dag_source(
        dag_id,
        dag_metadata,
    )

    if not dag_source:
        return (
            f"No source found for DAG {dag_id!r} "
            f"under {DAGS_FOLDER}."
        )

    return (
        f"DAG file: {dag_path}\n\n"
        f"{dag_source}"
    )


def summarize_airflow_task_flow(dag_id: str) -> str:
    """Return a concise task dependency flow for an Airflow DAG."""

    dag_metadata = get_dag_metadata(dag_id)

    tasks = dag_metadata.get("tasks") or []

    if not tasks:
        return f"No tasks found for DAG {dag_id!r}."

    return "\n".join(
        "- `{task_id}` ({operator}) -> {downstream}".format(
            task_id=task["task_id"],
            operator=task["operator"],
            downstream=", ".join(
                task["downstream_task_ids"]
            )
            or "end",
        )
        for task in tasks
    )


def summarize_airflow_schedule(dag_id: str) -> str:
    """Return schedule, catchup, tags, and max-active-run
    settings for an Airflow DAG."""

    dag_metadata = get_dag_metadata(dag_id)

    if not dag_metadata:
        return f"No metadata found for DAG {dag_id!r}."

    return "\n".join(
        [
            f"DAG: {dag_metadata.get('dag_id')}",
            (
                "Description: "
                f"{dag_metadata.get('description') or '-'}"
            ),
            (
                "Schedule: "
                f"{dag_metadata.get('schedule') or '-'}"
            ),
            f"Catchup: {dag_metadata.get('catchup')}",
            (
                "Max active runs: "
                f"{dag_metadata.get('max_active_runs')}"
            ),
            (
                "Tags: "
                f"{', '.join(dag_metadata.get('tags') or []) or '-'}"
            ),
        ]
    )


def scan_airflow_dag_risks(dag_id: str) -> str:
    """Return lightweight static risk signals for an Airflow DAG."""

    dag_metadata = get_dag_metadata(dag_id)

    dag_path, dag_source = get_dag_source(
        dag_id,
        dag_metadata,
    )

    risks = []

    if not dag_metadata.get("description"):
        risks.append("DAG has no description.")

    if not dag_metadata.get("schedule"):
        risks.append("DAG appears to have no schedule.")

    if dag_metadata.get("catchup"):
        risks.append(
            "Catchup is enabled; check whether historical "
            "backfills are intentional."
        )

    for task in dag_metadata.get("tasks") or []:
        if task.get("retries") in (None, 0):
            risks.append(
                f"Task `{task['task_id']}` has no retries configured."
            )

    if dag_source:
        lowered = dag_source.lower()

        if "sleep(" in lowered:
            risks.append(
                "DAG source contains `sleep`, which can make "
                "task duration intentionally variable."
            )

        if (
            "pythonoperator" in lowered
            and "on_failure_callback" not in lowered
        ):
            risks.append(
                "PythonOperator tasks do not appear to define "
                "an explicit failure callback."
            )

    return (
        "\n".join(
            f"- {risk}"
            for risk in risks[:12]
        )
        or "No obvious lightweight risks found."
    )


# ---------------------------------------------------------------------------
# Context formatting
# ---------------------------------------------------------------------------


def format_frontend_context(
    page_context: dict[str, str | None],
) -> str:
    return json.dumps(
        page_context,
        indent=2,
        sort_keys=True,
    )


def build_mock_answer(
    question: str,
    page_context: dict[str, str | None],
    dag_id: str | None,
    dag_metadata: dict[str, Any],
    dag_path: Path | None,
    dag_source: str,
) -> str:
    normalized_question = question.lower()
    context_block = (
        "Frontend context passed to Chainlit:\n"
        "```json\n"
        f"{format_frontend_context(page_context)}\n"
        "```"
    )

    if not dag_id:
        return (
            "Mock response: I do not have a DAG in the current "
            "frontend context yet. Open a DAG, task, run, graph, "
            "or grid page and I will reflect that context here.\n\n"
            f"{context_block}"
        )

    if dag_id and not dag_source:
        return (
            f"Mock response: I received DAG `{dag_id}` from the "
            "frontend context, but I could not read its source "
            f"under `{DAGS_FOLDER}`.\n\n"
            f"{context_block}"
        )

    if "flow" in normalized_question or "dependenc" in normalized_question:
        mock_body = (
            "Mock task-flow response:\n"
            f"{summarize_airflow_task_flow(dag_id)}"
        )
    elif "schedule" in normalized_question or "catchup" in normalized_question:
        mock_body = (
            "Mock schedule response:\n"
            f"{summarize_airflow_schedule(dag_id)}"
        )
    elif "risk" in normalized_question or "scan" in normalized_question:
        mock_body = (
            "Mock risk-scan response:\n"
            f"{scan_airflow_dag_risks(dag_id)}"
        )
    elif "source" in normalized_question or "code" in normalized_question:
        source_preview = dag_source[:3000]
        if len(dag_source) > len(source_preview):
            source_preview += "\n\n# ... mock preview truncated ..."
        mock_body = (
            f"Mock source response for DAG `{dag_id}` "
            f"from `{dag_path}`:\n"
            "```python\n"
            f"{source_preview}\n"
            "```"
        )
    else:
        mock_body = mock_dag_explanation(
            dag_id,
            dag_metadata,
            dag_path,
        )

    return (
        f"{mock_body}\n\n"
        f"{context_block}"
    )


# ---------------------------------------------------------------------------
# Current DAG details
# ---------------------------------------------------------------------------


def get_current_dag_details() -> tuple[
    dict[str, str | None],
    str | None,
    dict[str, Any],
    Path | None,
    str,
]:

    page_context = normalize_context(
        get_aero_context()
    )

    dag_id = page_context.get("dag_id")

    if not dag_id:
        return (
            page_context,
            None,
            {},
            None,
            "",
        )

    dag_metadata = get_dag_metadata(
        dag_id
    )

    dag_path, dag_source = get_dag_source(
        dag_id,
        dag_metadata,
    )

    return (
        page_context,
        dag_id,
        dag_metadata,
        dag_path,
        dag_source,
    )


# ---------------------------------------------------------------------------
# Context-aware response streaming
# ---------------------------------------------------------------------------


async def stream_answer_with_context(
    question: str,
) -> AsyncIterator[str]:

    (
        page_context,
        dag_id,
        dag_metadata,
        dag_path,
        dag_source,
    ) = await asyncio.to_thread(
        get_current_dag_details
    )

    answer = build_mock_answer(
        question=question,
        page_context=page_context,
        dag_id=dag_id,
        dag_metadata=dag_metadata,
        dag_path=dag_path,
        dag_source=dag_source,
    )

    yield answer


# ---------------------------------------------------------------------------
# UI helpers
# ---------------------------------------------------------------------------


def context_title() -> str:
    page_context = normalize_context(
        get_aero_context()
    )

    dag_id = page_context.get("dag_id")
    task_id = page_context.get("task_id")

    if dag_id and task_id:
        return (
            f"`{dag_id}` / `{task_id}`"
        )

    if dag_id:
        return f"`{dag_id}`"

    return (
        "Open a DAG page and I will adapt."
    )


def quick_actions() -> list[cl.Action]:
    return [
        cl.Action(
            name="aero_explain_dag",
            label="Explain DAG",
            payload={
                "question": (
                    "What does this DAG do?"
                )
            },
            icon="book-open",
        ),
        cl.Action(
            name="aero_task_flow",
            label="Task Flow",
            payload={
                "question": (
                    "Show me the task flow "
                    "and dependencies."
                )
            },
            icon="git-branch",
        ),
        cl.Action(
            name="aero_schedule",
            label="Schedule",
            payload={
                "question": (
                    "Summarize the schedule, "
                    "catchup, tags, and run settings."
                )
            },
            icon="calendar-clock",
        ),
        cl.Action(
            name="aero_risks",
            label="Risks",
            payload={
                "question": (
                    "Scan this DAG for obvious "
                    "operational risks."
                )
            },
            icon="triangle-alert",
        ),
    ]


# ---------------------------------------------------------------------------
# Send streamed answer to Chainlit
# ---------------------------------------------------------------------------


async def send_answer(
    question: str,
) -> None:

    chat_history = (
        cl.user_session.get("chat_history")
        or []
    )

    chat_history.append(
        {
            "role": "user",
            "content": question,
        }
    )

    cl.user_session.set(
        "chat_history",
        chat_history,
    )

    # Create the assistant message immediately.
    # Tokens will be appended as they arrive.
    response_message = cl.Message(
        content=""
    )

    await response_message.send()

    full_answer = ""

    async for token in stream_answer_with_context(
        question
    ):
        full_answer += token

        await response_message.stream_token(
            token
        )

    # Add quick actions once generation has finished.
    response_message.actions = quick_actions()

    await response_message.update()

    # Save the completed assistant response.
    chat_history = (
        cl.user_session.get("chat_history")
        or []
    )

    chat_history.append(
        {
            "role": "assistant",
            "content": full_answer,
        }
    )

    cl.user_session.set(
        "chat_history",
        chat_history[-10:],
    )


# ---------------------------------------------------------------------------
# Chainlit events
# ---------------------------------------------------------------------------


@cl.on_chat_start
async def on_chat_start() -> None:

    cl.user_session.set(
        "chat_history",
        [],
    )

    page_context = normalize_context(
        get_aero_context()
    )

    await cl.Message(
        content=(
            "Hi, I am Aero.\n\n"
            f"Current focus: {context_title()}\n\n"
            "Frontend context passed to Chainlit:\n"
            "```json\n"
            f"{format_frontend_context(page_context)}\n"
            "```\n\n"
            "Pick an action, or ask a follow-up."
        ),
        actions=quick_actions(),
    ).send()


@cl.on_message
async def on_message(
    message: cl.Message,
) -> None:

    await send_answer(
        message.content
    )


# ---------------------------------------------------------------------------
# Quick-action callbacks
# ---------------------------------------------------------------------------


@cl.action_callback("aero_explain_dag")
@cl.action_callback("aero_task_flow")
@cl.action_callback("aero_schedule")
@cl.action_callback("aero_risks")
async def on_action(
    action: cl.Action,
) -> None:

    await send_answer(
        action.payload["question"]
    )
