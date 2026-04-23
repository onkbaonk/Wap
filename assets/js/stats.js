// Fungsi pembantu untuk mendapatkan nama file bulan ini
function getChatFileName() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `chats/chat_${year}_${month}.json`;
}


async function refreshStats() {
    try {
        const fileNameChat = getChatFileName();
        const posts = await getGithubFile('blog_index.json');
        const users = await getGithubFile('users.json');
        
        let chatCount = 0;
        try {
            const chats = await getGithubFile(fileNameChat);
            chatCount = chats.content.length;
        } catch (err) {
            // Jika file belum ada, biarkan tetap 0
            console.log("File chat bulan ini belum dibuat.");
        }

        document.getElementById('db-status').innerHTML = `
            <p>🟢 Status: Connected</p>
            <p>👥 Users: ${Object.keys(users.content).length}</p>
            <p>📝 Posts: ${posts.content.length}</p>
            <p>💬 Chats (${fileNameChat.replace('.json', '')}): ${chatCount}</p>
        `;
    } catch (e) { 
        console.error(e); 
    }
}

async function refreshProfile() {
    if (CURRENT_USER === "guest") {
        document.getElementById('section-profile').innerHTML = `
            <div class="glass p-10 text-center rounded-2xl">
                <p class="opacity-50 text-sm">Silahkan login untuk melihat profil.</p>
                <button onclick="openModal('authModal')" class="mt-4 bg-blue-600 px-6 py-2 rounded-xl text-xs font-bold">Login Sekarang</button>
            </div>`;
        return;
    }

    document.getElementById('user-display-name').innerText = `@${CURRENT_USER}`;
    document.getElementById('user-initial').innerText = CURRENT_USER.charAt(0).toUpperCase();

    try {
        const fileNameChat = getChatFileName();
        const [blogFile, chatFileResult] = await Promise.allSettled([
            getGithubFile('blog_index.json'),
            getGithubFile(fileNameChat)
        ]);

        const myPosts = blogFile.status === 'fulfilled' ? blogFile.value.content.filter(p => p.author === CURRENT_USER) : [];
        const myChatCount = chatFileResult.status === 'fulfilled' ? chatFileResult.value.content.filter(c => c.user === CURRENT_USER).length : 0;

        document.getElementById('user-post-count').innerText = myPosts.length;
        document.getElementById('user-chat-count').innerText = myChatCount;

        const container = document.getElementById('user-posts');
        if (myPosts.length === 0) {
            container.innerHTML = "<p class='text-center opacity-30 py-10 text-xs italic'>Anda belum pernah membuat postingan.</p>";
        } else {
            container.innerHTML = myPosts.slice().reverse().map(p => `
                <div class="glass p-4 rounded-xl border-l-4 border-blue-500 flex justify-between items-center group">
                    <div>
                        <h4 class="text-sm font-bold text-slate-200">${sanitizeHTML(p.title)}</h4>
                        <p class="text-[10px] opacity-40">${p.date || 'Baru saja'}</p>
                    </div>
                    <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="prepareEdit(${p.id})" class="p-2 text-blue-400">✏️</button>
                        <button onclick="deletePost(${p.id})" class="p-2 text-red-400">🗑️</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        console.error("Gagal memuat profil:", e);
    }
}
