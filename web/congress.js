// congress.js
// Global resolutions and voting

const ERA_LEVELS = {
    "Stone Age": 0,
    "Bronze Age": 1,
    "Iron Age": 2,
    "Middle Ages": 3,
    "Renaissance": 4,
    "Industrial Age": 5,
    "Modern Age": 6,
    "Information Age": 7,
    "Future Age": 8
};

export const RESOLUTIONS = [
    { id: "world_peace", name: "Global Peace Treaty", desc: "Army Cost -50%, Happiness +20%", minEra: 6, effect: { army_cost: 0.5, happiness: 1.2 } },
    { id: "science_funding", name: "International Science Fund", desc: "Knowledge +25%, Money -10%", minEra: 6, effect: { knowledge_mult: 1.25, money_mult: 0.9 } },
    { id: "trade_embargo", name: "Trade Regulations", desc: "Money +20%, Production -10%", minEra: 6, effect: { money_mult: 1.2, production_mult: 0.9 } },
    { id: "cultural_heritage", name: "Cultural Heritage Act", desc: "Culture +30%, Knowledge -10%", minEra: 6, effect: { culture_mult: 1.3, knowledge_mult: 0.9 } },
    { id: "space_race", name: "Space Cooperation", desc: "Space Prod +50%, Earth Prod -10%", minEra: 7, effect: { space_mult: 1.5, production_mult: 0.9 } }
    // Era 1 (Stone Age)
    { id: "tribal_chief", name: "Elect Tribal Chief", desc: "Production +10%, Happiness +5%", minEra: "Stone Age", effect: { production_mult: 1.1, happiness: 1.05 } },
    { id: "ration_berries", name: "Ration Berries", desc: "Food +20%, Happiness -5%", minEra: "Stone Age", effect: { food_mult: 1.2, happiness: 0.95 } },

    // later eras
    { id: "cultural_heritage", name: "Cultural Heritage Act", desc: "Culture +30%, Knowledge -10%", minEra: "Middle Ages", effect: { culture_mult: 1.3, knowledge_mult: 0.9 } },
    { id: "trade_embargo", name: "Trade Regulations", desc: "Money +20%, Production -10%", minEra: "Renaissance", effect: { money_mult: 1.2, production_mult: 0.9 } },
    { id: "science_funding", name: "International Science Fund", desc: "Knowledge +25%, Money -10%", minEra: "Industrial Age", effect: { knowledge_mult: 1.25, money_mult: 0.9 } },
    { id: "world_peace", name: "Global Peace Treaty", desc: "Army Cost -50%, Happiness +20%", minEra: "Modern Age", effect: { army_cost: 0.5, happiness: 1.2 } },
    { id: "space_race", name: "Space Cooperation", desc: "Space Prod +50%, Earth Prod -10%", minEra: "Future Age", effect: { space_mult: 1.5, production_mult: 0.9 } }
];

// Helper to check era index for events
const ERA_NAMES = [
    "Stone Age", "Bronze Age", "Iron Age", "Middle Ages", "Renaissance",
    "Industrial Age", "Modern Age", "Information Age", "Future Age"
];

function getEraIndex(eraName) {
    return ERA_NAMES.indexOf(eraName);
}

export function initCongress(state) {
    if (!state.congress) {
        state.congress = {
            activeResolution: null, // Resolution ID currently being voted on
            activeLaws: [], // IDs of passed laws
            timer: 300, // Time until next session (seconds)
            sessionActive: false,
            playerVote: null, // 'yes', 'no', 'abstain'
            votes: { yes: 0, no: 0 }
        };
    }
}

export function updateCongress(state, dt) {
    initCongress(state);
    const cong = state.congress;

    // Strict Era Check: Don't run congress until Modern Age (Era 6)
    // Though the button is hidden, logic shouldn't run either.
    const currentEraIdx = getEraIndex(state.era);
    if (currentEraIdx < 6) return;

    if (cong.sessionActive) {
        cong.timer -= dt;
        if (cong.timer <= 0) {
            resolveSession(state);
        }
    } else {
        cong.timer -= dt;
        if (cong.timer <= 0) {
            startSession(state);
        }
    }
}

function startSession(state) {
    const cong = state.congress;

    // Filter available resolutions by Era
    const currentEraIdx = getEraIndex(state.era);
    const available = RESOLUTIONS.filter(r => {
        const minEra = (r.minEra !== undefined) ? r.minEra : 99;
        return currentEraIdx >= minEra;
    });

    if (available.length === 0) {
        cong.timer = 60; // Wait and retry
    // Filter by Era
    const currentEraLvl = ERA_LEVELS[state.era] || 0;
    const available = RESOLUTIONS.filter(r => (ERA_LEVELS[r.minEra] || 0) <= currentEraLvl);

    if (available.length === 0) {
        cong.timer = 60; // Retry later
        return;
    }

    const res = available[Math.floor(Math.random() * available.length)];

    cong.activeResolution = res.id;
    cong.sessionActive = true;
    cong.timer = 60; // 60s to vote
    cong.playerVote = null;
    cong.votes = { yes: 0, no: 0 };
}

export function vote(state, option) {
    const cong = state.congress;
    if (!cong.sessionActive) return { success: false, msg: "No session active." };
    if (cong.playerVote) return { success: false, msg: "Already voted." };

    cong.playerVote = option;
    return { success: true, msg: `Voted ${option.toUpperCase()}` };
}

function resolveSession(state) {
    const cong = state.congress;
    const res = RESOLUTIONS.find(r => r.id === cong.activeResolution);

    if (!res) {
        cong.sessionActive = false;
        cong.activeResolution = null;
        return;
    }

    // Simulate AI votes
    // 5 AI nations?
    let yes = 0;
    let no = 0;

    for (let i=0; i<5; i++) {
        if (Math.random() > 0.5) yes++; else no++;
    }

    // Player Vote (Weights more?)
    if (cong.playerVote === 'yes') yes += 2; // Player has 2 votes weight
    if (cong.playerVote === 'no') no += 2;

    cong.votes = { yes, no };

    let msg = `Session Ended: ${res.name}\nYes: ${yes} | No: ${no}\n`;

    if (yes > no) {
        msg += "PASSED! Law enacted.";
        if (!cong.activeLaws.includes(res.id)) {
            cong.activeLaws.push(res.id);
        }
    } else {
        msg += "REJECTED.";
    }

    alert(msg);

    cong.sessionActive = false;
    cong.activeResolution = null;
    cong.timer = 300; // 5 mins cooldown
}

export function getCongressMultiplier(state, type) {
    let mult = 1.0;
    if (!state.congress) return mult;

    state.congress.activeLaws.forEach(lawId => {
        const law = RESOLUTIONS.find(r => r.id === lawId);
        if (law && law.effect[type]) {
            mult *= law.effect[type];
        }
    });

    return mult;
}
