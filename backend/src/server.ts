/// <reference path="./types/express.d.ts" />
import "dotenv/config";
import { createApp } from "./app";
import { connectDB } from "./config/db";

const PORT = Number(process.env.PORT ?? 4000);
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  // eslint-disable-next-line no-console
  console.error("MONGO_URI is not set. Copy .env.example to .env and configure it.");
  process.exit(1);
}

connectDB(MONGO_URI)
  .then(() => {
    const app = createApp();
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`[blackroot] uplink established on port ${PORT}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[blackroot] failed to establish database uplink", err);
    process.exit(1);
  });
