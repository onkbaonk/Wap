import requests
import base64
import os

# --- KONFIGURASI ---
TOKEN = "GITHUB_TOKEN_ANDA"
REPO = "USERNAME_GITHUB_ANDA/NAMA_REPO_ANDA"
FOLDER_DI_GITHUB = "assets"  # File akan disimpan di folder 'assets'

def upload_to_github(file_path):
    if not os.path.exists(file_path):
        print("❌ File tidak ditemukan di Termux!")
        return

    file_name = os.path.basename(file_path)
    url = f"https://api.github.com/repos/{REPO}/contents/{FOLDER_DI_GITHUB}/{file_name}"
    headers = {"Authorization": f"token {TOKEN}"}

    # 1. Baca file dan ubah ke Base64 (penting untuk file non-teks)
    with open(file_path, "rb") as file:
        encoded_content = base64.b64encode(file.read()).decode()

    # 2. Cek apakah file sudah ada (untuk mendapatkan SHA jika ingin update)
    response = requests.get(url, headers=headers)
    sha = ""
    if response.status_code == 200:
        sha = response.json()['sha']

    # 3. Payload untuk upload
    payload = {
        "message": f"Upload file: {file_name}",
        "content": encoded_content
    }
    if sha: payload["sha"] = sha

    res = requests.put(url, headers=headers, json=payload)
    
    if res.status_code in [200, 201]:
        download_url = res.json()['content']['download_url']
        print(f"✅ File '{file_name}' berhasil diunggah!")
        print(f"🔗 Link Download: {download_url}")
    else:
        print(f"❌ Gagal upload: {res.status_code}")

# --- INPUT UPLOAD ---
print("--- UPLOAD FILE KE GITHUB ---")
path_file = input("Masukkan path file di Termux (contoh: uploads/test.txt): ")
upload_to_github(path_file)
