let EDIT_POST_ID = null;
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
            <button onclick="prepareEdit(${p.id})" class="text-blue-500 opacity-40 hover:opacity-100 p-2 z-20">✏️</button>
            <button onclick="deletePost(${p.id})" class="text-red-500 opacity-40 hover:opacity-100 p-2 z-20">🗑️</button>
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
async function prepareEdit(postId) {
    try {
        const file = await getGithubFile('blog_data.json');
        const post = file.content.find(p => p.id === postId);
        
        if (!post) return alert("Postingan tidak ditemukan!");

        // Isi field di modal dengan data lama
        document.getElementById('postTitle').value = post.title;
        document.getElementById('postContent').value = post.content;
        document.getElementById('postCategory').value = post.category || "Umum";
        
        // Ubah tampilan modal sedikit agar user tahu ini sedang Edit
        document.querySelector('#postModal h2').innerText = "✏️ Edit Postingan";
        document.getElementById('btnSubmitPost').innerText = "Simpan Perubahan";
        
        // Ganti fungsi onclick tombol terbitkan sementara
        document.getElementById('btnSubmitPost').onclick = submitEdit;
        
        EDIT_POST_ID = postId;
        openModal('postModal');
    } catch (e) {
        console.error(e);
    }
}
async function submitEdit() {
    const t = document.getElementById('postTitle').value;
    const c = document.getElementById('postContent').value;
    const cat = document.getElementById('postCategory').value;
    
    if(!t || !c) return alert("Judul & konten tidak boleh kosong!");
    
    const btn = document.getElementById('btnSubmitPost');
    btn.innerText = "Saving...";
    
    try {
        const f = await getGithubFile('blog_data.json');
        const idx = f.content.findIndex(p => p.id === EDIT_POST_ID);
        
        if (idx !== -1) {
            // Update data tanpa mengubah ID, Author, atau Tanggal asli
            f.content[idx].title = t;
            f.content[idx].content = c;
            f.content[idx].category = cat;
            // Opsional: tambahkan tag (edited) atau update tanggal edit
            f.content[idx].lastEdit = new Date().toISOString(); 
        }

        await updateGithubFile('blog_data.json', f.content, f.sha, `Edit post ID: ${EDIT_POST_ID}`);
        
        // Kembalikan modal ke kondisi awal (untuk posting baru)
        resetPostModal();
        closeModal('postModal');
        refreshBlog();
    } catch(e) {
        alert("Gagal menyimpan perubahan!");
    }
    btn.innerText = "Terbitkan";
}
async function deletePost(postId) {
    if (!confirm("Hapus postingan ini secara permanen?")) return;

    try {
        const file = await getGithubFile('blog_data.json');

        const updatedPosts = file.content.filter(post => post.id !== postId);

        await updateGithubFile(
            'blog_data.json',
            updatedPosts,
            file.sha,
            `Delete post ID: ${postId}`
        );

        alert("Postingan berhasil dihapus!");

        setTimeout(() => {
            refreshBlog();
        }, 500);

    } catch (e) {
        alert("Gagal menghapus postingan.");
    }
}
function viewPost(title, content, postId) {
    document.getElementById('viewTitle').innerText = title;
    document.getElementById('viewContent').innerHTML = content;
    document.getElementById('viewModal').setAttribute('data-current-post-id', postId);
    renderComments(postId);
    openModal('viewModal');
}
function resetPostModal() {
    EDIT_POST_ID = null;
    document.getElementById('postTitle').value = "";
    document.getElementById('postContent').value = "";
    document.querySelector('#postModal h2').innerText = "📝 Tulis Postingan";
    document.getElementById('btnSubmitPost').innerText = "Terbitkan";
    document.getElementById('btnSubmitPost').onclick = submitPost; // Kembalikan ke fungsi awal
}
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