import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Backend features
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "DailyNest backend is running." });
  });

  // Example backend data sync route
  let dummyUsersCount = 1045;
  app.get("/api/stats", (req, res) => {
    res.json({ users: dummyUsersCount, activeMinds: Math.floor(dummyUsersCount * 0.4) });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html for undefined routes in production (SPA routing)
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
