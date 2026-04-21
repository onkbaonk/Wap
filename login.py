import requests
import json

# --- KONFIGURASI (Sama seperti sebelumnya) ---
TOKEN = "token"
REPO = "onkbaonk/Wap"
FILE_PATH = "users.json"

def get_user_data():
    url = f"https://api.github.com/repos/{REPO}/contents/{FILE_PATH}"
    headers = {"Authorization": f"token {TOKEN}"}
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        # Dekode konten dari base64 yang dikirim GitHub
        import base64
        content = base64.b64decode(response.json()['content']).decode()
        return json.loads(content)
    else:
        print("Gagal mengambil data!")
        return None

# --- PROSES LOGIN SEDERHANA ---
users = get_user_data()

if users:
    input_user = input("Masukkan Username: ")
    
    if input_user in users:
        print(f"✅ Selamat datang, {input_user}!")
        print(f"Role: {users[input_user]['role']}")
        print(f"Bio: {users[input_user]['bio']}")
    else:
        print("❌ User tidak ditemukan!")
