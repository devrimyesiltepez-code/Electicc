# Elektrik Proje Takip Paneli

Bu uygulama tek kullanıcı ve yerel kullanım için tasarlanmış bir "Elektrik Proje Takip Paneli"dir. Frontend React + TypeScript + Tailwind, backend FastAPI, veritabanı SQLite kullanır.

## Özellikler

- Customer → Project → Task ilişkisi
- Proje alanları: name, code, status, due_date, priority, description
- Task alanları: title, status, notes, due_date
- Proje bazlı dosya linkleri ve revizyon notları
- Dashboard: Kanban board + arama + filtreleme
- Proje detayı: görev listesi + revizyon notları + dosya bağlantıları
- Seed data (ilk çalıştırmada otomatik)

## Kurulum ve Çalıştırma (Docker Compose)

> Windows üzerinde önerilen kurulum yöntemi budur.

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

### Şifre (Opsiyonel)

Varsayılan olarak örnek bir şifre tanımlıdır:
- Şifre: `panel123`

Şifreyi kapatmak için `docker-compose.yml` içindeki `APP_PASSWORD` ve `VITE_APP_PASSWORD` ortam değişkenlerini boş bırakabilir veya tamamen kaldırabilirsiniz.

## Lokal Çalıştırma (Docker olmadan)

### Backend

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

> Backend varsayılan olarak `http://localhost:8000`, frontend ise `http://localhost:5173` üzerinden çalışır.

## Notlar

- SQLite verisi `backend/data/app.db` içinde tutulur.
- Seed data yalnızca veritabanı boşsa eklenir.
