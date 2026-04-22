function getCurrentChatPath() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Hasilnya 01, 02, dst.
    return `chats/chat_${year}_${month}.json`;
}

async function refreshChat() {
    const chatBox = document.getElementById('chat-box');
    const filePath = getCurrentChatPath();

    try {
        const chats = await getGithubFile(filePath);
        chatBox.innerHTML = chats.content.map((c, index) => {
            const isMe = c.user === CURRENT_USER || CURRENT_USER === 'admin';
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
    } catch (e) { 
        // Jika file bulan ini belum ada (misal baru ganti bulan), tampilkan pesan kosong
        chatBox.innerHTML = "<p class='text-center opacity-30 text-[10px] py-10'>Belum ada percakapan di bulan ini.</p>";
    }
}

// FUNGSI KIRIM CHAT
async function sendChat() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    const filePath = getCurrentChatPath();
    
    if (!text || CURRENT_USER === "guest") return;

    try {
        let fileData;
        try {
            // Coba ambil file bulan ini
            fileData = await getGithubFile(filePath);
        } catch (e) {
            // Jika error (file belum ada), buat struktur file baru
            fileData = { content: [], sha: null };
        }

        const newMessage = {
            user: CURRENT_USER,
            text: text,
            date: new Date().toISOString()
        };

        fileData.content.push(newMessage);
        const updatedContent = fileData.content.slice(-50); // Tetap batasi 50 pesan terakhir

        await updateGithubFile(filePath, updatedContent, fileData.sha, `Chat update ${filePath}`);

        input.value = "";
        await refreshChat();
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (e) {
        console.error(e);
        alert("Gagal kirim chat!");
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