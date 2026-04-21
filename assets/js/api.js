// api.js
const GITHUB_TOKEN = "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"; 
const REPO_PATH = "onkbaonk/Wap";

const utoa = (str) => btoa(unescape(encodeURIComponent(str)));
const atou = (str) => decodeURIComponent(escape(atob(str)));

async function getGithubFile(fileName) {
    const res = await fetch(`https://api.github.com/repos/${REPO_PATH}/contents/${fileName}`, {
        headers: { "Authorization": `token ${GITHUB_TOKEN}` }
    });
    const data = await res.json();
    return { content: JSON.parse(atou(data.content)), sha: data.sha };
}

async function updateGithubFile(fileName, newObj, sha, message) {
    const content = utoa(JSON.stringify(newObj, null, 4));
    return await fetch(`https://api.github.com/repos/${REPO_PATH}/contents/${fileName}`, {
        method: "PUT",
        headers: { "Authorization": `token ${GITHUB_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message, content, sha })
    });
}