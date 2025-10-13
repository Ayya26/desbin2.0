# Desbin - Ultrasonic Pest Control (PWA)

Cara install di HP (Android/Chrome, iOS/Safari):
- Buka `index.html` lewat hosting lokal/online (HTTPS disarankan untuk geolocation).
- Tunggu muncul prompt `Add to Home Screen` atau buka menu browser dan pilih `Install App` / `Add to Home Screen`.
- App akan terpasang sebagai aplikasi mandiri.

Build APK (Capacitor + Android Studio):
1) Install Node.js LTS. Buka terminal di folder proyek ini.
2) Jalankan:
```bash
npm i
npm run cap:init
npm run cap:add:android
npm run cap:copy
npm run cap:open:android
```
3) Android Studio akan terbuka. Pilih Build > Build Bundle(s)/APK(s) > Build APK(s).
4) File APK ada di `android/app/build/outputs/apk/debug/`.

Catatan Android:
- Pastikan permission INTERNET default aktif (Capacitor aktifkan). Jika perlu akses Wi‑Fi/AP khusus, tetap gunakan endpoint `localStorage desbin_api_base`.
- Untuk rilis: buat keystore dan signing config di Android Studio, lalu build release APK/AAB.

Pengaturan API ESP32:
- Secara default aplikasi mengirim perintah ke `http://192.168.4.1` (AP mode ESP32). Ubah basis URL dengan menyimpan `localStorage.setItem('desbin_api_base', 'http://ip-esp32:port')` di console.
- Endpoint yang dipanggil: `POST /api/command` body JSON, contoh:
```json
{ "action": "power", "value": "on", "pest": "mice", "timerMin": 30 }
```
Respons yang diharapkan: `{ ok: true }` (bebas, aplikasi tidak strict).

Contoh rute di ESP32 (sketsa):
- `POST /api/command` menerima JSON lalu jalankan logic (nyalakan/matikan, set frekuensi, timer, dll).

Catatan:
- Geolocation dan Open-Meteo butuh internet dan ijin lokasi.
- PWA cache aktif via `sw.js` untuk akses offline dasar.
# Ultrasonic Pest Control App

Aplikasi kontrol alat ultrasonik untuk mengusir hama melalui smartphone. Aplikasi ini dirancang khusus untuk penggunaan mobile dengan interface yang user-friendly.

## 🚀 Fitur Utama

### Halaman Pembuka (Welcome Page)
- **Desain Menarik**: Interface modern dengan gradient background dan animasi
- **Informasi Produk**: Menampilkan keunggulan teknologi ultrasonik
- **Navigasi Mudah**: Tombol untuk langsung masuk ke kontrol hama

### Halaman Kontrol Hama
- **Header Selamat Datang**: Salam dinamis dengan emoji dan tanggal lengkap
- **Lokasi Surabaya**: Menampilkan lokasi Surabaya dengan waktu WIB real-time
- **Widget Cuaca Canggih**: Informasi cuaca lengkap dengan kelembaban dan kecepatan angin
- **2 Jenis Hama**: Tikus dan Burung dengan fitur toggle (cancel selection)
- **Kontrol Frekuensi**: Pengaturan frekuensi ultrasonik tanpa volume control
- **Timer Otomatis**: Pengaturan waktu aktif dengan countdown visual dan auto-shutdown
- **Status Real-time**: Monitoring status alat dan waktu aktif

## 🎯 Jenis Hama yang Didukung

| Hama | Frekuensi | Deskripsi |
|------|-----------|-----------|
| Tikus | 20-30 kHz | Mengusir tikus dari area rumah dan kebun |
| Burung | 15-25 kHz | Mengusir burung dari atap dan area terbuka |

## 📱 Cara Penggunaan

1. **Buka Aplikasi**: Akses melalui browser smartphone
2. **Pilih Hama**: Tap pada jenis hama yang ingin diusir
3. **Aktifkan Alat**: Tekan tombol power untuk mengaktifkan
4. **Atur Volume**: Sesuaikan volume sesuai kebutuhan
5. **Set Timer**: Pilih durasi aktif atau biarkan terus menerus

## 🛠️ Teknologi yang Digunakan

- **HTML5**: Struktur aplikasi web
- **CSS3**: Styling responsive dan animasi
- **JavaScript**: Interaksi dan kontrol alat
- **Font Awesome**: Ikon untuk UI
- **Responsive Design**: Optimal di semua ukuran layar

## 📂 Struktur File

```
desbin/
├── index.html          # File utama aplikasi
├── styles.css          # Styling dan responsive design
├── script.js           # Logika aplikasi dan kontrol
└── README.md           # Dokumentasi
```

## 🎨 Fitur UI/UX Terbaru

- **Color Palette Modern**: Menggunakan skema warna gradient yang hidup (#00D4AA, #00B894, #00A085, #008B74, #007563)
- **Background Animasi**: Efek radial gradient dengan warna-warna cerah yang bergerak
- **Font Inter**: Typography modern dengan Inter font family
- **Toggle Selection**: Fitur cancel untuk membatalkan pilihan hama
- **Timer Countdown**: Visual countdown timer dengan auto-shutdown
- **Cuaca Lengkap**: Informasi kelembaban dan kecepatan angin
- **Waktu Real-time**: Update waktu WIB setiap menit
- **Salam Dinamis**: Emoji dan tanggal sesuai waktu saat ini
- **Animasi Canggih**: Hover effects, pulse animations, dan gradient shifts
- **Mobile-First Design**: Didesain khusus untuk smartphone
- **Touch-Friendly**: Tombol dan elemen yang mudah disentuh
- **Visual Feedback**: Animasi dan indikator status yang smooth
- **Intuitive Navigation**: Navigasi yang mudah dipahami
- **Modern Design**: Interface yang menarik dan profesional

## 🔧 Pengembangan Lebih Lanjut

Untuk integrasi dengan alat ultrasonik fisik, tambahkan:

1. **Bluetooth Communication**: Untuk koneksi nirkabel
2. **WiFi Integration**: Untuk kontrol jarak jauh
3. **Database**: Untuk menyimpan pengaturan pengguna
4. **Push Notifications**: Untuk notifikasi status alat

## 📱 Kompatibilitas

- **Browser**: Chrome, Firefox, Safari, Edge
- **Platform**: Android, iOS, Windows Mobile
- **Responsive**: Tablet dan desktop friendly

## 🚀 Cara Menjalankan

1. Buka file `index.html` di browser smartphone
2. Atau deploy ke web server untuk akses online
3. Tambahkan ke home screen untuk pengalaman app-like

## 📞 Dukungan

Aplikasi ini siap digunakan dan dapat dikustomisasi sesuai kebutuhan spesifik alat ultrasonik yang digunakan.

---

**Catatan**: Aplikasi ini adalah prototype untuk kontrol alat ultrasonik. Untuk implementasi nyata, diperlukan integrasi dengan hardware yang sesuai.
