let EDIT_POST_ID = null;

async function refreshBlog() {
    const feed = document.getElementById('blog-feed');
    try {
        const index = await getGithubFile('blog_index.json');
        feed.innerHTML = index.content.slice().reverse().map(p => `
            <div class="glass p-5 rounded-2xl mb-4 cursor-pointer hover:border-blue-500/50 transition-all" 
                 onclick="loadFullPost(${p.id})">
                <h3 class="text-sm font-bold text-blue-400">${sanitizeHTML(p.title)}</h3>
                <div class="flex justify-between mt-2 text-[9px] opacity-40 uppercase tracking-widest">
                    <span>Oleh: @${p.author}</span>
                    <span>${p.date}</span>
                </div>
            </div>
        `).join('');
    } catch (e) {
        feed.innerHTML = "<p class='text-center opacity-30'>Belum ada postingan.</p>";
    }
}
async function loadFullPost(postId) {
    openModal('viewModal'); // Buka modal detail
    const container = document.getElementById('viewDetailContent'); // Pastikan ID ini ada di modal kamu
    container.innerHTML = "<p class='skeleton h-20 w-full'></p>"; // Tampilkan loading

    try {
        const post = await getGithubFile(`posts/post_${postId}.json`);
        container.innerHTML = `
            <h2 class="text-xl font-bold mb-2">${sanitizeHTML(post.content.title)}</h2>
            <p class="text-xs opacity-70 leading-relaxed">${sanitizeHTML(post.content.content).replace(/\n/g, '<br>')}</p>
        `;
        // Panggil fungsi refresh komentar di sini jika ada
    } catch (e) {
        container.innerHTML = "Gagal memuat detail postingan.";
    }
}
async function submitPost() {
    const t = document.getElementById('postTitle').value.trim();
    const c = document.getElementById('postContent').value.trim();
    if (!t || !c) return;

    const postId = Date.now(); // Gunakan timestamp sebagai ID unik
    const postPath = `posts/post_${postId}.json`;

    try {
        // 1. Simpan Detail Lengkap ke folder posts/
        const detailedData = {
            id: postId,
            title: t,
            content: c,
            author: CURRENT_USER,
            date: new Date().toLocaleDateString(),
            comments: []
        };
        await updateGithubFile(postPath, detailedData, null, `Detail post ${postId}`);

        // 2. Update Indeks (Katalog Ringkas)
        let indexFile;
        try {
            indexFile = await getGithubFile('blog_index.json');
        } catch (e) {
            indexFile = { content: [], sha: null };
        }

        const summary = {
            id: postId,
            title: t,
            author: CURRENT_USER,
            date: detailedData.date
        };

        indexFile.content.push(summary);
        await updateGithubFile('blog_index.json', indexFile.content, indexFile.sha, `Update Index`);

        closeModal('postModal');
        await refreshBlog();
    } catch (e) {
        alert("Gagal memposting!");
    }
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
    const file = await getGithubFile('blog_data.json');
    const post = file.content.find(p => p.id === postId);
    
    // Cek apakah benar pemiliknya
    if (post.author !== CURRENT_USER && CURRENT_USER !== 'admin') {
        alert("Akses ditolak! Ini bukan postingan Anda.");
        return;
    }

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
function filterBlog() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const posts = document.querySelectorAll('#blog-feed > div'); // Mengambil semua kartu postingan

    posts.forEach(post => {
        // Cari teks judul di dalam kartu (biasanya tag h3)
        const title = post.querySelector('h3').innerText.toLowerCase();
        
        if (title.includes(query)) {
            post.style.display = "block"; // Tampilkan jika cocok
        } else {
            post.style.display = "none";  // Sembunyikan jika tidak cocok
        }
    });

    // Tampilkan pesan jika tidak ada hasil
    const existingNoResult = document.getElementById('no-search-result');
    const visiblePosts = Array.from(posts).filter(p => p.style.display !== "none").length;

    if (visiblePosts === 0) {
        if (!existingNoResult) {
            const msg = document.createElement('p');
            msg.id = 'no-search-result';
            msg.className = 'text-center opacity-40 text-xs py-10';
            msg.innerText = "Postingan tidak ditemukan.";
            document.getElementById('blog-feed').appendChild(msg);
        }
    } else {
        if (existingNoResult) existingNoResult.remove();
    }
}