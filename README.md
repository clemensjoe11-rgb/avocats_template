# Kanzlei + Terminbuchung

- Statische Kanzlei-Seite unter `public/`
- Termin-UI unter `/termin`
- API: `/api/slots`, `/api/book`
- MongoDB: `MONGODB_URI`

## Lokal
npm i
cp .env.example .env
# Passwort einsetzen
npm run dev

## Render
- Build: `npm ci`
- Start: `node server.js`
- Env Var: `MONGODB_URI`
