from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional

app = FastAPI()


class Book(BaseModel):
    title: str
    author: str
    pages: int = Field(ge=1, le=2000)
    genre: str
    isbn: Optional[str] = None


@app.get("/")
def home():
    return {
        "message": "Hello, this is my Book Library API"
    }


@app.get("/books")
def get_books():
    return {
        "books": ["Harry Potter", "The Alchemist", "Atomic Habits"]
    }


@app.get("/books/{book_id}")
def get_book_by_id(book_id: int):
    return {
        "book_id": book_id
    }


@app.get("/search")
def search_book(title: str):
    return {
        "searching_for": title
    }


@app.post("/books")
def add_book(book: Book):
    return {
        "message": "Book added successfully",
        "book": book
    }



