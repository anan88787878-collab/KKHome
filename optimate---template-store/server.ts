import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("orders.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    items TEXT,
    total_amount INTEGER,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Routes
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
      const result = stmt.run(name, email, password, 'user');
      res.status(201).json({ success: true, userId: result.lastInsertRowid });
    } catch (error) {
      res.status(400).json({ error: "Email đã tồn tại" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json({ success: true, user: userWithoutPassword });
    } else {
      res.status(401).json({ error: "Email hoặc mật khẩu không đúng" });
    }
  });

  // API Routes
  app.post("/api/orders", (req, res) => {
    const { name, email, phone, items, total } = req.body;
    
    try {
      const stmt = db.prepare(`
        INSERT INTO orders (customer_name, customer_email, customer_phone, items, total_amount)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(name, email, phone, JSON.stringify(items), total);
      
      // NOTE: To connect to Google Sheets, you would typically use the Google Sheets API here.
      // Or send a request to a Google Apps Script Web App URL.
      // Example:
      // if (process.env.GOOGLE_SHEET_WEBHOOK_URL) {
      //   fetch(process.env.GOOGLE_SHEET_WEBHOOK_URL, { method: 'POST', body: JSON.stringify(req.body) });
      // }

      res.status(201).json({ success: true, orderId: result.lastInsertRowid });
    } catch (error) {
      console.error("Order error:", error);
      res.status(500).json({ error: "Failed to place order" });
    }
  });

  app.get("/api/orders", (req, res) => {
    const orders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
    res.json(orders);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      db.close();
      console.log('Database connection closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      db.close();
      console.log('Database connection closed');
      process.exit(0);
    });
  });
}

startServer();
