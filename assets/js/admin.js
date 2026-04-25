// assets/js/admin.js
async function loadAdminPanel() {
    const currentUser = localStorage.getItem("active_user");
    const restrictedMsg = document.getElementById('admin-restricted-message');
    const adminContent = document.getElementById('admin-content');

    if (currentUser !== "admin") {
        // Jika bukan admin, tampilkan pesan error
        restrictedMsg?.classList.remove('hidden');
        adminContent?.classList.add('hidden');
        return;
    }

    // Jika admin, tampilkan konten manajemen
    restrictedMsg?.classList.add('hidden');
    adminContent?.classList.remove('hidden');

    try {
        const users = await getGithubFile('users.json');
        renderUserManagement(users.content);
    } catch (e) {
        console.error("Gagal memuat data admin");
    }
}

function renderUserManagement(users) {
    const container = document.getElementById('admin-user-list');
    if (!container) return;

    let html = '';
    Object.keys(users).forEach(username => {
        if (username === 'admin') return;
        
        html += `
            <div class="p-3 bg-slate-800 rounded mb-2 flex justify-between items-center">
                <div>
                    <p class="font-bold">${username}</p>
                    <p class="text-xs text-slate-400">Role: ${users[username].role}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="changeUserRole('${username}', 'member')" class="text-blue-400 text-xs">Set Member</button>
                    <button onclick="deleteUserAccount('${username}')" class="text-red-400 text-xs">Hapus</button>
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
            file.content[targetUser].role = newRole; 
            await updateGithubFile('users.json', file.content, file.sha, `Admin: Change ${targetUser} role to ${newRole}`);
            alert(`Berhasil! Role ${targetUser} telah diubah menjadi ${newRole}.`);
            location.reload(); 
        }
    } catch (e) {
        console.error(e);
        alert("Gagal mengubah role. Periksa koneksi atau izin Token GitHub Anda.");
    }
}

// Fungsi untuk menghapus akun user (Admin Only)
async function deleteUserAccount(targetUser) {
    if (localStorage.getItem("active_user") !== "admin") return alert("Akses dilarang!");
    if (!confirm(`Apakah Anda yakin ingin menghapus akun ${targetUser}?`)) return;

    try {
        const file = await getGithubFile('users.json');
        
        if (file.content[targetUser]) {
            delete file.content[targetUser]; // Menghapus key user dari objek
            await updateGithubFile('users.json', file.content, file.sha, `Admin: Delete user ${targetUser}`);
            alert(`Akun ${targetUser} telah dihapus.`);
            location.reload();
        }
    } catch (e) {
        alert("Gagal menghapus akun.");
    }
}
