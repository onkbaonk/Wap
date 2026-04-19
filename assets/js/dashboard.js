// ==========================================
// UTILS & MODAL CONTROL
// ==========================================
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function viewPost(title, content, postId) {
    document.getElementById('viewTitle').innerText = title;
    document.getElementById('viewContent').innerHTML = content;
    document.getElementById('viewModal').setAttribute('data-current-post-id', postId);
    renderComments(postId);
    openModal('viewModal');
}

// ==========================================
// TAB NAVIGATION (MODULAR LOADING)
// ==========================================
async function switchTab(tabName) {
    // Sembunyikan semua konten tab
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    
    // Tampilkan tab yang dipilih
    document.getElementById('section-' + tabName).classList.remove('hidden');
    
    // Update tampilan tombol tab
    const tabs = ['blog', 'categories', 'chat', 'stats', 'profile'];
    tabs.forEach(t => {
        const el = document.getElementById('tab-' + t);
        if (el) {
            if (t === tabName) {
                el.classList.add('border-blue-500', 'text-blue-400', 'font-bold');
                el.classList.remove('border-transparent', 'text-slate-400');
            } else {
                el.classList.remove('border-blue-500', 'text-blue-400', 'font-bold');
                el.classList.add('border-transparent', 'text-slate-400');
            }
        }
    });

    // Pemuatan Data Berdasarkan Tab
    if (tabName === 'blog') await refreshBlog();
    if (tabName === 'categories') await refreshCategories();
    if (tabName === 'chat') {
        await refreshChat();
        const box = document.getElementById('chat-box');
        box.scrollTop = box.scrollHeight;
    }
    if (tabName === 'profile') await refreshProfile();
    if (tabName === 'stats') await refreshStats();
}

// ==========================================
// BLOG & INTERACTION LOGIC
// ==========================================
async function refreshBlog() {
    if (CURRENT_USER === "guest") {
        document.getElementById('blog-feed').innerHTML = "<div class='glass p-10 text-center rounded-2xl opacity-50 text-sm'>Silahkan login untuk akses database.</div>";
        return;
    }
    try {
        const posts = await getGithubFile('blog_data.json');
        document.getElementById('blog-feed').innerHTML = posts.content.slice().reverse().map(p => {
            const safeTitle = p.title.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const safeContent = p.content.replace(/\n/g, '<br>').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            
            const likes = p.reactions ? Object.values(p.reactions).filter(v => v === 'like').length : 0;
            const dislikes = p.reactions ? Object.values(p.reactions).filter(v => v === 'dislike').length : 0;

            return `
            <div class="glass p-5 rounded-2xl hover:border-blue-500/30 transition-all relative group">
                <button onclick="deletePost(${p.id})" class="absolute top-4 right-4 text-red-500 opacity-40 hover:opacity-100 p-2 z-20">🗑️</button>
                <div class="cursor-pointer" onclick="viewPost('${safeTitle}', '${safeContent}', ${p.id})">
                    <h3 class="font-bold text-blue-400 pr-8"># ${p.title}</h3>
                    <p class="text-xs opacity-70 mt-2 leading-relaxed line-clamp-3">${p.content}</p>
                </div>
                <div class="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                    <button onclick="handleReaction(${p.id}, 'like')" class="flex items-center gap-1 text-[10px] bg-white/5 px-2 py-1 rounded-full border border-white/5">👍 ${likes}</button>
                    <button onclick="handleReaction(${p.id}, 'dislike')" class="flex items-center gap-1 text-[10px] bg-white/5 px-2 py-1 rounded-full border border-white/5">👎 ${dislikes}</button>
                    <div class="ml-auto opacity-40 text-[9px]">👤 ${p.author.toUpperCase()}</div>
                </div>
            </div>`;
        }).join('');
    } catch (e) { console.error(e); }
}
async function submitPost() {
    const t = document.getElementById('postTitle').value;
    const c = document.getElementById('postContent').value;
    const cat = document.getElementById('postCategory').value; // Ambil kategori
    
    if(!t || !c) return alert("Isi judul & konten!");
    
    const btn = document.getElementById('btnSubmitPost');
    btn.innerText = "Processing...";
    
    try {
        const f = await getGithubFile('blog_data.json');
        f.content.push({ 
            id: Date.now(), 
            title: t, 
            content: c, 
            category: cat, // Simpan kategori ke JSON
            author: CURRENT_USER, 
            date: new Date().toISOString().split('T')[0] 
        });
        
        await updateGithubFile('blog_data.json', f.content, f.sha, "New Post with Category");
        closeModal('postModal');
        refreshBlog(); // Refresh feed
    } catch(e) { alert("Gagal!"); }
    btn.innerText = "Terbitkan";
}
async function deletePost(postId) {
          if (!confirm("Hapus postingan ini secara permanen?")) return;

          try {
              const file = await getGithubFile('blog_data.json');
        // Filter postingan: simpan semua KECUALI yang ID-nya dipilih
              const updatedPosts = file.content.filter(post => post.id !== postId);

              await updateGithubFile('blog_data.json', updatedPosts, file.sha, `Delete post ID: ${postId}`);
        
              alert("Postingan berhasil dihapus!");
              loadContent(); // Refresh tampilan
          } catch (e) {
              alert("Gagal menghapus postingan.");
          }
      }
      // Daftar kategori yang tersedia
