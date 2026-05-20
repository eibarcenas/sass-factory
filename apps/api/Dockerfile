FROM python:3.13-slim

WORKDIR /app

# Install uv for fast installs
RUN pip install uv --quiet

COPY pyproject.toml ./
RUN uv pip install --system fastapi "uvicorn[standard]" pydantic pydantic-settings \
    google-cloud-firestore python-dotenv python-multipart

COPY . .

ENV PORT=8080
EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
