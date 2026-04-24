#!/usr/bin/env python3
import cgi
import json
import requests
import base64
import sys
from datetime import datetime

print("Content-Type: application/json\n")

TOKEN = "GITHUB_TOKEN_ANDA"
REPO = "USERNAME_GITHUB_ANDA/NAMA_REPO_ANDA"
FILE_PATH = "chat_room.json"

def sync_chat():
    url = f"https://api.github.com/repos/{REPO}/contents/{FILE_PATH}"
    headers = {"Authorization": f"token {TOKEN}"}
    res = requests.get(url, headers=headers)
    sha = None
    messages = []
    if res.status_code == 200:
        data = res.json()
        sha = data['sha']
        messages = json.loads(base64.b64decode(data['content']).decode())
    return messages, sha

method_data = sys.stdin.read()

if not method_data: # GET Chat
    messages, _ = sync_chat()
    print(json.dumps(messages))
else: # POST Chat
    data = json.loads(method_data)
    messages, sha = sync_chat()
    new_msg = {
        "user": data['user'],
        "text": data['text'],
        "time": datetime.now().strftime("%H:%M")
    }
    messages.append(new_msg)
    messages = messages[-50:] # Limit 50
    
    encoded = base64.b64encode(json.dumps(messages).encode()).decode()
    url = f"https://api.github.com/repos/{REPO}/contents/{FILE_PATH}"
    requests.put(url, headers={"Authorization": f"token {TOKEN}"}, 
                 json={"message": "Chat update", "content": encoded, "sha": sha})
    print(json.dumps({"status": "success"}))
