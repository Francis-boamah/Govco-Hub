# 🚀 Govco Hub PHP Migration - Quick Reference

## Files Created

| File | Purpose |
|------|---------|
| **config.php** | Database & email config |
| **api.php** | Main API router |
| **database.sql** | MySQL schema |
| **.htaccess** | URL rewriting |
| **setup.php** | Database setup script |
| **composer.json** | Dependencies |
| **past-questions-api.php** | File serving |
| **products-api.php** | Product endpoints |
| **orders-api.php** | Order processing + email |

## Quick Commands

```bash
# 1. Install dependencies
composer install

# 2. Create database (run once)
php setup.php

# 3. Start local server
php -S localhost:8000

# 4. Test API
curl http://localhost:8000/api/health
curl http://localhost:8000/api/products
```

## API Endpoints

```
GET  /api/health                           # Health check
GET  /api/check-file/:courseCode          # Check if file exists
GET  /api/download/:courseCode            # Download PDF
GET  /api/products                        # List products
GET  /api/products/:id                    # Get single product
POST /api/orders                          # Create order
GET  /api/orders                          # List orders (admin)
GET  /api/orders/:id                      # Get order details
```

## Environment Variables

```
GMAIL_EMAIL = your-email@gmail.com
GMAIL_PASSWORD = your-app-password
APP_URL = https://yourdomain.com
```

## Deployment Checklist

- [ ] composer install
- [ ] php setup.php
- [ ] Upload files to Infinityfree
- [ ] Update config.php with DB credentials
- [ ] Set environment variables
- [ ] Test API endpoints
- [ ] Update frontend JS files (see MIGRATION_GUIDE.js)
- [ ] Remove Firebase SDK from HTML

## Documentation

- **PHP_SETUP.md** - Detailed setup guide
- **MIGRATION_GUIDE.js** - Convert Firebase → PHP API
- **COMPLETION_SUMMARY.md** - What's been completed
- **database.sql** - Database schema details

## Support

**Email not sending?**
- Use app-specific password (not main Gmail password)
- Check GMAIL_EMAIL and GMAIL_PASSWORD are set

**Database connection fails?**
- Verify config.php credentials
- Run: php setup.php

**Files not downloading?**
- Ensure Pastquestions directory exists
- Check file structure: level {N}/semester {N}/{category}/filename.PDF

---

## Architecture

```
Frontend (HTML/CSS/JS)
        ↓
    api.php (router)
        ↓
   ┌────┴────┬────────┬──────────┐
   ↓         ↓        ↓          ↓
Past-Q    Products Orders      Health
   ↓
 MySQL Database
```

**Replaces:**
- Node.js Express server → PHP api.php
- Firebase Cloud Functions → PHP orders-api.php
- Firestore → MySQL

---

See **PHP_SETUP.md** for complete instructions!
