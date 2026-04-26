// 1. Fungsi penentu nama file - SAMA UNTUK SEMUA FUNGSI
function getChatFileName() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `chats/chat_${year}_${month}.json`;
}

async function refreshChat() {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;
    
    const path = getChatFileName();
    const userRole = localStorage.getItem("user_role"); // Ambil role dari storage

    try {
        const chats = await getGithubFile(path);
        chatBox.innerHTML = chats.content.map((c, index) => {
            // Logika Izin Tampilan: Milik sendiri ATAU Admin ATAU Moderator
            const canDelete = (c.user === CURRENT_USER || userRole === 'admin' || userRole === 'moderator');
            const cleanChat = sanitizeHTML(c.text);

            return `
            <div class="flex flex-col ${c.user === CURRENT_USER ? 'items-end' : 'items-start'} mb-2 group">
                <span class="text-[9px] mb-1 opacity-40 px-2">@${c.user}</span>
                <div class="relative flex items-center gap-2">
                    ${canDelete ? `<button onclick="deleteChatMessage(${index})" class="opacity-0 group-hover:opacity-100 text-[10px] text-red-400 transition-opacity">🗑️</button>` : ''}
                    <div class="${c.user === CURRENT_USER ? 'bg-blue-600' : 'bg-slate-800'} p-2 px-3 rounded-2xl text-sm max-w-[200px]">
                        ${cleanChat}
                    </div>
                </div>
            </div>`;
        }).join('');
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (e) {
        chatBox.innerHTML = '<p class="text-center text-xs opacity-50">Mulai percakapan baru...</p>';
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
    const userRole = localStorage.getItem("user_role");
    const path = getChatFileName();

    try {
        const file = await getGithubFile(path);
        const targetMsg = file.content[index];

        // Validasi Izin di Fungsi: Hanya pemilik, admin, atau moderator
        if (targetMsg.user !== CURRENT_USER && userRole !== 'admin' && userRole !== 'moderator') {
            return alert("Anda tidak memiliki izin menghapus pesan ini!");
        }

        if (!confirm("Hapus pesan ini?")) return;

        file.content.splice(index, 1);
        await updateGithubFile(path, file.content, file.sha, `Delete chat by ${CURRENT_USER} (${userRole})`);
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