const availableCategories = ["Semua", "Teknologi", "Catatan", "Tutorial", "Curhat", "Umum"];

async function refreshCategories(filter = "Semua") {
    // 1. Render Baris Tombol Filter
    const filterBar = document.getElementById('category-filter-bar');
    filterBar.innerHTML = availableCategories.map(cat => `
        <button onclick="refreshCategories('${cat}')" 
            class="px-4 py-1 rounded-full text-[10px] whitespace-nowrap border ${filter === cat ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/5 border-white/10 text-slate-400'}">
            ${cat}
        </button>
    `).join('');

    try {
        const file = await getGithubFile('blog_data.json');
        let filtered = file.content;
        
        // 2. Filter data
        if (filter !== "Semua") {
            filtered = file.content.filter(p => p.category === filter);
        }

        // 3. Render ke UI (Hanya Judul agar rapi)
        const container = document.getElementById('category-posts');
        if (filtered.length === 0) {
            container.innerHTML = `<p class='text-center opacity-30 py-10 text-xs'>Tidak ada postingan di kategori ${filter}.</p>`;
            return;
        }

        container.innerHTML = filtered.reverse().map(p => {
            const safeTitle = p.title.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const safeContent = p.content.replace(/\n/g, '<br>').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            return `
                <div class="glass p-4 rounded-xl flex justify-between items-center group cursor-pointer" onclick="viewPost('${safeTitle}', '${safeContent}', ${p.id})">
                    <div>
                        <span class="text-[8px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded mb-1 inline-block">${p.category || 'Umum'}</span>
                        <h4 class="font-bold text-sm text-slate-200"># ${p.title}</h4>
                    </div>
                    <div class="text-blue-500">→</div>
                </div>`;
        }).join('');
    } catch (e) { console.error(e); }
}
async function handleReaction(postId, type) {
    try {
        const file = await getGithubFile('blog_data.json');
        const idx = file.content.findIndex(p => p.id === postId);
        if (idx === -1) return;
        if (!file.content[idx].reactions) file.content[idx].reactions = {};
        
        if (file.content[idx].reactions[CURRENT_USER] === type) {
            delete file.content[idx].reactions[CURRENT_USER];
        } else {
            file.content[idx].reactions[CURRENT_USER] = type;
        }
        await updateGithubFile('blog_data.json', file.content, file.sha, `Reaction ${type}`);
        refreshBlog();
    } catch (e) { console.error(e); }
}

// ==========================================
// PROFILE LOGIC (FIXED)
// ==========================================
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

// ==========================================
// CHAT & STATS LOGIC
// ==========================================
async function refreshChat() {
    try {
        const chats = await getGithubFile('chat_room.json');
        document.getElementById('chat-box').innerHTML = chats.content.map(c => {
            const isMe = c.user === CURRENT_USER;
            return `
            <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-2">
                <span class="text-[9px] mb-1 opacity-40 px-2">${isMe ? 'Anda' : '@'+c.user}</span>
                <div class="${isMe ? 'bg-blue-600' : 'bg-slate-800'} p-2 px-3 rounded-xl text-white text-[11px] max-w-[85%]">${c.text}</div>
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

// ==========================================
// COMMENT LOGIC
// ==========================================
async function renderComments(postId) {
    const list = document.getElementById('comment-list');
    list.innerHTML = "<p class='text-[10px] opacity-30'>Loading...</p>";
    try {
        const file = await getGithubFile('blog_data.json');
        const post = file.content.find(p => p.id === postId);
        if (!post.comments || post.comments.length === 0) {
            list.innerHTML = "<p class='text-[10px] opacity-30 italic'>Belum ada komentar.</p>";
            return;
        }
        list.innerHTML = post.comments.map(c => `
            <div class="bg-white/5 p-2 rounded-lg border border-white/5 mb-2">
                <div class="flex justify-between text-[9px] mb-1">
                    <span class="text-blue-400 font-bold">@${c.user}</span>
                    <span class="opacity-30">${c.date}</span>
                </div>
                <p class="text-[10px] opacity-80">${c.text}</p>
            </div>
        `).join('');
    } catch (e) { list.innerHTML = "Error."; }
}

async function addComment() {
    const input = document.getElementById('commentInput');
    const text = input.value.trim();
    const postId = parseInt(document.getElementById('viewModal').getAttribute('data-current-post-id'));
    if (!text || CURRENT_USER === "guest") return;
    try {
        const file = await getGithubFile('blog_data.json');
        const idx = file.content.findIndex(p => p.id === postId);
        if (!file.content[idx].comments) file.content[idx].comments = [];
        file.content[idx].comments.push({ user: CURRENT_USER, text: text, date: new Date().toLocaleDateString() });
        await updateGithubFile('blog_data.json', file.content, file.sha, "New Comment");
        input.value = "";
        renderComments(postId);
    } catch (e) { alert("Gagal!"); }
}

// ==========================================
// INITIAL LOAD
// ==========================================
window.onload = () => {
    updateAuthUI();
    switchTab('blog'); // Default view
};
