async function refreshStats() {
    try {
        const posts = await getGithubFile('blog_data.json');
        const chats = await getGithubFile('chat_room.json');
        const users = await getGithubFile('users.json');
        document.getElementById('db-status').innerHTML = `
            <p>🟢 Status: Connected</p>
            <p>👥 Users: ${Object.keys(users.content).length}</p>
            <p>📝 Posts: ${posts.content.length}</p>
            <p>💬 Chats: ${chats.content.length}</p>
        `;
    } catch (e) { console.error(e); }
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

    // 1. Update UI Dasar
    document.getElementById('user-display-name').innerText = `@${CURRENT_USER}`;
    document.getElementById('user-initial').innerText = CURRENT_USER.charAt(0).toUpperCase();

    try {
        // 2. Ambil Data Blog & Chat untuk Statistik
        const [blogFile, chatFile] = await Promise.all([
            getGithubFile('blog_data.json'),
            getGithubFile('chat_room.json')
        ]);

        // 3. Filter data milik User ini
        const myPosts = blogFile.content.filter(p => p.author === CURRENT_USER);
        const myChatCount = chatFile.content.filter(c => c.user === CURRENT_USER).length;

        // 4. Tampilkan Angka Statistik
        document.getElementById('user-post-count').innerText = myPosts.length;
        document.getElementById('user-chat-count').innerText = myChatCount;

        // 5. Tampilkan List Postingan Milik Sendiri
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