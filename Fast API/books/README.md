# Book Management API

A FastAPI REST API for a SQLite-backed book inventory.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Open the interactive API documentation at `http://127.0.0.1:8000/docs`.

## Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/` | API welcome message |
| GET | `/health` | Health check |
| POST | `/books` | Create a book |
| GET | `/books` | List all books |
| GET | `/books/{book_id}` | Get one book |
| PUT | `/books/{book_id}` | Replace a book |
| DELETE | `/books/{book_id}` | Delete a book |

### Example book

```json
{
  "title": "Atomic Habits",
  "author": "James Clear",
  "category": "Self-help",
  "price": 499.0,
  "quantity": 12
}
```

Set `DATABASE_URL` to use PostgreSQL; otherwise the API stores data in `books.db`.
