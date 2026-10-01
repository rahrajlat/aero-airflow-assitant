"""Aero Chainlit app for Airflow DAG assistance."""

from __future__ import annotations

import asyncio
import json
import os
from http.cookies import SimpleCookie
from pathlib import Path
from typing import Any, AsyncIterator
from urllib import request

import chainlit as cl

from aero_context import get_aero_context as get_stored_aero_context


try:
    from strands import tool as strands_tool
except ImportError:
    strands_tool = None


DAGS_FOLDER = Path(
    os.getenv("AIRFLOW__CORE__DAGS_FOLDER", "/opt/airflow/dags")
)

DEFAULT_OLLAMA_HOST = os.getenv(
    "AERO_OLLAMA_HOST",
    "http://host.docker.internal:11434",
)

DEFAULT_OLLAMA_MODEL = os.getenv(
    "AERO_OLLAMA_MODEL",
    "llama3.1",
)


# ---------------------------------------------------------------------------
# Tool decorator
# ---------------------------------------------------------------------------


def aero_tool(func):
    if strands_tool is None:
        return func

    return strands_tool(func)


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
# Fallback response
# ---------------------------------------------------------------------------


def fallback_dag_explanation(
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
        f"I found DAG `{dag_id}` in `{location}`.\n\n"
        "I could not reach a configured LLM, so here is a "
        "lightweight Airflow metadata summary.\n\n"
        f"Description: {description}\n\n"
        f"Tags: {tags}\n\n"
        f"Schedule: {schedule}\n\n"
        "Tasks and dependencies:\n"
        f"{task_details}\n\n"
        "Ask again once Ollama or Bedrock is available and "
        "I can produce a fuller natural-language explanation."
    )


# ---------------------------------------------------------------------------
# Airflow tools
# ---------------------------------------------------------------------------


@aero_tool
def get_airflow_dag_metadata(dag_id: str) -> str:
    """Return read-only Airflow DAG metadata, tasks, operators,
    and dependencies."""

    return json.dumps(
        get_dag_metadata(dag_id),
        indent=2,
        default=str,
    )


@aero_tool
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


@aero_tool
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


@aero_tool
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


@aero_tool
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


AIRFLOW_TOOLS = [
    get_airflow_dag_metadata,
    get_airflow_dag_source,
    summarize_airflow_task_flow,
    summarize_airflow_schedule,
    scan_airflow_dag_risks,
]


# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------


def build_prompt(
    question: str,
    page_context: dict,
    dag_id: str | None,
    dag_metadata: dict[str, Any],
    dag_path: Path | None,
    dag_source: str,
    chat_history: list[dict[str, str]],
) -> str:

    history = "\n".join(
        f"{item['role']}: {item['content']}"
        for item in chat_history[-8:]
    ) or "No prior conversation."

    tool_context = (
        "No DAG is currently available in Aero context."
    )

    if dag_id and dag_metadata:
        tool_context = "\n\n".join(
            [
                (
                    "Airflow DAG metadata:\n"
                    + get_airflow_dag_metadata(dag_id)
                ),
                (
                    "Task flow:\n"
                    + summarize_airflow_task_flow(dag_id)
                ),
                (
                    "Schedule:\n"
                    + summarize_airflow_schedule(dag_id)
                ),
                (
                    "Risk scan:\n"
                    + scan_airflow_dag_risks(dag_id)
                ),
                (
                    f"DAG file: {dag_path}\n\n"
                    "DAG source:\n"
                    "```python\n"
                    f"{dag_source}\n"
                    "```"
                ),
            ]
        )

    return f"""
You are Aero, an Apache Airflow assistant.

Answer the user's latest question.

Guidelines:
- Be conversational and concise.
- Use the Airflow page/DAG context silently.
- Do not dump raw context ids or debug fields.
- If the user asks what the DAG does, explain the purpose,
  task flow, dependencies, schedule and retry details when visible.
- If the user asks a follow-up, use the recent chat history.
- Do not invent external systems or behavior not present in
  the metadata/source.
- If needed context is missing, ask the user to open the
  relevant DAG/task/run page.

Recent chat history:
{history}

Latest user question:
{question}

Current Airflow page context:
{page_context}

Tool results:
{tool_context}
"""


# ---------------------------------------------------------------------------
# Strands
# ---------------------------------------------------------------------------


def get_strands_agent():
    provider = os.getenv(
        "AERO_LLM_PROVIDER",
        "ollama",
    ).lower()

    from strands import Agent

    if provider == "bedrock":
        return Agent(
            tools=AIRFLOW_TOOLS,
        )

    from strands.models.ollama import OllamaModel

    return Agent(
        model=OllamaModel(
            host=DEFAULT_OLLAMA_HOST,
            model_id=DEFAULT_OLLAMA_MODEL,
        ),
        tools=AIRFLOW_TOOLS,
    )


