#!/usr/bin/env python3
import cgi
import json
import requests
import base64
import sys
from datetime import datetime

# HEADER WAJIB CGI
print("Content-Type: application/json\n")

# KONFIGURASI
TOKEN = "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"
REPO = "onkbaonk/Wap"
FILE_PATH = "blog_data.json"

def get_github_data():
    url = f"https://api.github.com/repos/{REPO}/contents/{FILE_PATH}"
    headers = {"Authorization": f"token {TOKEN}"}
    res = requests.get(url, headers=headers)
    if res.status_code == 200:
        data = res.json()
        content = json.loads(base64.b64decode(data['content']).decode())
        return content, data['sha']
    return [], None

def save_github_data(content, sha, message):
    url = f"https://api.github.com/repos/{REPO}/contents/{FILE_PATH}"
    headers = {"Authorization": f"token {TOKEN}"}
    encoded = base64.b64encode(json.dumps(content, indent=4).encode()).decode()
    payload = {"message": message, "content": encoded, "sha": sha}
    res = requests.put(url, headers=headers, json=payload)
    return res.status_code

# LOGIKA REQUEST
fs = cgi.FieldStorage()
method = sys.stdin.read() # Baca data POST jika ada

try:
    if not method: # Jika GET (Ambil Data)
        content, _ = get_github_data()
        print(json.dumps(content))
    else: # Jika POST (Buat/Hapus/Like)
        post_data = json.loads(method)
        content, sha = get_github_data()
        
        action = post_data.get('action')
        
        if action == 'create':
            new_post = {
                "id": int(datetime.now().timestamp()),
                "title": post_data['title'],
                "content": post_data['content'],
                "category": post_data.get('category', 'Umum'),
                "author": post_data['author'],
                "date": datetime.now().strftime("%Y-%m-%d"),
                "reactions": {},
                "comments": []
            }
            content.append(new_post)
            save_github_data(content, sha, f"New post by {post_data['author']}")
            print(json.dumps({"status": "success"}))

except Exception as e:
    print(json.dumps({"status": "error", "message": str(e)}))
