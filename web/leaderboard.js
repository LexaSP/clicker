// leaderboard.js
// Mock Leaderboard System with Time Ranges and Rewards

export const LEADERBOARDS = [
    { id: "max_production", name: "Highest Production", unit: "CpS" },
    { id: "total_clicks", name: "Total Clicks", unit: "" },
    { id: "ascension_count", name: "Ascensions", unit: "" }
];

// Mock database
// Keys: lb_{type}_{range} -> [ { name, value, date } ]
// Ranges: "all", "month", "week"

export function renderLeaderboardModal(state) {
    if (document.getElementById("lb-modal")) return;

    const modal = document.createElement("div");
    modal.id = "lb-modal";
    modal.className = "modal-overlay";

    // Check Modded Status
    let warning = "";
    if (state.isModded) {
        warning = `<div style="background:#c0392b; padding:5px; margin-bottom:5px;">⛔ MODDED SAVE - SCORES NOT SUBMITTED</div>`;
    }

    let html = `
        <div class="modal-content" style="width: 600px;">
            <h2>🌍 Global Leaderboards</h2>
            ${warning}

            <div style="margin-bottom:10px;">
                <label>Range:</label>
                <select id="lb-range" onchange="refreshLB()">
                    <option value="all">All Time</option>
                    <option value="month">This Month</option>
                    <option value="week">This Week</option>
                </select>
            </div>

            <div style="display:flex; justify-content:space-around; margin-bottom:10px;">
                <button onclick="window.currentLbType='max_production'; refreshLB()">Production</button>
                <button onclick="window.currentLbType='total_clicks'; refreshLB()">Clicks</button>
                <button onclick="window.currentLbType='ascension_count'; refreshLB()">Ascensions</button>
            </div>

            <div id="lb-content" style="height:300px; overflow-y:auto; background:rgba(0,0,0,0.3); padding:10px; text-align:left;">
                Loading...
            </div>

            <div style="margin-top:10px; font-size:12px; color:#aaa;">
                Rewards distributed Weekly/Monthly for Top 1000.
            </div>

            <button onclick="document.body.removeChild(document.getElementById('lb-modal'))" style="margin-top:10px;">Close</button>
        </div>
    `;

    modal.innerHTML = html;
    document.body.appendChild(modal);

    window.currentLbType = 'max_production';
    window.refreshLB();
}

window.refreshLB = function() {
    const type = window.currentLbType || 'max_production';
    const range = document.getElementById("lb-range").value;
    const container = document.getElementById("lb-content");

    // Submit current score (if eligible)
    submitScore(window.gameState, type);

    // Fetch and Display
    const scores = getScores(type, range);

    let html = `<h4 style="margin-top:0">${LEADERBOARDS.find(x=>x.id===type).name} (${range})</h4>`;
    html += "<table style='width:100%; border-collapse:collapse;'><tr><th style='text-align:left'>Rank</th><th style='text-align:left'>Player</th><th style='text-align:right'>Score</th></tr>";

    if (scores.length === 0) {
        html += "<tr><td colspan='3'>No scores yet.</td></tr>";
    }

    scores.forEach((s, i) => {
        const isMe = s.name === "You";
        const rowStyle = isMe ? 'color:#f1c40f; font-weight:bold; background:rgba(241, 196, 15, 0.1);' : (i % 2 === 0 ? 'background:rgba(255,255,255,0.05)' : '');
        html += `<tr style="${rowStyle}">
            <td style="padding:4px">#${i+1}</td>
            <td style="padding:4px">${s.name} ${getRankIcon(i)}</td>
            <td style="padding:4px; text-align:right">${formatScore(s.value)}</td>
        </tr>`;
    });
    html += "</table>";

    container.innerHTML = html;
};

function getRankIcon(i) {
    if (i === 0) return "🥇";
    if (i === 1) return "🥈";
    if (i === 2) return "🥉";
    return "";
}

function formatScore(val) {
    if (val >= 1e6) return (val/1e6).toFixed(2) + "M";
    if (val >= 1e3) return (val/1e3).toFixed(2) + "K";
    return Math.floor(val);
}

