async function refreshChat() {
    try {
        const chats = await getGithubFile('chat_room.json');
        document.getElementById('chat-box').innerHTML = chats.content.map((c, index) => {
            const isMe = c.user === CURRENT_USER || CURRENT_USER === 'admin';
            // Bersihkan teks chat dari tag HTML
            const cleanChat = sanitizeHTML(c.text);

            return `
            <div class="flex flex-col ${c.user === CURRENT_USER ? 'items-end' : 'items-start'} mb-2 group">
                <span class="text-[9px] mb-1 opacity-40 px-2">@${c.user}</span>
                <div class="relative flex items-center gap-2">
                    ${isMe ? `<button onclick="deleteChatMessage(${index})" class="opacity-0 group-hover:opacity-100 text-[10px] text-red-400 transition-opacity">🗑️</button>` : ''}
                    <div class="${c.user === CURRENT_USER ? 'bg-blue-600' : 'bg-slate-800'} p-2 px-3 rounded-xl text-white text-[11px] max-w-[85%]">
                        ${cleanChat}
                    </div>
                </div>
            </div>`;
        }).join('');
    } catch (e) { console.error(e); }
}

// FUNGSI KIRIM CHAT
async function sendChat() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    // Validasi: Jangan kirim jika kosong atau jika user adalah tamu
    if (!text) return;
    if (CURRENT_USER === "guest") {
        alert("Silahkan login untuk ikut chatting!");
        return;
    }

    try {
        // 1. Ambil data chat terbaru dari GitHub
        const file = await getGithubFile('chat_room.json');
        
        // 2. Tambahkan pesan baru ke array
        file.content.push({ 
            user: CURRENT_USER, 
            text: text, 
            time: new Date().toLocaleTimeString() 
        });

        // 3. Batasi hanya 50 pesan terakhir agar file tidak terlalu berat
        const updatedContent = file.content.slice(-50);

        // 4. Update file di GitHub
        await updateGithubFile('chat_room.json', updatedContent, file.sha, "Chat update");

        // 5. Kosongkan input dan refresh tampilan chat
        input.value = "";
        await refreshChat();
        
        // Scroll otomatis ke bawah
        const box = document.getElementById('chat-box');
        box.scrollTop = box.scrollHeight;
    } catch (e) {
        console.error(e);
        alert("Gagal kirim chat! Cek koneksi atau token GitHub kamu.");
    }
}
async function deleteChatMessage(index) {
    if (!confirm("Hapus pesan ini?")) return;

    try {
        const file = await getGithubFile('chat_room.json');
        
        // Hapus elemen berdasarkan index
        file.content.splice(index, 1);

        await updateGithubFile('chat_room.json', file.content, file.sha, "Delete single chat message");
        await refreshChat();
    } catch (e) {
        alert("Gagal menghapus pesan.");
    }
}

async function clearAllChat() {
    if (!confirm("PERINGATAN: Hapus semua riwayat chat? Tindakan ini tidak bisa dibatalkan.")) return;

    try {
        const file = await getGithubFile('chat_room.json');
        const emptyContent = []; // Array kosong

        await updateGithubFile('chat_room.json', emptyContent, file.sha, "Clear all chat history");
        alert("Riwayat chat dikosongkan!");
        await refreshChat();
    } catch (e) {
        alert("Gagal mengosongkan chat.");
    }
}