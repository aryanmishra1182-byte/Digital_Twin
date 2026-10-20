FROM python:3.10-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl gcc g++ && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY ml ./ml
COPY simulator ./simulator
COPY data ./data
EXPOSE 8001
CMD ["python", "-m", "uvicorn", "ml.service:app", "--host", "0.0.0.0", "--port", "8001"]
