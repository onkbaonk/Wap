let EDIT_POST_ID = null;

// 1. REFRESH BLOG (Hanya mengambil Index Ringan)
async function refreshBlog() {
    const feed = document.getElementById('blog-feed');
    feed.innerHTML = `
        <div class="glass p-5 rounded-2xl h-32 skeleton mb-4"></div>
        <div class="glass p-5 rounded-2xl h-32 skeleton mb-4"></div>
    `;

    if (CURRENT_USER === "guest") {
        feed.innerHTML = "<div class='glass p-10 text-center rounded-2xl opacity-50 text-sm'>Silahkan login untuk akses database.</div>";
        return;
    }

    try {
        // Mengambil blog_index.json, bukan blog_data.json yang berat
        const index = await getGithubFile('blog_index.json');
        
        feed.innerHTML = index.content.slice().reverse().map(p => {
            const cleanTitle = sanitizeHTML(p.title);
            const isOwner = p.author === CURRENT_USER || CURRENT_USER === 'admin';

            return `
            <div class="glass p-5 rounded-2xl hover:border-blue-500/30 transition-all relative group mb-4">
                ${isOwner ? `
                    <div class="absolute top-4 right-4 flex gap-2 z-20">
                        <button onclick="prepareEdit(${p.id})" class="text-blue-500 opacity-40 hover:opacity-100 p-2">✏️</button>
                        <button onclick="deletePost(${p.id})" class="text-red-500 opacity-40 hover:opacity-100 p-2">🗑️</button>
                    </div>
                ` : ''}
                <div class="cursor-pointer" onclick="loadFullPost(${p.id})">
                    <span class="text-[8px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded mb-2 inline-block">${p.category || 'Umum'}</span>
                    <h3 class="font-bold text-blue-400 pr-16"># ${cleanTitle}</h3>
                    <div class="flex justify-between mt-4 pt-4 border-t border-white/5 opacity-40 text-[9px]">
                        <span>👤 ${p.author.toUpperCase()}</span>
                        <span>📅 ${p.date}</span>
                    </div>
                </div>
            </div>`;
        }).join('');
    } catch (e) { 
        feed.innerHTML = "<p class='text-center opacity-30 py-10'>Belum ada postingan. Mulailah menulis!</p>";
    }
}

