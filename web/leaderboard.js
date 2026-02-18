// leaderboard.js
// Mock Leaderboard System using LocalStorage to simulate "Global" rankings

export const LEADERBOARDS = [
    { id: "max_production", name: "Highest Production", unit: "CpS" },
    { id: "fastest_ascension", name: "Fastest Ascension", unit: "sec" },
    { id: "total_clicks", name: "Total Clicks", unit: "" }
];

export function initLeaderboard(state) {
    if (!state.leaderboard) {
        state.leaderboard = {
            scores: []
        };
    }
}

export function submitScore(state, type, value) {
    // In a real app, this would POST to Firebase
    // Here we act as if we are one player among bots

    // Generate fake global scores if empty
    let globalScores = JSON.parse(localStorage.getItem(`lb_${type}`)) || [];
    if (globalScores.length === 0) {
        globalScores = generateFakeScores(type);
    }

    // Add Player
    const playerEntry = { name: "You", value: value, date: Date.now() };

    // Update existing if better
    const existingIdx = globalScores.findIndex(s => s.name === "You");
    if (existingIdx > -1) {
        if (value > globalScores[existingIdx].value) {
            globalScores[existingIdx] = playerEntry;
        }
    } else {
        globalScores.push(playerEntry);
    }

    // Sort
    globalScores.sort((a, b) => b.value - a.value);
    if (type === "fastest_ascension") globalScores.sort((a, b) => a.value - b.value); // Lower is better

    // Save
    localStorage.setItem(`lb_${type}`, JSON.stringify(globalScores.slice(0, 100))); // Keep top 100

    return globalScores;
}

function generateFakeScores(type) {
    const names = ["Alpha", "ClickMaster", "CivBuilder", "Napoleon", "Gandhi_Nukes"];
    const scores = [];

    names.forEach(name => {
        let val = 0;
        if (type === "max_production") val = Math.floor(Math.random() * 100000);
        if (type === "total_clicks") val = Math.floor(Math.random() * 50000);
        if (type === "fastest_ascension") val = 300 + Math.floor(Math.random() * 3000);

        scores.push({ name, value: val, date: Date.now() - Math.floor(Math.random() * 10000000) });
    });

    return scores;
}

export function renderLeaderboardModal(state) {
    if (document.getElementById("lb-modal")) return;

    const modal = document.createElement("div");
    modal.id = "lb-modal";
    modal.className = "modal-overlay";

    // Content
    let html = `
        <div class="modal-content" style="width: 500px;">
            <h2>🌍 Global Leaderboards</h2>
            <div style="display:flex; justify-content:space-around; margin-bottom:10px;">
                <button onclick="viewLB('max_production')">Production</button>
                <button onclick="viewLB('total_clicks')">Clicks</button>
                <button onclick="viewLB('fastest_ascension')">Speedrun</button>
            </div>
            <div id="lb-content" style="height:300px; overflow-y:auto; background:rgba(0,0,0,0.3); padding:10px; text-align:left;">
                Select a category...
            </div>
            <button onclick="document.body.removeChild(document.getElementById('lb-modal'))" style="margin-top:10px;">Close</button>
        </div>
    `;

    modal.innerHTML = html;
    document.body.appendChild(modal);

    // Auto load first
    window.viewLB('max_production');
}

window.viewLB = function(type) {
    const container = document.getElementById("lb-content");
    if (!container) return;

    // Submit current score to ensure we are on list
    let myVal = 0;
    const state = window.gameState;
    if (type === "max_production") myVal = 0; // Need calculateProduction exposed?
    if (type === "total_clicks") myVal = state.stats.totalClicks || 0;

    const scores = submitScore(state, type, myVal);

    let html = "<table style='width:100%'><tr><th>Rank</th><th>Player</th><th>Score</th></tr>";
    scores.forEach((s, i) => {
        const isMe = s.name === "You";
        html += `<tr style="${isMe ? 'color:#f1c40f; font-weight:bold;' : ''}">
            <td>#${i+1}</td>
            <td>${s.name}</td>
            <td>${Math.floor(s.value)}</td>
        </tr>`;
    });
    html += "</table>";

    container.innerHTML = html;
};
