// constellations.js
// Tier 2 Prestige: Unlock Constellations after maxing Ascension

export const CONSTELLATIONS = [
    { id: "hunter", name: "The Hunter", desc: "Auto-Clicker 10x Power", cost: 1000, effect: { type: "building_boost", building: "AutoClicker", value: 10 } },
    { id: "scholar", name: "The Scholar", desc: "Knowledge Max +1M, Gain +100%", cost: 2000, effect: { type: "knowledge_mult", value: 2.0 } },
    { id: "builder", name: "The Builder", desc: "All Building Costs -50%", cost: 5000, effect: { type: "global_cost", value: 0.5 } },
    { id: "time", name: "The Timekeeper", desc: "Game Speed x2", cost: 10000, effect: { type: "tick_speed", value: 2.0 } } // Logic needs support in tick
];

export function initConstellations(state) {
    if (!state.constellations) {
        state.constellations = {
            unlocked: [], // IDs
            starDust: 0 // New currency
        };
    }
}

export function prestigeToConstellations(state) {
    // Requires >= 1M Symbols of Era
    if (state.resources.symbolsOfEra < 1000000) return { success: false, msg: "Need 1,000,000 SE to Ascend to Stars." };

    // Convert SE to Star Dust (1M SE = 1 SD)
    const dust = Math.floor(state.resources.symbolsOfEra / 1000000);
    state.resources.symbolsOfEra = 0; // Reset Tier 1 currency? Or keep rest?
    // Let's reset all SE for Dust.

    initConstellations(state);
    state.constellations.starDust += dust;

    // Hard Reset Game (Tier 2 reset)
    // We call standard prestige but keep constellations
    // Actually standard prestige keeps ascension. This is higher.
    // Ideally we reset ascension perks too?
    // For now, let's just grant currency and not force hard reset if not desired,
    // OR force prestige.

    window.performPrestige(); // Standard reset

    return { success: true, msg: `Transcended! Gained ${dust} Star Dust. Check the Sky.` };
}

export function unlockConstellation(state, id) {
    const c = CONSTELLATIONS.find(x => x.id === id);
    if (!c) return;
    initConstellations(state);

    if (state.constellations.unlocked.includes(id)) return { success: false, msg: "Already unlocked." };
    if (state.constellations.starDust < c.cost) return { success: false, msg: "Not enough Star Dust." };

    state.constellations.starDust -= c.cost;
    state.constellations.unlocked.push(id);

    return { success: true, msg: `Constellation Formed: ${c.name}` };
}

export function getConstellationMultiplier(state, type) {
    let mult = 1.0;
    if (!state.constellations) return mult;

    state.constellations.unlocked.forEach(id => {
        const c = CONSTELLATIONS.find(x => x.id === id);
        if (c && c.effect.type === type) mult *= c.effect.value;
    });

    return mult;
}

export function renderConstellationMenu() {
    if (document.getElementById("star-modal")) return;

    const modal = document.createElement("div");
    modal.id = "star-modal";
    modal.className = "modal-overlay";

    const state = window.gameState;
    initConstellations(state);

    let html = `
        <div class="modal-content" style="background:#000; border:1px solid #fff; color:#fff;">
            <h2>✨ Stellar Map</h2>
            <p>Star Dust: ${state.constellations.starDust}</p>
            <button onclick="attemptTranscend()" style="background:#8e44ad; width:100%;">Transcension (Convert 1M SE -> 1 SD)</button>
            <hr>
            <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center;">
    `;

    CONSTELLATIONS.forEach(c => {
        const unlocked = state.constellations.unlocked.includes(c.id);
        html += `
            <div style="border:1px solid ${unlocked ? '#f1c40f' : '#555'}; padding:10px; width:150px; opacity:${unlocked ? 1 : 0.7}">
                <strong>${c.name}</strong><br>
                <small>${c.desc}</small><br>
                ${unlocked ? "⭐ Formed" : `<button onclick="formConstellation('${c.id}')">Form (${c.cost} SD)</button>`}
            </div>
        `;
    });

    html += `</div><button onclick="document.body.removeChild(document.getElementById('star-modal'))" style="margin-top:20px;">Close</button></div>`;
    modal.innerHTML = html;
    document.body.appendChild(modal);
}

window.renderConstellationMenu = renderConstellationMenu;

window.attemptTranscend = function() {
    const res = prestigeToConstellations(window.gameState);
    alert(res.msg);
    renderConstellationMenu(); // Update UI
    window.updateUI();
};

window.formConstellation = function(id) {
    const res = unlockConstellation(window.gameState, id);
    if (res.success) {
        alert(res.msg);
        renderConstellationMenu();
        window.updateUI();
    } else {
        alert(res.msg);
    }
};
