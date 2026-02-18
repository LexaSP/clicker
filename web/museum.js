// museum.js
// Combine relics into Great Works

export const GREAT_WORKS = [
    { id: "mona_lisa", name: "Mona Lisa", req: ["Painting", "Canvas", "Oil Paint"], bonus: { culture_mult: 1.5 }, desc: "The most famous smile." },
    { id: "rosetta_stone", name: "Rosetta Stone", req: ["Tablet", "Chisel", "Hieroglyphs"], bonus: { knowledge_mult: 1.5 }, desc: "Unlocking ancient languages." },
    { id: "crown_jewels", name: "Crown Jewels", req: ["Gem", "Gold", "Crown"], bonus: { money_mult: 1.5 }, desc: "Symbol of royalty." }
];

// Note: requirements are based on Relic names/types. Since relics are randomly generated,
// we need a system to tag them or fuzzy match.
// For simplicity, let's say Great Works consume ANY 3 relics of a specific rarity or type.
// Or we allow players to "sacrifice" duplicates.

export function initMuseum(state) {
    if (!state.museum) {
        state.museum = {
            works: [] // List of IDs
        };
    }
}

export function createGreatWork(state, workId, relicIndices) {
    const work = GREAT_WORKS.find(w => w.id === workId);
    if (!work) return { success: false, msg: "Invalid work." };
    if (state.museum.works.includes(workId)) return { success: false, msg: "Already created." };

    // Validate indices
    const relics = relicIndices.map(i => state.inventory[i]);
    if (relics.includes(undefined)) return { success: false, msg: "Invalid relics." };

    // Consume relics (remove from inventory - descending order to avoid shift issues)
    relicIndices.sort((a, b) => b - a);
    relicIndices.forEach(i => state.inventory.splice(i, 1));

    state.museum.works.push(workId);
    return { success: true, msg: `Created Great Work: ${work.name}!` };
}

export function getMuseumMultiplier(state, type) {
    initMuseum(state);
    let mult = 1.0;

    state.museum.works.forEach(wid => {
        const w = GREAT_WORKS.find(x => x.id === wid);
        if (w && w.bonus[type]) {
            mult *= w.bonus[type];
        }
    });

    return mult;
}

export function renderMuseum(state) {
    const container = document.getElementById("museum-list");
    if (!container) return;
    container.innerHTML = "";

    // Display Created
    state.museum.works.forEach(wid => {
        const w = GREAT_WORKS.find(x => x.id === wid);
        container.innerHTML += `<div class="relic-card unique">🏛️ ${w.name}<br><small>${w.desc}</small></div>`;
    });

    container.innerHTML += "<hr><h4>Create New Work (Requires 3 Relics)</h4>";

    // Creation UI
    GREAT_WORKS.forEach(w => {
        if (!state.museum.works.includes(w.id)) {
            const btn = document.createElement("button");
            btn.innerText = `Create ${w.name}`;
            btn.onclick = () => {
                // Auto-select first 3 relics for demo simplicity
                // In real UI, user would select.
                if (state.inventory.length >= 3) {
                    if (confirm(`Sacrifice first 3 relics to create ${w.name}?`)) {
                        const res = createGreatWork(state, w.id, [0, 1, 2]);
                        alert(res.msg);
                        window.updateUI(); // force update
                    }
                } else {
                    alert("Need at least 3 relics!");
                }
            };
            container.appendChild(btn);
        }
    });
}
