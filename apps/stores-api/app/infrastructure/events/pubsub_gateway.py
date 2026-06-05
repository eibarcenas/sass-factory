import json
import logging
import os
from typing import Any

logger = logging.getLogger(__name__)


def publish_event(topic_name: str, payload: dict[str, Any], attributes: dict[str, str] | None = None) -> str | None:
    project_id = os.getenv("PUBSUB_PROJECT_ID") or os.getenv("FIRESTORE_PROJECT_ID")
    if not project_id or os.getenv("PUBSUB_ENABLED", "true").lower() == "false":
        logger.info("Pub/Sub publish skipped for topic %s", topic_name)
        return None

    try:
        from google.cloud import pubsub_v1

        publisher = pubsub_v1.PublisherClient()
        topic_path = publisher.topic_path(project_id, topic_name)
        data = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        future = publisher.publish(topic_path, data=data, **(attributes or {}))
        return future.result(timeout=10)
    except Exception as exc:
        logger.error("Pub/Sub publish failed for topic %s: %s", topic_name, exc)
        return None
