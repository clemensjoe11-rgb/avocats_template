import express from "express";
import morgan from "morgan";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

let db, bookings;

async function connectDB() {
  if (db) return db;
  if (!MONGODB_URI) throw new Error("MONGODB_URI missing");
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  db = client.db("termin");
  bookings = db.collection("bookings");
  await bookings.createIndex({ startISO: 1 }, { unique: true });
  return db;
}

app.use(morgan("tiny"));
app.use(express.json());
app.use(express.static("public"));

app.get("/api/slots", async (req, res) => {
  try {
    await connectDB();
    const items = await bookings.find({}, { projection: { _id: 0 } }).sort({ startISO: 1 }).toArray();
    res.json({ ok: true, data: items });
  } catch (e) {
    res.status(503).json({ ok: false, error: "DB nicht erreichbar" });
  }
});

app.post("/api/book", async (req, res) => {
  const p = req.body || {};
  if (!p.startISO || !p.endISO || !p.firstName || !p.lastName || !p.email) {
    return res.status(400).json({ ok: false, error: "Eingaben unvollständig" });
  }
  try {
    await connectDB();
    await bookings.insertOne({
      startISO: p.startISO,
      endISO: p.endISO,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      gender: p.gender || "",
      phone: p.phone || "",
      countryCode: p.countryCode || "",
      birthDate: p.birthDate || "",
      taken: true,
      createdAt: new Date().toISOString()
    });
    res.json({ ok: true });
  } catch (e) {
    if (String(e?.code) == "11000") {
      return res.status(409).json({ ok: false, error: "Slot bereits vergeben" });
    }
    res.status(503).json({ ok: false, error: "Technische Störung" });
  }
});

app.get("/termin", (req, res) => res.sendFile(process.cwd() + "/public/termin/index.html"));

app.listen(PORT, () => console.log(`Server auf http://localhost:${PORT}`));
