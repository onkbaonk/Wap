// 1. Fungsi penentu nama file - SAMA UNTUK SEMUA FUNGSI
function getChatFileName() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    // Pastikan folder 'chats/' sudah ada di repositori GitHub Anda
    return `chats/chat_${year}_${month}.json`;
}

// 2. Fungsi Refresh
async function refreshChat() {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;
    
    const path = getChatFileName();

    try {
        const chats = await getGithubFile(path);
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
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (e) { 
        chatBox.innerHTML = "<p class='text-center opacity-30 text-[10px] py-10'>Belum ada percakapan bulan ini.</p>";
    }
}

// 3. Fungsi Kirim
async function sendChat() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const text = input.value.trim();
    const path = getChatFileName();
    
    if (!text || CURRENT_USER === "guest") return;

    const originalText = text;
    input.value = ""; 

    try {
        let fileData;
        try {
            fileData = await getGithubFile(path);
        } catch (e) {
            fileData = { content: [], sha: null };
        }

        const newMessage = {
            user: CURRENT_USER,
            text: originalText,
            date: new Date().toISOString()
        };

        fileData.content.push(newMessage);
        const updatedContent = fileData.content.slice(-50);

        await updateGithubFile(path, updatedContent, fileData.sha, `Chat update: ${path}`);
        await refreshChat();
    } catch (e) {
        console.error(e);
        input.value = originalText;
    }
}

// --- PERBAIKAN DI SINI ---
async function deleteChatMessage(index) {
    if (!confirm("Hapus pesan ini?")) return;
    const path = getChatFileName(); // Gunakan file dinamis

    try {
        const file = await getGithubFile(path);
        file.content.splice(index, 1);

        await updateGithubFile(path, file.content, file.sha, `Delete chat from ${path}`);
        await refreshChat();
    } catch (e) {
        console.error(e);
        alert("Gagal menghapus pesan.");
    }
}

async function clearAllChat() {
    if (!confirm("PERINGATAN: Hapus semua riwayat chat bulan ini?")) return;
    const path = getChatFileName(); // Gunakan file dinamis

    try {
        const file = await getGithubFile(path);
        await updateGithubFile(path, [], file.sha, `Clear chat history: ${path}`);
        alert("Riwayat chat bulan ini dikosongkan!");
        await refreshChat();
    } catch (e) {
        console.error(e);
        alert("Gagal mengosongkan chat.");
    }
}