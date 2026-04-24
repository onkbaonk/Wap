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
* **Server**: Python Built-in HTTP Server

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
## ⚙️ Instalasi & Persiapan (Termux)
Aplikasi ini bersifat **Zero-Dependencies** (tidak membutuhkan pip install requests). Cukup gunakan Python bawaan Termux sebagai web server.
 1. **Clone repositori:**
   ```bash
   git clone [https://github.com/onkbaonk/Wap.git](https://github.com/onkbaonk/Wap.git)
   cd Wap
   
   ```
 2. **Update package & Install Python/Git:**
   ```bash
   pkg update && pkg upgrade
   pkg install python git
   
   ```
 3. **Menjalankan Aplikasi:**
   ```bash
   python -m http.server 8080
   
   ```
   Akses melalui browser di: http://localhost:8080
## 🔑 Konfigurasi API
Pastikan kamu telah mengatur GITHUB_TOKEN di file assets/js/auth.js agar aplikasi memiliki izin untuk membaca dan menulis ke repositori GitHub ini.
### 💡 Catatan Pengembangan

* **Tanpa Backend:** Seluruh logika API ditangani oleh JavaScript fetch() di sisi klien.
* **CORS:** Selalu gunakan http.server. Membuka file .html secara langsung dapat menyebabkan fitur API terhambat oleh kebijakan keamanan browser. Dikembangkan dengan ❤️ di Termux.

---

### 📸 Screenshot Aplikasi

<p align="center">
  <img src="assets/img/File2.jpg" width="45%" />
  <img src="assets/img/File3.jpg" width="45%" />
</p>

<p align="center">
  <img src="assets/img/File4.jpg" width="45%" />
  <img src="assets/img/File.jpg" width="45%" />
</p>
