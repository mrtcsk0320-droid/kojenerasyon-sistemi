# Kojenerasyon Takip Sistemi Backend API

Node.js tabanlı, Google Sheets entegreli RESTful API backend altyapısı.

## 🚀 Kurulum

### Gereksinimler
- Node.js 16.0+
- npm veya yarn
- Google Cloud Platform hesabı
- Google Sheets erişimi

### Adım 1: Kurulum
```bash
cd backend
npm install
```

### Adım 2: Ortam Değişkenleri
```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

### Adım 3: Google Sheets Ayarları
1. Google Cloud Console'da yeni proje oluşturun
2. Google Sheets API'yi etkinleştirin
3. Service Account oluşturun
4. JSON key indirin ve `.env` dosyasına ekleyin
5. Google Sheets oluşturun ve Service Account'a paylaşım verin

### Adım 4: Başlatma
```bash
# Geliştirme modu
npm run dev

# Üretim modu
npm start
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Giriş yap
- `POST /api/auth/register` - Kayıt ol
- `GET /api/auth/verify` - Token doğrula

### Production Data
- `GET /api/production` - Üretim verilerini getir
- `POST /api/production` - Yeni üretim verisi ekle
- `GET /api/production/stats` - İstatistikleri getir

### Users
- `GET /api/users` - Tüm kullanıcıları getir (Admin only)
- `GET /api/users/profile` - Kullanıcı profili

## 🔐 Güvenlik

### Rol Sistemi
- **Admin**: Tüm yetkiler (read, write, delete)
- **Operator**: Okuma ve yazma yetkisi (read, write)
- **Viewer**: Sadece okuma yetkisi (read)

### Rate Limiting
- Genel: 100 istek / 15 dakika
- Auth: 5 istek / 15 dakika
- Veri işlemleri: 30 istek / 1 dakika

### Güvenlik Özellikleri
- JWT token authentication
- Bcrypt password hashing
- CORS protection
- Helmet security headers
- Input validation
- Request logging

## 📊 Google Sheets Yapısı

### Production Sheet
| Tarih | Vardiya | Uretim_MWh | Verimlilik_Yuzde | Durum |
|-------|---------|------------|------------------|-------|
| 2024-01-01 | Sabah | 250.5 | 85.2 | active |

### Users Sheet
| ID | Ad | Email | Sifre_Hash | Rol | Aktif |
|----|----|-------|------------|------|-------|
| 1 | Admin User | admin@kojenerasyon.com | $2b$12$... | Admin | true |

## 🔄 Veri Akışı

1. **Frontend** → API Request
2. **Backend** → Authentication Check
3. **Backend** → Role/Permission Validation
4. **Backend** → Google Sheets API
5. **Google Sheets** → Data Processing
6. **Backend** → Response to Frontend

## 🛠️ Geliştirme

### Proje Yapısı
```
backend/
├── config/          # Konfigürasyon
├── middleware/      # Express middleware
├── routes/          # API route'ları
├── services/        # İş mantığı servisleri
├── server.js        # Ana server dosyası
├── package.json     # Bağımlılıklar
└── .env.example     # Ortam değişkenleri şablonu
```

### Test Kullanıcıları
- **Admin**: admin@kojenerasyon.com / admin123
- **Operator**: operator@kojenerasyon.com / operator123
- **Viewer**: viewer@kojenerasyon.com / viewer123

## 📝 API Kullanımı

### Login Örneği
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@kojenerasyon.com',
    password: 'admin123'
  })
});

const data = await response.json();
// data.token kullanarak diğer endpoint'lere erişim
```

### Veri Ekleme Örneği
```javascript
const response = await fetch('/api/production', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    tarih: '2024-01-01',
    vardiya: 'Sabah',
    uretimMWh: 250.5,
    verimlilikYuzde: 85.2,
    durum: 'active'
  })
});
```

## 🔧 Hata Yönetimi

### HTTP Status Kodları
- `200` - Başarılı
- `201` - Oluşturuldu
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

### Response Format
```json
{
  "success": true,
  "data": {...},
  "message": "İşlem başarılı"
}
```

```json
{
  "success": false,
  "message": "Hata mesajı",
  "errors": [...]
}
```

## 🚀 Deployment

### Environment Variables
Production ortamında以下 değişkenleri ayarlayın:
- `NODE_ENV=production`
- `JWT_SECRET` - Güçlü bir secret key
- `GOOGLE_SPREADSHEET_ID` - Production spreadsheet ID
- `GOOGLE_SERVICE_ACCOUNT_*` - Production service account

### Öneriler
- PM2 veya类似 process manager kullanın
- HTTPS zorunlu yapın
- Loglama ve monitoring ekleyin
- Regular backup planı oluşturun

## 📄 Lisans

MIT License
