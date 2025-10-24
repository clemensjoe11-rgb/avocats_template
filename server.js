import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";

const app = express();
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "public")));

const uri = process.env.MONGODB_URI || "";
const dbName = process.env.DB_NAME || "termin";
const colName = process.env.COLLECTION || "bookings";

let col = null;
let mem = []; // fallback

async function initDb() {
  if (!uri) {
    console.warn("No MONGODB_URI set. Using in-memory store.");
    return;
  }
  try {
    const client = new MongoClient(uri, { maxPoolSize: 10 });
    await client.connect();
    col = client.db(dbName).collection(colName);
    await col.createIndex({ startISO: 1 }, { unique: true, sparse: true });
    console.log("DB ready.");
  } catch (e) {
    console.error("DB init failed, using in-memory store:", e.message);
    col = null;
  }
}
initDb();

app.get("/api/slots", async (req, res) => {
  try {
    if (col) {
      const docs = await col.find({ taken: true }, { projection: { _id: 0, startISO: 1 } }).toArray();
      return res.json({ ok: true, data: docs });
    } else {
      return res.json({ ok: true, data: mem.filter(x => x.taken).map(x => ({ startISO: x.startISO })) });
    }
  } catch (e) {
    return res.status(503).json({ ok: false, error: "DB nicht erreichbar" });
  }
});

app.post("/api/book", async (req, res) => {
  const b = req.body || {};
  if (!b.firstName || !b.lastName || !b.email || !b.birthDate || !b.startISO) {
    return res.status(400).json({ ok: false, error: "Eingaben unvollständig" });
  }
  try {
    if (col) {
      const conflict = await col.findOne({ startISO: b.startISO, taken: true });
      if (conflict) return res.status(409).json({ ok: false, error: "Slot belegt" });
      await col.insertOne({ ...b, createdAt: new Date().toISOString(), taken: true });
      return res.json({ ok: true });
    } else {
      if (mem.some(x => x.startISO === b.startISO && x.taken)) {
        return res.status(409).json({ ok: false, error: "Slot belegt" });
      }
      mem.push({ ...b, createdAt: new Date().toISOString(), taken: true });
      return res.json({ ok: true });
    }
  } catch (e) {
    return res.status(503).json({ ok: false, error: "Technische Störung" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`listening on :${port}`));
