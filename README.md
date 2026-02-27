# 🍜 กินอะไรดีวะ? — Thai Food Randomizer

Thai food menu randomizer with SQLite database tracking spins & saves.

## Stack
- **Frontend**: HTML/CSS/JS served via Nginx
- **Backend**: Node.js + Express + SQLite (better-sqlite3)
- **Infra**: Docker Compose

---

## 🚀 Deploy on Proxmox / Any Docker Host

### 1. Copy files to your server
```bash
scp -r thai-menu/ user@YOUR_PROXMOX_IP:/opt/thai-menu
```

### 2. SSH into server & launch
```bash
cd /opt/thai-menu
docker compose up -d --build
```

### 3. Open in browser
```
http://YOUR_PROXMOX_IP:8888
```

---

## 📊 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/spin` | Record a spin event |
| POST | `/api/save` | Save item to daily log |
| GET | `/api/log` | Get full daily log |
| DELETE | `/api/log/:id` | Remove a log entry |
| GET | `/api/stats` | Get stats, leaderboard, charts |

---

## 💾 Data Persistence
SQLite database is stored in a Docker named volume `thaifood_data`.
Data survives container restarts.

To backup:
```bash
docker run --rm -v thaifood_data:/data -v $(pwd):/backup alpine \
  cp /data/thaifood.db /backup/thaifood_backup.db
```

## 🔄 Update
```bash
docker compose down
docker compose up -d --build
```

## 🗑️ Reset database
```bash
docker compose down -v   # ⚠️ deletes all data
docker compose up -d --build
```

## Change port
Edit `docker-compose.yml` → ports: `"YOUR_PORT:80"`
