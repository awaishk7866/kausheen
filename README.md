# Kausheen Admin — MERN Stack Setup Guide

## Folder Structure
```
kausheen-admin/
├── server/    ← Node.js + Express + MongoDB backend
└── client/    ← React + Vite + Tailwind frontend
```

---

## STEP 1 — MongoDB Atlas (Free Database)

1. Go to https://cloud.mongodb.com and create a free account
2. Create a new **free cluster** (M0)
3. Under **Database Access** → Add a user with username & password
4. Under **Network Access** → Add IP: `0.0.0.0/0` (allow all)
5. Click **Connect** → **Drivers** → copy the connection string
   It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`
6. Open `server/.env` and replace `MONGODB_URI` with your string, add `kausheen` at the end:
   `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/kausheen?retryWrites=true&w=majority`

---

## STEP 2 — Gmail App Password (for sending bills)

1. Go to your Google Account → Security → 2-Step Verification → turn ON
2. Then go to: https://myaccount.google.com/apppasswords
3. Select **Mail** → **Other** → name it "Kausheen" → Generate
4. Copy the 16-character password
5. In `server/.env`:
   - Set `EMAIL_USER` = your Gmail address
   - Set `EMAIL_PASS` = the 16-character app password (no spaces)

---

## STEP 3 — Install & Run (Development)

### Backend
```bash
cd kausheen-admin/server
npm install
npm run dev
# Server starts at http://localhost:5000
```

### Frontend (new terminal)
```bash
cd kausheen-admin/client
npm install
npm run dev
# App opens at http://localhost:5173
```

### Login credentials
- Username: `KaushClothing`
- Password: `Shahan@4884`

---

## STEP 4 — Deploy to Production (Free)

### Frontend → Vercel (Free)
1. Push the `client` folder to GitHub
2. Go to https://vercel.com → Import project
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Deploy → you get a free URL like `kausheen-admin.vercel.app`

### Backend → Render (Free)
1. Push the `server` folder to GitHub
2. Go to https://render.com → New Web Service
3. Connect your repo
4. Set:
   - Build command: `npm install`
   - Start command: `node index.js`
5. Add all environment variables from `.env` under **Environment**
6. Deploy → you get a URL like `kausheen-server.onrender.com`

### Connect Frontend to Backend on Vercel
In `client/vite.config.js`, the proxy works in dev only.
For production, create `client/.env.production`:
```
VITE_API_URL=https://your-render-url.onrender.com
```
Then in all axios calls, use: `axios.get(import.meta.env.VITE_API_URL + '/api/...')`
Or better — add a file `client/src/utils/api.js`:
```js
import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '' });
export default api;
```

---

## Features Summary

| Module     | Features |
|------------|----------|
| Login      | JWT auth, secure session, 24h token |
| Dashboard  | Revenue stats (today/month/year), bar chart, top items, low stock alerts |
| Inventory  | Add/Edit/Delete items, search, sort, low stock badges |
| POS        | Live item search, qty/GST/discount per item, payment mode, PDF bill, email to customer |
| Sales      | All transactions, date filter, search, drill-down view, Excel export |

---

## Low Stock Threshold
Currently set to **5 units** in `server/.env` → `LOW_STOCK_THRESHOLD=5`
Change this number to adjust when alerts trigger.

---

## Bill Format
Bills are branded as **Kausheen** with Park Street address.
To update brand info, edit `server/.env`:
- `BUSINESS_NAME`
- `BUSINESS_ADDRESS`
- `BUSINESS_PHONE`
- `BUSINESS_EMAIL`
