import requests
import base64
import json

# --- KONFIGURASI ---
TOKEN = "GITHUB_TOKEN_ANDA"
REPO = "USERNAME_GITHUB_ANDA/NAMA_REPO_ANDA"
FILE_PATH = "users.json"

def register_user(username, role, bio):
    url = f"https://api.github.com/repos/{REPO}/contents/{FILE_PATH}"
    headers = {"Authorization": f"token {TOKEN}"}

    # 1. Ambil data lama
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print("Gagal mengambil database lama!")
        return
    
    res_json = response.json()
    sha = res_json['sha']
    # Dekode isi database lama
    content = base64.b64decode(res_json['content']).decode()
    users = json.loads(content)

    # 2. Cek apakah user sudah ada
    if username in users:
        print(f"❌ User '{username}' sudah terdaftar!")
        return

    # 3. Tambah user baru ke variabel lokal
    users[username] = {"role": role, "bio": bio}

    # 4. Kirim kembali ke GitHub
    content_encoded = base64.b64encode(json.dumps(users, indent=4).encode()).decode()
    payload = {
        "message": f"Register user baru: {username}",
        "content": content_encoded,
        "sha": sha
    }
    
    put_res = requests.put(url, headers=headers, json=payload)
    if put_res.status_code == 200:
        print(f"✅ User '{username}' berhasil didaftarkan ke GitHub!")
    else:
        print(f"❌ Gagal update: {put_res.status_code}")

# --- INPUT DARI TERMUX ---
print("--- FORM REGISTER ---")
u = input("Username baru: ")
r = input("Role (member/admin): ")
b = input("Bio singkat: ")

register_user(u, r, b)

