# BioSensei Ingest System

Systeme complet d'ingestion télémétrique avec Backend Flask/SQLAlchemy et Frontend React/Vite.

## Architecture

- **Backend**: Flask + SQLAlchemy + Pydantic (Port 8000)
- **Frontend**: React + Vite (Port 5173)
- **Database**: PostgreSQL 15 (Port 5433)

## Prérequis

- Docker & Docker Compose

## Lancer le projet

```bash
docker compose up --build
```

Le frontend sera accessible sur [http://localhost:5173](http://localhost:5173).
Le backend sera accessible sur [http://localhost:8000](http://localhost:8000).

## Vérification et Tests

### Interface Web (React)
Ouvrir [http://localhost:5173](http://localhost:5173).
Un formulaire vous permet d'envoyer des données.
La liste des événements récents s'affiche en bas.

### API (CURL)

**Health Check:**
```bash
curl http://localhost:8000/api/v1/health
```

**Ingérer un événement:**
```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2026-01-02T12:00:00Z",
    "device_id": "test-cli-01",
    "metrics": [{"name": "temp", "value": 23.5}]
  }'
```

**Lire les événements:**
```bash
curl "http://localhost:8000/api/v1/events?limit=5"
```

### Access Base de Données
Pour inspecter la DB directement:
```bash
docker compose exec db psql -U biosensei -d biosensei_ingest
# Puis: SELECT * FROM telemetry_events;
```

## Configuration

Pour changer l'URL de l'API côté front, modifier `VITE_API_BASE_URL` dans `docker-compose.yml`.
