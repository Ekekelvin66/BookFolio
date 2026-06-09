# 📚 My Book Library

A full-stack web application that allows users to log, review and manage books they have read. Book covers are automatically fetched from the Open Library API based on the title and author provided.

---

## Features

- View all books in your library in a clean grid layout
- Add new books with automatic cover fetching from Open Library
- Write and save personal reviews and recommendations
- Rate books with an interactive star rating system
- Edit reviews and ratings  without leaving the page
- Delete books from your library
- Sort books by rating (high to low, low to high), date read, and recently added
- User authentication — register and login with hashed passwords
- Fully responsive design

---

## Technologies Used

- **Node.js** — JavaScript runtime
- **Express.js** — Web framework and routing
- **PostgreSQL** — Relational database for persisting book data
- **EJS** — Server-side templating engine
- **Axios** — HTTP requests to the Open Library API
- **Bcrypt** — Password hashing for secure authentication
- **Express-Session** — Session management for user login state
- **Open Library API** — Fetching book cover images

---

## Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/my-book-library.git
cd my-book-library
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the PostgreSQL database

Open your terminal and run:

```bash
psql -U postgres
```

Then inside psql:

```sql
CREATE DATABASE book_library;
\c book_library
```

### 4. Create the database tables

Run the following SQL to set up your schema:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    cover_url TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    recommendation TEXT,
    date_read DATE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Set up your environment variables

Create a `.env` file in the root of the project:

```
PORT=3000
DB_USER=your_postgres_username
DB_HOST=localhost
DB_NAME=book_library
DB_PASSWORD=your_postgres_password
DB_PORT=5432
SESSION_SECRET=your_secret_key_here
```

### 6. Run the application

```bash
nodemon index.js
```

Then open your browser and go to:

```
http://localhost:3000
```

---

## Project Structure

```
my-book-library/
├── views/
│   ├── partials/
│   │   ├── header.ejs
│   │   └── footer.ejs
│   ├── index.ejs
│   ├── view.ejs
│   ├── add.ejs
│   └── error.ejs
├── public/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── view.js
├── controllers.js
├── routes.js
├── db.js
├── index.js
├── .env
├── .gitignore
└── README.md
```

---

## API Reference

This project uses the [Open Library Covers API](https://openlibrary.org/dev/docs/api) to fetch book cover images.

Cover images are fetched using:
```
https://covers.openlibrary.org/b/id/{cover_id}-M.jpg
```

No API key is required.

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the server runs on |
| `DB_USER` | PostgreSQL username |
| `DB_HOST` | Database host (usually localhost) |
| `DB_NAME` | Name of your database |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_PORT` | PostgreSQL port (usually 5432) |
| `SESSION_SECRET` | Secret key for session encryption |

---

## .gitignore

Make sure your `.gitignore` includes:

```
node_modules/
.env
```

---

## Author

**Eke Chiemela Kelvin**  
Software Engineering Student  