# ---------------------------------------------------------------------------
# Ollama streaming
# ---------------------------------------------------------------------------


def _ollama_stream_worker(
    prompt: str,
    loop: asyncio.AbstractEventLoop,
    queue: asyncio.Queue,
) -> None:
    """
    Run the blocking urllib Ollama stream in a worker thread.

    Tokens are forwarded safely back to the asyncio event loop
    through an asyncio.Queue.
    """

    try:
        payload = {
            "model": DEFAULT_OLLAMA_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are Aero, a concise Apache "
                        "Airflow assistant."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            "stream": True,
        }

        data = json.dumps(payload).encode("utf-8")

        req = request.Request(
            f"{DEFAULT_OLLAMA_HOST.rstrip('/')}/api/chat",
            data=data,
            headers={
                "Content-Type": "application/json",
            },
            method="POST",
        )

        with request.urlopen(
            req,
            timeout=120,
        ) as response:

            for raw_line in response:
                if not raw_line:
                    continue

                line = raw_line.decode(
                    "utf-8",
                    errors="ignore",
                ).strip()

                if not line:
                    continue

                try:
                    chunk = json.loads(line)
                except json.JSONDecodeError:
                    continue

                if chunk.get("error"):
                    raise RuntimeError(
                        chunk["error"]
                    )

                token = (
                    chunk
                    .get("message", {})
                    .get("content", "")
                )

                if token:
                    asyncio.run_coroutine_threadsafe(
                        queue.put(
                            ("token", token)
                        ),
                        loop,
                    ).result()

                if chunk.get("done"):
                    break

    except Exception as error:
        asyncio.run_coroutine_threadsafe(
            queue.put(
                ("error", error)
            ),
            loop,
        ).result()

    finally:
        asyncio.run_coroutine_threadsafe(
            queue.put(
                ("done", None)
            ),
            loop,
        ).result()


async def stream_ollama(
    prompt: str,
) -> AsyncIterator[str]:
    """
    Stream Ollama tokens without blocking Chainlit's event loop.
    """

    queue: asyncio.Queue = asyncio.Queue()

    loop = asyncio.get_running_loop()

    worker = asyncio.create_task(
        asyncio.to_thread(
            _ollama_stream_worker,
            prompt,
            loop,
            queue,
        )
    )

    try:
        while True:
            event_type, value = await queue.get()

            if event_type == "token":
                yield value

            elif event_type == "error":
                raise value

            elif event_type == "done":
                break

    finally:
        await worker


# ---------------------------------------------------------------------------
# Strands fallback
# ---------------------------------------------------------------------------


async def stream_strands(
    prompt: str,
) -> AsyncIterator[str]:
    """
    Current compatibility path for Strands.

    This keeps Bedrock/Strands working even if the installed
    Strands version does not expose the same streaming API.

    The Chainlit/Ollama path streams token-by-token.
    """

    agent = get_strands_agent()

    result = await asyncio.to_thread(
        agent,
        prompt,
    )

    text = str(result)

    if text:
        yield text


# ---------------------------------------------------------------------------
# Unified LLM stream
# ---------------------------------------------------------------------------


async def stream_llm(
    prompt: str,
) -> AsyncIterator[str]:

    provider = os.getenv(
        "AERO_LLM_PROVIDER",
        "ollama",
    ).lower()

    if provider == "ollama":
        async for token in stream_ollama(prompt):
            yield token

        return

    async for token in stream_strands(prompt):
        yield token


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

    chat_history = (
        cl.user_session.get("chat_history")
        or []
    )

    if dag_id and not dag_source:
        yield (
            f"I found DAG `{dag_id}`, but I could not "
            f"read its source under `{DAGS_FOLDER}`."
        )
        return

    prompt = build_prompt(
        question=question,
        page_context=page_context,
        dag_id=dag_id,
        dag_metadata=dag_metadata,
        dag_path=dag_path,
        dag_source=dag_source,
        chat_history=chat_history,
    )

    try:
        async for token in stream_llm(prompt):
            yield token

    except Exception as error:
        if not dag_id:
            yield (
                "I could not reach the configured LLM yet. "
                "Open a DAG page and ask again, or check "
                "the Ollama/Bedrock configuration."
                f"\n\nLLM error: "
                f"`{error.__class__.__name__}: {error}`"
            )

            return

        yield (
            fallback_dag_explanation(
                dag_id,
                dag_metadata,
                dag_path,
            )
            + "\n\n"
            + "LLM error: "
            + f"`{error.__class__.__name__}: {error}`"
        )


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

    await cl.Message(
        content=(
            "Hi, I am Aero.\n\n"
            f"Current focus: {context_title()}\n\n"
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
