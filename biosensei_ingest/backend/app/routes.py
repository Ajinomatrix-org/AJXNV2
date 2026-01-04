import logging
import uuid
from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from sqlalchemy import select, text
from .schemas import IngestPayload
from .models import TelemetryEvent
from .db import get_db, SessionLocal

api_bp = Blueprint("api", __name__)
logger = logging.getLogger(__name__)

# Basic Logging
logging.basicConfig(level=logging.INFO)

@api_bp.route("/health", methods=["GET"])
def health():
    # Check DB
    try:
        session = SessionLocal()
        session.execute(text("SELECT 1"))
        session.close()
        return jsonify({"status": "ok", "db": "connected"}), 200
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({"status": "error", "db": str(e)}), 500

@api_bp.route("/ingest", methods=["POST"])
def ingest():
    data = request.json
    if not data:
        return jsonify({"error": "No JSON payload provided"}), 400

    try:
        # Validate
        payload = IngestPayload(**data)
    except ValidationError as e:
        return jsonify({"error": "Validation failed", "details": e.errors()}), 400

    # Store
    session = SessionLocal()
    try:
        event = TelemetryEvent(
            timestamp=payload.timestamp,
            device_id=payload.device_id,
            source=payload.source,
            schema_version=payload.schema_version,
            payload=payload.model_dump(mode='json')  # Store full validated payload
        )
        session.add(event)
        session.commit()
        session.refresh(event)
        return jsonify({"id": str(event.id), "status": "stored"}), 201
    except Exception as e:
        session.rollback()
        logger.error(f"Ingest error: {e}")
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        session.close()

@api_bp.route("/events", methods=["GET"])
def list_events():
    limit = request.args.get("limit", 50, type=int)
    offset = request.args.get("offset", 0, type=int)
    device_id = request.args.get("device_id")
    source = request.args.get("source")

    session = SessionLocal()
    try:
        stmt = select(TelemetryEvent).order_by(TelemetryEvent.timestamp.desc()).limit(limit).offset(offset)
        
        if device_id:
            stmt = stmt.where(TelemetryEvent.device_id == device_id)
        if source:
            stmt = stmt.where(TelemetryEvent.source == source)

        result = session.execute(stmt).scalars().all()
        
        events = []
        for row in result:
            events.append({
                "id": str(row.id),
                "timestamp": row.timestamp.isoformat(),
                "device_id": row.device_id,
                "source": row.source,
                "payload": row.payload
            })
        
        return jsonify(events), 200
    finally:
        session.close()

@api_bp.route("/events/<event_id>", methods=["GET"])
def get_event(event_id):
    session = SessionLocal()
    try:
        try:
            uuid_obj = uuid.UUID(event_id)
        except ValueError:
             return jsonify({"error": "Invalid UUID format"}), 400

        stmt = select(TelemetryEvent).where(TelemetryEvent.id == uuid_obj)
        event = session.execute(stmt).scalar_one_or_none()
        
        if not event:
            return jsonify({"error": "Event not found"}), 404

        return jsonify({
            "id": str(event.id),
            "timestamp": event.timestamp.isoformat(),
            "device_id": event.device_id,
            "source": event.source,
            "payload": event.payload
        }), 200
    finally:
        session.close()
