# Kojenerasyon Takip Sistemi

Web tabanlı, mobil uyumlu, Google Sheets entegre tam kapsamlı kojenerasyon takip sistemi.

## Özellikler

### 🎨 Tasarım
- **Modern ve Kurumsal Arayüz**: Apple, Stripe, Vercel ve Linear tasarım dilinden ilham alan premium dashboard
- **Dark/Light Mode**: Otomatik ve manuel tema değiştirme
- **Responsive Design**: Mobil, tablet ve desktop uyumlu
- **Glassmorphism**: Modern cam efektleri ve yumuşak gölgeler

### 🔐 Güvenlik
- **Rol Bazlı Yetkilendirme**: Admin, Operator, Viewer rolleri
- **Hash Korumalı**: Güvenli şifre saklama
- **Oturum Yönetimi**: Güvenli giriş/çıkış sistemi

### 📊 Dashboard
- **Anlık İstatistikler**: Günlük üretim, anlık güç, verimlilik, çalışma süresi
- **Grafikler**: Üretim ve verimlilik analizleri
- **Veri Tabloları**: Detaylı üretim kayıtları
- **Dışa Aktarım**: CSV formatında veri indirme

### 🔗 Google Sheets Entegrasyonu
- **Otomatik Senkronizasyon**: Canlı veri çekme
- **Veri Yazma**: Sistemden Google Sheets'e veri gönderme
- **Tablo Oluşturma**: Sistem tarafından otomatik tablo yönetimi

## Kurulum

### Gereksinimler
- Modern web tarayıcısı (Chrome, Firefox, Safari, Edge)
- Google Cloud Platform hesabı (Google Sheets API için)

### Adım 1: Google Sheets API Ayarları
1. [Google Cloud Console](https://console.cloud.google.com/) gidin
2. Yeni bir proje oluşturun
3. Google Sheets API'yi etkinleştirin
4. API anahtarı oluşturun
5. OAuth 2.0 kimlik bilgileri oluşturun

### Adım 2: Yapılandırma
`script.js` dosyasında aşağıdaki alanları güncelleyin:

```javascript
const GOOGLE_SHEETS_CONFIG = {
    API_KEY: 'SIZIN_API_ANAHTARINIZ',
    CLIENT_ID: 'SIZIN_CLIENT_ID_NIZ',
    DISCOVERY_DOCS: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
    SCOPES: 'https://www.googleapis.com/auth/spreadsheets',
    SPREADSHEET_ID: 'SIZIN_SPREADSHEET_ID_NIZ'
};
```

### Adım 3: Google Sheets Hazırlama
1. Yeni bir Google Sheets oluşturun
2. "Production" adında bir sayfa oluşturun
3. Aşağıdaki sütunları ekleyin:
   - A: Tarih
   - B: Vardiya
   - C: Üretim (MWh)
   - D: Verimlilik (%)
   - E: Durum

## Kullanım

### Giriş Bilgileri
- **Admin**: admin@kojenerasyon.com / admin123
- **Operator**: operator@kojenerasyon.com / operator123
- **Viewer**: viewer@kojenerasyon.com / viewer123

### Tema Değiştirme
- Header'daki tema butonuna tıklayarak Dark/Light mod arasında geçiş yapın

### Mobil Kullanım
- Sol üstteki menü butonuna tıklayarak sidebar'ı aç/kapat
- Responsive tasarım sayesinde tüm ekran boyutlarında sorunsuz çalışır

## Teknolojiler

- **HTML5**: Modern ve anlamsal yapı
- **CSS3**: CSS Variables, Flexbox, Grid
- **JavaScript ES6+**: Modern JavaScript özellikleri
- **Google Sheets API**: Veri yönetimi
- **Responsive Design**: Mobil uyumluluk

## Tarayıcı Desteği

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Lisans

Bu proje MIT lisansı ile lisanslanmıştır.

## Destek

Sorular veya öneriler için lütfen iletişime geçin.
