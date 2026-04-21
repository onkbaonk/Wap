import requests
import base64
import json

# --- KONFIGURASI ---
TOKEN = "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"
REPO = "onkbaonk/Wap"
FILE_PATH = "users.json"
BRANCH = "main"

def update_github_data(new_data, message="Update database"):
    url = f"https://api.github.com/repos/{REPO}/contents/{FILE_PATH}"
    headers = {"Authorization": f"token {TOKEN}"}

    # 1. Ambil data lama untuk mendapatkan 'sha' (identitas file unik di GitHub)
    response = requests.get(url, headers=headers)
    sha = ""
    if response.status_code == 200:
        sha = response.json()['sha']

    # 2. Encode data baru ke Base64
    content_json = json.dumps(new_data, indent=4)
    content_encoded = base64.b64encode(content_json.encode()).decode()

    # 3. Kirim data ke GitHub
    payload = {
        "message": message,
        "content": content_encoded,
        "branch": BRANCH
    }
    if sha:
        payload["sha"] = sha

    res = requests.put(url, headers=headers, json=payload)
    return res.status_code

# --- UJI COBA ---
data_user = {
    "admin": {"role": "admin", "bio": "Developer Termux"},
    "guest_user": {"role": "member", "bio": "Halo dunia"}
}

status = update_github_data(data_user)
if status in [200, 201]:
    print("✅ Data berhasil tersimpan di GitHub!")
else:
    print(f"❌ Gagal. Kode error: {status}")
