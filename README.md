[![Forks](https://img.shields.io/github/forks/Aarondoran/Node-URL-shortener)](https://github.com/Aarondoran/Node-URL-shortener/network)
[![Stars](https://img.shields.io/github/stars/Aarondoran/Node-URL-shortener)](https://github.com/Aarondoran/Node-URL-shortener/stargazers)
[![Releases](https://img.shields.io/github/v/release/Aarondoran/Node-URL-shortener)](https://github.com/Aarondoran/Node-URL-shortener/releases)
[![Last Commit](https://img.shields.io/github/last-commit/Aarondoran/Node-URL-shortener)](https://github.com/Aarondoran/Node-URL-shortener/commits/main)
[![Website](https://custom-icon-badges.demolab.com/badge/Aarondoran.me-blue?logo=aarondoran-pfp&labelColor=grey)](https://aarondoran.me)


# DotLink - Simple URL Shortener

DotLink is a minimal URL shortener that allows the creation of shortened links with optional custom aliases. Anyone can access shortened links, and the API also provides statistics such as click counts and original URLs.

## Features

* Custom aliases for shortened links
* PostgreSQL database integration
* Simple REST API with Express
* Link analytics endpoint to check clicks and original URL
* Custom 404 page for invalid or non-existent links

## Setup

### 1. Clone the Repository

```
git clone https://github.com/Aarondoran/dotlink.git
cd dotlink
```

### 2. Install Dependencies

```
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory and add the following:

```
PORT=3030
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@YOUR_HOST/YOUR_DATABASE
```

Replace `DATABASE_URL` with your actual PostgreSQL connection string.

### 4. Set Up the Database

Create the `urls` table in your PostgreSQL database:

```
CREATE TABLE urls (
  id SERIAL PRIMARY KEY,
  short_id VARCHAR(255) NOT NULL,
  original_url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Start the Server

Run manually:

```
node server.js
```

OR run with PM2 (recommended for production):

```
pm2 start server.js --name dotlink
```

## API Endpoints

### ➤ Shorten a URL

**Endpoint:**

```
POST /api/shorten
```

**Request Body:**

```
{
  "originalUrl": "https://example.com",
  "customAlias": "myalias"
}
```

**Response:**

```
{
  "shortUrl": "http://yourdomain.com/myalias"
}
```

---

### ➤ Redirect to Original URL

**Endpoint:**

```
GET /:short_id
```

**Example:**

```
GET http://yourdomain.com/myalias
```

Redirects to:

```
https://example.com
```

---

### ➤ Check Link Information

Returns the original URL and click count for a shortened link.

**Endpoint:**

```
GET /check/:id
```

**Response:**

```
{
  "short_id": "myalias",
  "original_url": "https://example.com",
  "clicks": 42,
  "created_at": "2024-01-01T12:00:00.000Z"
}
```

## License

This project is licensed under the MIT License.