// 2. SUBMIT POST (Simpan Detail ke Folder 'posts' & Update Index)
async function submitPost() {
    const t = document.getElementById('postTitle').value.trim();
    const c = document.getElementById('postContent').value.trim();
    const cat = document.getElementById('postCategory').value;
    
    if(!t || !c) return alert("Isi judul & konten!");
    
    const btn = document.querySelector("#postModal button[onclick='submitPost()']");
    const originalText = btn.innerText;
    btn.innerText = "Mengirim...";
    btn.disabled = true;

    const postId = Date.now();
    const dateNow = new Date().toISOString().split('T')[0];

    try {
        // A. Simpan file detail lengkap ke folder posts/
        const detailedData = {
            id: postId,
            title: t,
            content: c,
            category: cat,
            author: CURRENT_USER,
            date: dateNow,
            reactions: {},
            comments: []
        };
        await updateGithubFile(`posts/post_${postId}.json`, detailedData, null, `Create post ${postId}`);

        // B. Update blog_index.json
        let indexFile;
        try {
            indexFile = await getGithubFile('blog_index.json');
        } catch (e) {
            indexFile = { content: [], sha: null };
        }

        indexFile.content.push({
            id: postId,
            title: t,
            author: CURRENT_USER,
            category: cat,
            date: dateNow
        });

        await updateGithubFile('blog_index.json', indexFile.content, indexFile.sha, "Update Blog Index");
        
        closeModal('postModal');
        resetPostModal();
        await refreshBlog();
    } catch (e) {
        alert("Gagal mengirim!");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// 3. LOAD FULL POST (Membaca file shard saat diklik)
async function loadFullPost(postId) {
    openModal('viewModal');
    const container = document.getElementById('viewContent');
    const titleElem = document.getElementById('viewTitle');
    const modal = document.getElementById('viewModal');
    
    container.innerHTML = "<div class='skeleton h-32 w-full'></div>";
    titleElem.innerText = "Memuat...";
    modal.setAttribute('data-current-post-id', postId);

    try {
        const res = await getGithubFile(`posts/post_${postId}.json`);
        const post = res.content;

        titleElem.innerText = post.title;
        container.innerHTML = `
            <div class="flex items-center gap-2 mb-4">
                <span class="text-[9px] bg-blue-600 px-2 py-0.5 rounded text-white">${post.category}</span>
                <span class="text-[9px] opacity-50">Oleh @${post.author}</span>
            </div>
            <p class="text-sm leading-relaxed text-slate-300">${sanitizeHTML(post.content).replace(/\n/g, '<br>')}</p>
            <div class="mt-6 pt-4 border-t border-white/10 flex gap-4">
                 <button onclick="handleReaction(${postId}, 'like')" class="text-xs bg-white/5 px-4 py-2 rounded-xl">👍 ${Object.values(post.reactions || {}).length}</button>
            </div>
        `;
        renderComments(postId);
    } catch (e) {
        container.innerHTML = "Gagal memuat detail postingan.";
    }
}

// 4. EDIT POST (Mengambil detail dari shard lalu update keduanya)
async function prepareEdit(postId) {
    try {
        const res = await getGithubFile(`posts/post_${postId}.json`);
        const post = res.content;

        document.getElementById('postTitle').value = post.title;
        document.getElementById('postContent').value = post.content;
        document.getElementById('postCategory').value = post.category || "Umum";
        
        document.querySelector('#postModal h2').innerText = "✏️ Edit Postingan";
        document.getElementById('btnSubmitPost').innerText = "Simpan Perubahan";
        document.getElementById('btnSubmitPost').onclick = submitEdit;
        
        EDIT_POST_ID = postId;
        openModal('postModal');
    } catch (e) { alert("Gagal mengambil data postingan."); }
}

async function submitEdit() {
    const t = document.getElementById('postTitle').value.trim();
    const c = document.getElementById('postContent').value.trim();
    const cat = document.getElementById('postCategory').value;
    
    const btn = document.getElementById('btnSubmitPost');
    btn.innerText = "Saving...";

    try {
        // A. Update Shard Detail
        const shard = await getGithubFile(`posts/post_${EDIT_POST_ID}.json`);
        shard.content.title = t;
        shard.content.content = c;
        shard.content.category = cat;
        await updateGithubFile(`posts/post_${EDIT_POST_ID}.json`, shard.content, shard.sha, `Edit Detail ${EDIT_POST_ID}`);

        // B. Update Index
        const index = await getGithubFile('blog_index.json');
        const idx = index.content.findIndex(p => p.id === EDIT_POST_ID);
        if (idx !== -1) {
            index.content[idx].title = t;
            index.content[idx].category = cat;
        }
        await updateGithubFile('blog_index.json', index.content, index.sha, `Update Index ${EDIT_POST_ID}`);

        resetPostModal();
        closeModal('postModal');
        refreshBlog();
    } catch(e) { alert("Gagal menyimpan!"); }
}

// 5. DELETE POST
async function deletePost(postId) {
    if (!confirm("Hapus postingan ini secara permanen?")) return;

    try {
        // A. Hapus dari Index
        const index = await getGithubFile('blog_index.json');
        const updatedIndex = index.content.filter(p => p.id !== postId);
        await updateGithubFile('blog_index.json', updatedIndex, index.sha, `Delete Index ${postId}`);

        // Catatan: File shard di folder posts/ bisa dibiarkan atau dihapus manual via API jika perlu.
        // Untuk saat ini, menghapusnya dari index sudah cukup untuk menyembunyikannya.

        alert("Postingan dihapus!");
        refreshBlog();
    } catch (e) { alert("Gagal menghapus."); }
}

// 6. KOMENTAR & REAKSI (Sekarang mengarah ke Shard masing-masing)
async function renderComments(postId) {
    const list = document.getElementById('comment-list');
    try {
        const res = await getGithubFile(`posts/post_${postId}.json`);
        const post = res.content;
        if (!post.comments || post.comments.length === 0) {
            list.innerHTML = "<p class='text-[10px] opacity-30 italic py-4 text-center'>Belum ada komentar.</p>";
            return;
        }
        list.innerHTML = post.comments.map(c => `
            <div class="bg-white/5 p-3 rounded-xl border border-white/5 mb-2">
                <div class="flex justify-between text-[9px] mb-1">
                    <span class="text-blue-400 font-bold">@${c.user}</span>
                    <span class="opacity-30">${c.date}</span>
                </div>
                <p class="text-[10px] opacity-80 leading-relaxed">${sanitizeHTML(c.text)}</p>
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
        const res = await getGithubFile(`posts/post_${postId}.json`);
        const post = res.content;
        if (!post.comments) post.comments = [];
        post.comments.push({ user: CURRENT_USER, text: text, date: new Date().toLocaleDateString() });
        
        await updateGithubFile(`posts/post_${postId}.json`, post, res.sha, "Add Comment");
        input.value = "";
        renderComments(postId);
    } catch (e) { alert("Gagal komentar!"); }
}

async function handleReaction(postId, type) {
    try {
        const res = await getGithubFile(`posts/post_${postId}.json`);
        const post = res.content;
        if (!post.reactions) post.reactions = {};
        
        if (post.reactions[CURRENT_USER] === type) {
            delete post.reactions[CURRENT_USER];
        } else {
            post.reactions[CURRENT_USER] = type;
        }
        await updateGithubFile(`posts/post_${postId}.json`, post, res.sha, `Reaction ${type}`);
        loadFullPost(postId); // Refresh tampilan detail
    } catch (e) { console.error(e); }
}

// 7. FUNGSI PENDUKUNG LAINNYA
function resetPostModal() {
    EDIT_POST_ID = null;
    document.getElementById('postTitle').value = "";
    document.getElementById('postContent').value = "";
    document.querySelector('#postModal h2').innerText = "📝 Tulis Postingan";
    document.getElementById('btnSubmitPost').innerText = "Terbitkan";
    document.getElementById('btnSubmitPost').onclick = submitPost;
}

function filterBlog() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const posts = document.querySelectorAll('#blog-feed > div');
    posts.forEach(post => {
        const title = post.querySelector('h3').innerText.toLowerCase();
        post.style.display = title.includes(query) ? "block" : "none";
    });
}

const availableCategories = ["Semua", "Teknologi", "Catatan", "Tutorial", "Curhat", "Umum"];

async function refreshCategories(filter = "Semua") {
    const filterBar = document.getElementById('category-filter-bar');
    if (!filterBar) return;

    filterBar.innerHTML = availableCategories.map(cat => `
        <button onclick="refreshCategories('${cat}')" 
            class="px-4 py-1 rounded-full text-[10px] whitespace-nowrap border ${filter === cat ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/5 border-white/10 text-slate-400'}">
            ${cat}
        </button>
    `).join('');

    try {
        // PERBAIKAN: Ganti blog_data.json ke blog_index.json
        const res = await getGithubFile('blog_index.json');
        let filtered = res.content;
        
        if (filter !== "Semua") {
            filtered = res.content.filter(p => p.category === filter);
        }

        const container = document.getElementById('category-posts');
        if (!filtered || filtered.length === 0) {
            container.innerHTML = `<p class='text-center opacity-30 py-10 text-xs'>Tidak ada postingan di kategori ${filter}.</p>`;
            return;
        }

        container.innerHTML = filtered.reverse().map(p => `
            <div class="glass p-4 rounded-xl flex justify-between items-center group cursor-pointer mb-2" onclick="loadFullPost(${p.id})">
                <div>
                    <span class="text-[8px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded mb-1 inline-block">${p.category || 'Umum'}</span>
                    <h4 class="font-bold text-sm text-slate-200"># ${sanitizeHTML(p.title)}</h4>
                </div>
                <div class="text-blue-500">→</div>
            </div>`).join('');
    } catch (e) { console.error(e); }
}