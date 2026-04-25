// auth.js
let CURRENT_USER = localStorage.getItem("active_user") || "guest";

function updateAuthUI() {
    const userBadge = document.getElementById('user-badge');
    const authBtn = document.getElementById('authActionBtn');
    
    // Jika komponen header belum dimuat, hentikan dulu
    if (!authBtn || !userBadge) return;

    userBadge.innerText = `User: ${CURRENT_USER}`;
    
    if (CURRENT_USER !== "guest") {
        authBtn.innerText = "Logout";
        authBtn.onclick = logout;
        authBtn.className = "bg-red-600/20 text-red-400 border border-red-600 px-4 py-1 rounded-full text-[10px] font-bold";
    } else {
        authBtn.innerText = "Login / Register";
        authBtn.onclick = () => openModal('authModal');
        authBtn.className = "bg-green-600/20 text-green-400 border border-green-600 px-4 py-1 rounded-full text-[10px] font-bold";
    }
}

async function handleLoginRegister() {
    const userInput = document.getElementById('authUser');
    const passInput = document.getElementById('authPass'); // Pastikan ID ini ada di modal Anda
    const user = userInput.value.trim().toLowerCase();
    const pass = passInput.value.trim();

    if (!user || !pass) return alert("Isi username dan password!");

    try {
        const file = await getGithubFile('users.json');
        
        // JIKA USER BELUM ADA (Otomatis Registrasi)
        if (!file.content[user]) {
            file.content[user] = { 
                password: pass, // Menyimpan password baru
                role: "member", 
                bio: "User baru dari index",
                joined: new Date().toISOString() 
            };
            await updateGithubFile('users.json', file.content, file.sha, `Auto-Register: ${user}`);
            alert("Akun baru berhasil dibuat!");
        } 
        // JIKA USER SUDAH ADA (Validasi Login)
        else {
            if (file.content[user].password !== pass) {
                return alert("Password salah! Silakan coba lagi.");
            }
        }

        // Simpan sesi jika sukses
        localStorage.setItem("active_user", user);
        location.reload();
    } catch (e) {
        console.error(e);
        alert("Gagal Login. Pastikan Token GitHub aktif dan file users.json tersedia.");
    }
}

function logout() {
    localStorage.removeItem("active_user");
    location.reload();
}