# PHP Backend Migration - Setup Guide

## Files Created

### Core Configuration & Setup
- **config.php** - Database, email, and app settings
- **setup.php** - Database initialization script
- **composer.json** - PHP dependencies (PHPMailer)
- **.htaccess** - URL rewriting for clean API routes

### Database
- **database.sql** - Complete MySQL schema with 7 tables:
  - products
  - users
  - orders
  - order_items
  - past_questions
  - sessions
  - (optimized indexes and foreign keys)

### API Endpoints
- **api.php** - Main router for all API requests
- **past-questions-api.php** - File serving endpoints
  - `GET /api/check-file/:courseCode` - Check if file exists
  - `GET /api/download/:courseCode` - Download PDF file
- **products-api.php** - Product management
  - `GET /api/products` - List all products
  - `GET /api/products/:id` - Get single product
- **orders-api.php** - Order processing with email
  - `POST /api/orders` - Create new order
  - `GET /api/orders` - List orders (admin)
  - `GET /api/orders/:id` - Get order details

## Quick Start

### 1. Install Dependencies
```bash
composer install
```

### 2. Configure Database (Optional)
Edit `config.php` if using non-standard credentials:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'govco_hub');
```

### 3. Run Setup Script
```bash
php setup.php
```
This will:
- Create the `govco_hub` database
- Create all required tables
- Insert sample products

### 4. Set Email Credentials (for order notifications)
```bash
export GMAIL_EMAIL="your-email@gmail.com"
export GMAIL_PASSWORD="your-app-password"
```

### 5. Test Locally
```bash
php -S localhost:8000
```

Then test endpoints:
```bash
# Check if a past question exists
curl "http://localhost:8000/api/check-file/CS101?level=100&semester=1"

# Get all products
curl "http://localhost:8000/api/products"

# Create an order (JSON)
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "0547482391",
    "house": "Hall A",
    "room": "205",
    "items": [
      {"productId": "...", "qty": 2}
    ]
  }'
```

## Database Schema

### products
- id (UUID, PK)
- name, description, price
- quantity_available
- Created/updated timestamps

### orders
- id, customer_name, email, phone
- house, room, notes
- total, status (pending/confirmed/delivered/cancelled)
- Timestamps

### order_items
- Links orders to products
- quantity, unit_price

## Migration Path

### Current State: Node.js + Firebase
- `/server/server.js` - File serving
- `/functions/index.js` - Order processing
- Firestore for data

### New State: PHP + MySQL
- `/api.php` - All endpoints
- `/config.php` - Config
- `govco_hub` database - All data

## Frontend Updates Needed

Replace Firebase SDK calls in your JS files with PHP API calls. Example:

**Before (Firebase):**
```javascript
const result = await functions.httpsCallable('placeOrder')({...});
```

**After (PHP API):**
```javascript
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({...})
});
```

## Deployment to Infinityfree

1. Create account at https://infinityfree.net
2. Upload files via FTP (all files in root except `/server`, `/functions`, `/Pastquestions`)
3. Create MySQL database in cPanel
4. Update config.php with your DB credentials
5. Run setup.php via browser: `https://yourdomain.infinityfree.app/setup.php`
6. Update .env with Gmail credentials
7. Test API endpoints

## Environment Variables

On Infinityfree, set these in your hosting control panel:
- GMAIL_EMAIL
- GMAIL_PASSWORD
- APP_URL

## Security Notes

✓ SQL injection prevention (prepared statements)
✓ File path traversal prevention (path validation)
✓ CORS headers configured
✓ Email credentials not in code (use .env)
✓ Password hashing ready (config includes bcrypt)

## Troubleshooting

**Database connection fails:**
- Check config.php credentials
- Ensure MySQL server is running
- Try running setup.php

**Emails not sending:**
- Verify GMAIL_EMAIL and GMAIL_PASSWORD are set
- Gmail requires app-specific passwords (not your main password)
- Check error logs in config.php

**File downloads not working:**
- Ensure Pastquestions directory exists
- Check file paths match: `level {N}/semester {N}/{category}/` structure
- Verify file permissions (readable by web server)
