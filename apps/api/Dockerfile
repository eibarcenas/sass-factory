# syntax=docker/dockerfile:1
FROM python:3.13-slim

WORKDIR /app

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
RUN pip install uv --quiet

COPY pyproject.toml ./

# Install public deps (no token needed)
RUN uv pip install --system \
    fastapi "uvicorn[standard]" pydantic pydantic-settings \
    google-cloud-firestore google-cloud-storage \
    firebase-admin cachetools slowapi \
    python-dotenv python-multipart

# Install factory_auth from private repo — token mounted as a build secret,
# never stored in any image layer (requires DOCKER_BUILDKIT=1)
RUN --mount=type=secret,id=gh_pat \
    git config --global url."https://x-access-token:$(cat /run/secrets/gh_pat)@github.com/".insteadOf "https://github.com/" && \
    uv pip install --system "factory-auth @ git+https://github.com/eibarcenas/factory-sdk.git#subdirectory=python"

COPY . .

ENV PORT=8080
EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
