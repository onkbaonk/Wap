// assets/js/admin.js
async function loadAdminPanel() {
    const currentUser = localStorage.getItem("active_user");
    const restrictedMsg = document.getElementById('admin-restricted-message');
    const adminContent = document.getElementById('admin-content');

    if (currentUser !== "admin") {
        restrictedMsg?.classList.remove('hidden');
        adminContent?.classList.add('hidden');
        return;
    }

    restrictedMsg?.classList.add('hidden');
    adminContent?.classList.remove('hidden');

    try {
        const users = await getGithubFile('users.json');
        renderUserManagement(users.content);
        loadAuditLogs(); // Panggil fungsi muat log di sini
    } catch (e) {
        console.error("Gagal memuat data admin");
    }
}

// FUNGSI BARU: Mencatat aktivitas ke logs/audit.json
async function createAuditLog(action, target, details = "") {
    const actor = localStorage.getItem("active_user");
    const role = localStorage.getItem("user_role");
    const path = 'logs/audit.json';

    try {
        let file;
        try {
            file = await getGithubFile(path);
        } catch (e) {
            // Jika file belum ada, buat baru
            file = { content: [], sha: null };
        }

        const newEntry = {
            timestamp: new Date().toISOString(),
            actor: actor,
            role: role,
            action: action,
            target: target,
            details: details
        };

        file.content.unshift(newEntry);
        const updatedContent = file.content.slice(0, 50); // Simpan 50 log terakhir
        
        await updateGithubFile(path, updatedContent, file.sha, `Audit: ${action} by ${actor}`);
    } catch (e) {
        console.error("Audit log error:", e);
    }
}

// FUNGSI BARU: Menampilkan log di UI
async function loadAuditLogs() {
    try {
        const file = await getGithubFile('logs/audit.json');
        const container = document.getElementById('audit-log-container');
        if (!container) return;

        container.innerHTML = file.content.map(log => `
            <div class="text-[10px] bg-black/20 p-2 rounded border-l-2 ${log.action.includes('DELETE') ? 'border-red-500' : 'border-blue-500'}">
                <span class="text-slate-500">[${new Date(log.timestamp).toLocaleTimeString()}]</span>
                <b class="text-white">${log.actor}</b> 
                <span class="text-slate-400">${log.action}</span> -> 
                <b class="text-blue-400">${log.target}</b>
                ${log.details ? `<i class="text-slate-500 ml-1">(${log.details})</i>` : ''}
            </div>
        `).join('');
    } catch (e) {
        document.getElementById('audit-log-container').innerHTML = "<p class='text-[10px] opacity-30'>Belum ada log tersedia.</p>";
    }
}

function renderUserManagement(users) {
    const container = document.getElementById('admin-user-list');
    if (!container) return;

    let html = '';
    Object.keys(users).forEach(username => {
        if (username === 'admin') return;
        
        const role = users[username].role;
        // Memberikan warna berbeda untuk tiap role
        const roleClass = role === 'admin' ? 'text-red-400' : (role === 'moderator' ? 'text-yellow-400' : 'text-blue-400');

        html += `
            <div class="p-3 bg-slate-800/50 border border-white/5 rounded-xl mb-3 flex justify-between items-center">
                <div>
                    <p class="font-bold text-sm">${username}</p>
                    <p class="text-[10px] ${roleClass}">Role: ${role.toUpperCase()}</p>
                </div>
                <div class="flex items-center gap-2">
                    <select onchange="changeUserRole('${username}', this.value)" 
                            class="bg-slate-700 text-[10px] p-1 rounded border-none focus:ring-1 focus:ring-blue-500">
                        <option value="">Ubah Role</option>
                        <option value="admin">Admin</option>
                        <option value="moderator">Moderator</option>
                        <option value="member">Member</option>
                    </select>
                    <button onclick="deleteUserAccount('${username}')" 
                            class="bg-red-500/10 text-red-500 p-1 px-2 rounded text-[10px] hover:bg-red-500 hover:text-white transition-all">
                        Hapus
                    </button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

async function changeUserRole(targetUser, newRole) {
    if (localStorage.getItem("active_user") !== "admin") return alert("Akses dilarang!");
    try {
        const file = await getGithubFile('users.json');
        if (file.content[targetUser]) {
            const oldRole = file.content[targetUser].role;
            file.content[targetUser].role = newRole;
            await updateGithubFile('users.json', file.content, file.sha, `Admin: Change ${targetUser} role`);
            
            // Catat ke Audit Log
            await createAuditLog("CHANGE_ROLE", targetUser, `${oldRole} to ${newRole}`);
            
            alert(`Berhasil! Role ${targetUser} diperbarui.`);
            location.reload(); 
        }
    } catch (e) { alert("Gagal mengubah role."); }
}

async function deleteUserAccount(targetUser) {
    if (localStorage.getItem("active_user") !== "admin") return alert("Akses dilarang!");
    if (!confirm(`Hapus akun ${targetUser}?`)) return;

    try {
        const file = await getGithubFile('users.json');
        if (file.content[targetUser]) {
            delete file.content[targetUser];
            await updateGithubFile('users.json', file.content, file.sha, `Admin: Delete ${targetUser}`);
            
            // Catat ke Audit Log
            await createAuditLog("DELETE_USER", targetUser, "Permanent removal");
            
            alert(`Akun ${targetUser} dihapus.`);
            location.reload();
        }
    } catch (e) { alert("Gagal menghapus user."); }
}