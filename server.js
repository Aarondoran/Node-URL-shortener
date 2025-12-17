const express = require("express");
const path = require('path')

const app = express();
const PORT = process.env.PORT || 3030;

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // SSL
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

app.use((err, req, res, next) => {
  console.error('Database error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/", express.static(path.join(__dirname, "public")));


// Shorten URL with custom alias (no empty alias)
app.post("/api/shorten", async (req, res) => {
  let { originalUrl, customAlias } = req.body;

  // Ensure the alias is not empty
  if (!customAlias) return res.status(400).json({ error: "Custom alias is required" });

  if (!/^https?:\/\//i.test(originalUrl)) {
    originalUrl = `https://${originalUrl}`;
  }

// Check alias format
if (!/^[a-zA-Z0-9_-]+$/.test(customAlias)) {
  return res.status(400).json({
    error: "Invalid alias format. Only letters, numbers, hyphens (-), and underscores (_) are allowed.",
  });
}
  
  // Check if the custom alias already exists in the database
  const existing = await pool.query("SELECT * FROM urls WHERE short_id = $1", [customAlias]);

  if (existing.rows.length > 0) return res.status(400).json({ error: "Alias already exists" });

  // Insert the new shortened URL with the custom alias
  await pool.query(
    "INSERT INTO urls (short_id, original_url) VALUES ($1, $2)",
    [customAlias, originalUrl]
  );

  res.json({ shortUrl: `${req.protocol}://${req.get("host")}/${customAlias}` });
});

// Redirect shortened URL directly using the alias
app.get("/:id", async (req, res) => {
  const { id } = req.params;
  const result = await pool.query("SELECT * FROM urls WHERE short_id = $1", [id]);

  if (result.rows.length === 0) return res.status(404).sendFile(__dirname + "/public/404.html");

  const urlEntry = result.rows[0];

  // Increment the click count
  await pool.query("UPDATE urls SET clicks = clicks + 1 WHERE short_id = $1", [id]);

  res.redirect(urlEntry.original_url);
});

app.get("/check/:id", async (req, res) => {
  const { id } = req.params;
  const result = await pool.query("SELECT * FROM urls WHERE short_id = $1", [id]);

  if (result.rows.length === 0) {
    return res.status(404).sendFile(__dirname + "/public/404.html");
  }

  const urlEntry = result.rows[0];
  const shortUrl = `${req.protocol}://${req.get("host")}/${id}`;
  const originalUrl = urlEntry.original_url;
  const clicks = urlEntry.clicks;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>Check URL -- URL Shortener</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
            .hero-bg {
                background: linear-gradient(120deg, #6e8894, #544e61);
                color: #fff;
            }
            .info-box {
                background: #fff;
                padding: 2rem;
                border-radius: 0.5rem;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .label {
                font-weight: bold;
                color: #544e61;
            }
            .btn-back {
                background-color: #85baa1;
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 0.375rem;
                text-decoration: none;
                transition: background-color 0.3s ease;
            }
            .btn-back:hover {
                background-color: #6e8894;
            }
        </style>
    </head>
    <body class="bg-gray-100">

        <!-- Hero Section -->
        <section class="hero-bg py-12">
            <div class="container mx-auto text-center">
                <h1 class="text-4xl font-bold mb-2">Shortened URL Details</h1>
                <p class="text-lg">Here are the details of your link</p>
            </div>
        </section>

        <!-- Info Section -->
        <section class="py-10">
            <div class="container mx-auto max-w-2xl">
                <div class="info-box">
                    <p class="mb-4"><span class="label">Short URL:</span> <a href="${shortUrl}" class="text-blue-600 underline" target="_blank">${shortUrl}</a></p>
                    <p class="mb-4"><span class="label">Original URL:</span> <a href="${originalUrl}" class="text-blue-600 underline" target="_blank">${originalUrl}</a></p>
                    <p class="mb-4"><span class="label">Clicks:</span> ${clicks}</p>
                    <a href="/" class="btn-back inline-block mt-4">Go Back Home</a>
                </div>
            </div>
        </section>
        
    </body>
    </html>
  `);
});


app.use((req, res) => {
  res.status(404).sendFile(__dirname + "/public/404.html");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
