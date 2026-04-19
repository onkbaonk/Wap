function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

async function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('section-' + tabName).classList.remove('hidden');
    
    const tabs = ['blog', 'categories', 'chat', 'stats', 'profile'];
    tabs.forEach(t => {
        const el = document.getElementById('tab-' + t);
        if (el) {
            if (t === tabName) {
                el.classList.add('border-blue-500', 'text-blue-400', 'font-bold');
            } else {
                el.classList.remove('border-blue-500', 'text-blue-400', 'font-bold');
            }
        }
    });

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

window.onload = () => {
    updateAuthUI();
    switchTab('blog');
};