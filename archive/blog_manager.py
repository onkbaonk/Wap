#!/usr/bin/env python3
import requests
import base64
import json
from datetime import datetime

# KONFIGURASI
TOKEN = "GITHUB TOKEN"
REPO = "onkbaonk/Wap"
FILE_PATH = "blog_index.json"


def post_article(title, content, author):
    url = f"https://api.github.com/repos/{REPO}/contents/{FILE_PATH}"
    headers = {"Authorization": f"token {TOKEN}"}

    # 1. Ambil data lama (atau buat list baru jika file belum ada)
    response = requests.get(url, headers=headers)
    sha = ""
    blog_posts = []
    
    if response.status_code == 200:
        res_json = response.json()
        sha = res_json['sha']
        content_raw = base64.b64decode(res_json['content']).decode()
        blog_posts = json.loads(content_raw)

    # 2. Buat objek artikel baru
    new_post = {
        "id": len(blog_posts) + 1,
        "title": title,
        "content": content,
        "author": author,
        "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "comments": []
    }

    blog_posts.append(new_post)

    # 3. Kirim ke GitHub
    content_encoded = base64.b64encode(json.dumps(blog_posts, indent=4).encode()).decode()
    payload = {
        "message": f"Post artikel baru: {title}",
        "content": content_encoded,
    }
    if sha: payload["sha"] = sha
    
    res = requests.put(url, headers=headers, json=payload)
    if res.status_code in [200, 201]:
        print(f"✅ Artikel '{title}' berhasil tayang!")
    else:
        print(f"❌ Gagal: {res.status_code}")

# --- TEST POSTING ---
print("--- TULIS ARTIKEL BLOG ---")
judul = input("Judul Artikel: ")
isi = input("Isi Konten: ")
penulis = input("Nama Penulis (Gunakan username yg terdaftar): ")

post_article(judul, isi, penulis)
