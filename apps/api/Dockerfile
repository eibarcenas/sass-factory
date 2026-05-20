FROM python:3.13-slim

WORKDIR /app

RUN pip install uv --quiet

COPY pyproject.toml ./
# Install all dependencies declared in pyproject.toml
RUN uv pip install --system \
    fastapi "uvicorn[standard]" pydantic pydantic-settings \
    google-cloud-firestore google-cloud-storage \
    firebase-admin cachetools slowapi \
    python-dotenv python-multipart

COPY . .

ENV PORT=8080
EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
