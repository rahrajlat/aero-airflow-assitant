FROM apache/airflow:3.3.0
LABEL tag="airflow_docker:latest"
COPY requirements.txt /requirements.txt
USER airflow
RUN pip install --no-cache-dir "apache-airflow==${AIRFLOW_VERSION}" -r /requirements.txt
