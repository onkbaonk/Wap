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
    if (CURRENT_USER === "guest") return;

    try {
        // Update Elemen Identitas (Mencegah kebocoran kode mentah di HTML)
        const initial = CURRENT_USER.charAt(0).toUpperCase();
        document.getElementById('user-initial').innerText = initial;
        document.getElementById('user-display-name').innerText = "@" + CURRENT_USER;

        const posts = await getGithubFile('blog_data.json');
        const chats = await getGithubFile('chat_room.json');

        const myPosts = posts.content.filter(p => p.author === CURRENT_USER);
        const myChats = chats.content.filter(c => c.user === CURRENT_USER);

        document.getElementById('user-post-count').innerText = myPosts.length;
        document.getElementById('user-chat-count').innerText = myChats.length;

        if (myPosts.length === 0) {
            document.getElementById('user-posts').innerHTML = "<p class='text-center opacity-30 py-10 text-xs'>Belum ada postingan.</p>";
        } else {
            document.getElementById('user-posts').innerHTML = myPosts.reverse().map(p => {
                const safeTitle = p.title.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                const safeContent = p.content.replace(/\n/g, '<br>').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                return `
                <div class="glass p-4 rounded-xl border-l-4 border-blue-500 hover:bg-white/5 cursor-pointer flex justify-between items-center group" 
                     onclick="viewPost('${safeTitle}', '${safeContent}', ${p.id})">
                    <div>
                        <h4 class="font-bold text-sm text-blue-300"># ${p.title}</h4>
                        <p class="text-[8px] opacity-40 mt-1 uppercase">📅 ${p.date}</p>
                    </div>
                    <div class="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">→</div>
                </div>`;
            }).join('');
        }
    } catch (e) { console.error(e); }
}