export function submitScore(state, type) {
    if (state.isModded) return; // Integrity Check

    let value = 0;
    if (type === "max_production") value = state.stats.maxProduction || 0; // Need to track this in tick
    if (type === "total_clicks") value = state.stats.totalClicks || 0;
    if (type === "ascension_count") value = state.stats.transcendenceCount || 0;

    const entry = { name: "You", value: value, date: Date.now() };

    // Save to all buckets
    ["all", "month", "week"].forEach(range => {
        saveToBucket(type, range, entry);
    });
}

function saveToBucket(type, range, entry) {
    const key = `lb_${type}_${range}`;
    let scores = JSON.parse(localStorage.getItem(key)) || [];

    // Mock Population if empty (simulated competition)
    if (scores.length === 0) {
        scores = generateFakeScores(type, range);
    }

    // Update/Insert Player
    const idx = scores.findIndex(s => s.name === "You");
    if (idx > -1) {
        // Only update if higher
        if (entry.value > scores[idx].value) {
            scores[idx] = entry;
        }
    } else {
        scores.push(entry);
    }

    // Sort
    scores.sort((a, b) => b.value - a.value);

    // Trim
    localStorage.setItem(key, JSON.stringify(scores.slice(0, 1000)));
}

function getScores(type, range) {
    const key = `lb_${type}_${range}`;
    let scores = JSON.parse(localStorage.getItem(key)) || [];
    if (scores.length === 0) {
        scores = generateFakeScores(type, range);
        localStorage.setItem(key, JSON.stringify(scores));
    }
    return scores;
}

function generateFakeScores(type, range) {
    const names = ["Alpha", "Clicker", "CivGod", "Speedy", "Bot_42", "Emperor", "Zeus"];
    const scores = [];
    const now = Date.now();

    // Scale values based on range (Weekly scores < All Time)
    let mult = 1.0;
    if (range === "week") mult = 0.2;
    if (range === "month") mult = 0.5;

    names.forEach(name => {
        let val = 0;
        if (type === "max_production") val = Math.random() * 100000 * mult;
        if (type === "total_clicks") val = Math.random() * 50000 * mult;
        if (type === "ascension_count") val = Math.floor(Math.random() * 5 * mult);

        scores.push({ name, value: val, date: now });
    });

    return scores.sort((a,b) => b.value - a.value);
}

// Rewards
export function checkLeaderboardRewards(state) {
    if (state.isModded) return;

    // Simulate Weekly/Monthly reset check
    // In a real app, server handles this. Here we assume "claim" logic or simple timer.
    // Let's implement a "Claim Reward" button that appears if you are high rank and haven't claimed for this period.

    // Simplified: Just one-time bonus for reaching Top X first time?
    // User asked for: "leaders for week/month get bonuses top 1, 2, 3..."

    // We will check rank on load and grant if new peak?
    // Or simpler: Daily check.

    const lastCheck = state.stats.lastLbCheck || 0;
    const now = Date.now();
    if (now - lastCheck < 24 * 3600 * 1000) return; // Daily check

    state.stats.lastLbCheck = now;

    // Check Ranks
    ["week", "month"].forEach(range => {
        ["max_production", "total_clicks"].forEach(type => {
            const scores = getScores(type, range);
            const myRank = scores.findIndex(s => s.name === "You");

            if (myRank !== -1) {
                const rank = myRank + 1;
                let reward = 0;
                let currency = "Symbols of Era";

                if (rank === 1) reward = 100;
                else if (rank <= 3) reward = 50;
                else if (rank <= 10) reward = 25;
                else if (rank <= 50) reward = 10;
                else if (rank <= 1000) reward = 5;

                if (reward > 0) {
                    state.resources.symbolsOfEra += reward;
                    alert(`🏆 LEADERBOARD REWARD (${range}/${type})\nRank #${rank}: +${reward} Symbols of Era!`);
                }
            }
        });
    });
}
