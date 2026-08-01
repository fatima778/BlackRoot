import express, { Express } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import channelRoutes from "./routes/channelRoutes";
import entryRoutes from "./routes/entryRoutes";
import adminRoutes from "./routes/adminRoutes";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "200kb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => res.status(200).json({ status: "online" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/channels", channelRoutes);
  app.use("/api/entries", entryRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
