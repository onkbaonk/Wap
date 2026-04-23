# Onkbaonk Hub - Modular Web Dashboard

**Onkbaonk Hub** adalah platform dashboard web interaktif yang dibangun dengan pendekatan *serverless* menggunakan GitHub API sebagai database. Proyek ini mengutamakan performa tinggi melalui teknik **Data Sharding** dan antarmuka pengguna yang modern dengan **Tailwind CSS**.

## 🚀 Fitur Unggulan

* **Modular Architecture**: Komponen UI dipisah secara modular untuk kemudahan pemeliharaan.
* **Smart Search**: Fitur pencarian interaktif dengan animasi slide-out.
* **Advanced Sharding Database**:
    * **Chat Sharding**: Pesan dipecah berdasarkan bulan (`chats/chat_YYYY_MM.json`) untuk mencegah beban muat yang berat.
    * **Blog Sharding**: Memisahkan indeks daftar postingan dengan konten detail (`posts/post_ID.json`) untuk optimasi bandwidth.
* **Secure Content**: Dilengkapi dengan pembersihan HTML (*Sanitization*) untuk mencegah serangan XSS.
* **Real-time Vibe**: Feedback visual menggunakan *Skeleton Loader* dan status tombol saat proses asinkron berjalan.
* **Mobile Optimized**: Dikembangkan dan diuji sepenuhnya di lingkungan mobile menggunakan **Termux**.

## 🛠️ Tech Stack

* **Frontend**: HTML5, Tailwind CSS, JavaScript (Vanilla ES6+)
* **Backend/Database**: GitHub REST API & JSON Storage
* **Environment**: Termux (Android)
* **Icons & UI**: Emoji & Custom CSS Animations

## 📁 Struktur Folder

```text
├── assets/
│   ├── css/          # Custom styling & animations
│   └── js/           # Logika aplikasi (auth, blog, chat, main)
├── components/       # Modul HTML (blog, chat, stats, etc.)
├── chats/            # Database shard untuk percakapan (Auto-generated)
├── posts/            # Database shard untuk konten blog (Auto-generated)
├── blog_index.json   # Katalog ringan untuk daftar postingan
└── users.json        # Database pengguna

```
## ⚙️ Cara Instalasi (Local Development)
 1. Clone repositori ini:
   ```bash
   git clone [https://github.com/onkbaonk/Wap.git](https://github.com/onkbaonk/Wap.git)
   
   ```
 2. Jalankan server lokal (misalnya menggunakan Python di Termux):
   ```bash
   python -m http.server 8080
   
   ```
 3. Akses melalui browser di http://localhost:8080.
## 🔑 Konfigurasi API
Pastikan kamu telah mengatur GITHUB_TOKEN di file auth.js atau file konfigurasi terkait agar aplikasi memiliki izin untuk membaca dan menulis ke repositori ini.
Dikembangkan dengan ❤️ di **Termux**.

`![Dashboard](assets/img/screenshot.jpg)`
