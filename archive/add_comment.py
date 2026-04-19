import requests
import base64
import json
from datetime import datetime

# --- KONFIGURASI ---
TOKEN = "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"
REPO = "onkbaonk/Wap"
FILE_PATH = "blog_data.json"

def add_comment(post_id, user, text):
    url = f"https://api.github.com/repos/{REPO}/contents/{FILE_PATH}"
    headers = {"Authorization": f"token {TOKEN}"}

    # 1. Ambil data blog
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print("Gagal mengambil data blog!")
        return

    res_json = response.json()
    sha = res_json['sha']
    blog_posts = json.loads(base64.b64decode(res_json['content']).decode())

    # 2. Cari artikel berdasarkan ID
    found = False
    for post in blog_posts:
        if post['id'] == post_id:
            # Tambahkan komentar baru
            comment_data = {
                "user": user,
                "comment": text,
                "date": datetime.now().strftime("%Y-%m-%d %H:%M")
            }
            post['comments'].append(comment_data)
            found = True
            break
    
    if not found:
        print(f"❌ Artikel dengan ID {post_id} tidak ditemukan!")
        return

    # 3. Kirim balik ke GitHub
    content_encoded = base64.b64encode(json.dumps(blog_posts, indent=4).encode()).decode()
    payload = {
        "message": f"Komentar baru dari {user} di post ID {post_id}",
        "content": content_encoded,
        "sha": sha
    }
    
    res = requests.put(url, headers=headers, json=payload)
    if res.status_code == 200:
        print(f"✅ Komentar berhasil ditambahkan ke postingan ID {post_id}!")
    else:
        print(f"❌ Gagal update: {res.status_code}")

# --- INPUT KOMENTAR ---
print("--- BERI KOMENTAR ---")
p_id = int(input("Masukkan ID Artikel: "))
u_name = input("Username kamu: ")
msg = input("Isi Komentar: ")

add_comment(p_id, u_name, msg)
