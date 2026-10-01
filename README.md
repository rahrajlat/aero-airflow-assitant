<div align="center">

<img src="airflow_docker/plugins/aero/aero-favicon.svg" alt="Aero logo" width="120" />

# Aero for Apache Airflow

### Bring AI-assisted DAG understanding directly into the Airflow UI.

[![Apache Airflow](https://img.shields.io/badge/Apache_Airflow-3.x-017CEE?logo=apacheairflow&logoColor=white)](https://airflow.apache.org/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=0B1020)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-Apache_2.0-D22128?logo=apache&logoColor=white)](LICENSE)

[Apache Airflow](https://airflow.apache.org/) · [Airflow Plugins](https://airflow.apache.org/docs/apache-airflow/stable/administration-and-deployment/plugins.html) · [Chainlit](https://github.com/Chainlit/chainlit) · [Strands](https://strandsagents.com/) · [FastAPI](https://fastapi.tiangolo.com/) · [React](https://react.dev/)

</div>

Aero is a local Apache Airflow 3 assistant layer built with Chainlit and FastAPI. It brings DAG-aware AI support into the Airflow environment so you can inspect DAG metadata, review source code, and ask contextual questions about a DAG without leaving the Airflow UI experience.

Right now, this project does three main things:

- runs a local Airflow 3 stack with PostgreSQL, Redis, and Celery workers
- mounts a custom Aero plugin into the Airflow UI so the assistant can read the current page context and DAG metadata
- exposes a Chainlit chat app that can inspect DAG source files and answer questions about the current DAG/task context

This repository packages the full local development stack: Airflow, PostgreSQL, Redis, Celery workers, a custom Aero plugin, and a demo DAG for experimentation.

## Demo

<video controls width="900">
  <source src="demo-aero.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

## Table of Contents

- [Features](#features)
- [Plugin Layout](#plugin-layout)
- [Local Development With This Repo](#local-development-with-this-repo)
- [Demo DAG](#demo-dag)
- [Access Points](#access-points)
- [Configuration](#configuration)
- [API and Integration Points](#api-and-integration-points)
- [Development Notes](#development-notes)
- [Requirements](#requirements)
- [License](#license)

## Features

- Built as an Airflow plugin with a mounted FastAPI app
- Exposes a Chainlit-powered assistant experience under the Airflow web app
- Reads DAG metadata and source files for contextual explanation
- Stores browser page context so the assistant understands the current DAG/task/page
- Works with local Ollama-based LLMs or other compatible model providers
- Includes a randomized demo DAG to exercise long-running and varied task timings
- Keeps a local Docker Compose environment for quick iteration and experimentation

## Plugin Layout

The custom plugin lives in:

```text
airflow_docker/plugins/aero/
  __init__.py
  aero_chainlit.py
  aero_context.py
  aero_plugin.py
  aero-chainlit.css
  aero-chainlit.js
  aero.js
```

`aero_plugin.py` registers:

- a FastAPI app at `/aero`
- static assets served from the plugin directory
- a Chainlit app mounted under `/aero/chainlit`
- a React/Aero UI bundle exposed as an Airflow plugin app

The Chainlit logic is configured from:

```text
airflow_docker/config/aero_chainlit.py
```

The frontend source is under:

```text
airflow_docker/widgets/aero-ui/
```

## Local Development With This Repo

Build and start the stack from the repo root:

```bash
cd airflow_docker
docker compose up --build -d
```

Check logs if needed:

```bash
docker compose logs -f airflow-scheduler
```

Shut the environment down when you are finished:

```bash
docker compose down
```

To reset the local database volumes as well:

```bash
docker compose down -v
```

After code changes to the React UI, rebuild the frontend bundle from the widget directory:

```bash
cd airflow_docker/widgets/aero-ui
pnpm install
pnpm run build
```

If the plugin changes do not appear, restart Airflow containers:

```bash
cd airflow_docker
docker compose restart airflow-apiserver
```

For more significant plugin or mount changes, recreate the stack:

```bash
docker compose down
docker compose up -d
```

## Demo DAG

This repo includes a demo DAG:

```text
airflow_docker/dags/run_lens_random_sleep_demo.py
```

It creates several `PythonOperator` tasks with randomized sleep durations. Trigger it multiple times to generate realistic DAG runs useful for testing runtime behavior, debugging delays, and exploring metadata-driven assistance.

## Access Points

Once the stack is running, use these endpoints:

- Airflow UI: http://localhost:8080
- Airflow login: username `airflow`, password `airflow`
- Aero app: http://localhost:8080/aero
- Aero Chainlit assistant: http://localhost:8080/aero/chainlit

## Configuration

Configuration is defined in `airflow_docker/docker-compose.yaml`.

Important defaults include:

- `AIRFLOW__CORE__EXECUTOR=CeleryExecutor`
- `AIRFLOW__CORE__LOAD_EXAMPLES=false`
- `AERO_LLM_PROVIDER=${AERO_LLM_PROVIDER:-ollama}`
- `AERO_OLLAMA_HOST=${AERO_OLLAMA_HOST:-http://host.docker.internal:11434}`
- `AERO_OLLAMA_MODEL=${AERO_OLLAMA_MODEL:-qwen2.5:3b}`

The configuration mounts local directories so the config, DAGs, logs, and plugin files are editable without rebuilding the entire environment.

## API and Integration Points

The Aero stack integrates with Airflow through:

- the custom plugin registration in `aero_plugin.py`
- context storage via `aero_context.py`
- the Chainlit app configured in `aero_chainlit.py`
- FastAPI endpoints mounted under the Airflow plugin path

In practice, the assistant can inspect:

- current DAG metadata
- task dependencies and DAG structure
- task and run context from the current Airflow page
- DAG source files from the mounted `dags` directory

## Strands and Tool Calling

Aero uses a tool-enabled agent pattern so the LLM is not just answering from a static prompt. Instead, the assistant is wired to a small set of Airflow-specific tools defined in `airflow_docker/config/aero_chainlit.py`.

The current tool set includes:

- `get_airflow_dag_metadata(dag_id)`
  - returns the DAG definition, tags, schedule, task list, upstream/downstream dependencies, and retry metadata
- `get_airflow_dag_source(dag_id)`
  - reads the DAG Python source file and returns the relevant code with truncation for large files
- `summarize_airflow_task_flow(dag_id)`
  - prints a concise dependency map for the DAG
- `summarize_airflow_schedule(dag_id)`
  - summarizes schedule, catchup behavior, tags, and run settings
- `scan_airflow_dag_risks(dag_id)`
  - performs a lightweight static-risk scan for missing descriptions, empty schedules, missing retries, and common operational concerns

These tools are registered in `AIRFLOW_TOOLS` and passed into the model agent. The runtime checks the configured provider from `AERO_LLM_PROVIDER`:

- if the provider is `ollama`, it uses the Ollama chat endpoint and streams tokens back into the Chainlit UI
- otherwise, it falls back to the Strands agent path, which can use a provider-specific model backend such as Bedrock or another supported Strands configuration

In other words, the assistant can answer questions like:

- “What does this DAG do?”
- “Show me the task flow and dependencies.”
- “Summarize the schedule and run settings.”
- “Are there any obvious risks in this DAG?”

using real Airflow metadata and DAG source rather than relying only on generic model knowledge.

## Development Notes

- This is a local development environment, not a production deployment.
- The custom Aero layer is designed to be easily extended with more DAG analysis tools or richer LLM workflows.
- The project uses Docker Compose for a reproducible local Airflow environment.
- FastAPI and Chainlit are mounted into the Airflow plugin runtime rather than running as separate services.

## Requirements

- Apache Airflow 3.x
- Docker with Compose support
- Python dependencies installed in the Airflow image
- Optional: Ollama or another compatible LLM endpoint for AI-assisted behavior
- Optional: Node.js and pnpm for frontend rebuilds

## License

Apache-2.0. See [LICENSE](LICENSE).
