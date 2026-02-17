// congress.js
// Global resolutions and voting

export const RESOLUTIONS = [
    { id: "world_peace", name: "Global Peace Treaty", desc: "Army Cost -50%, Happiness +20%", effect: { army_cost: 0.5, happiness: 1.2 } },
    { id: "science_funding", name: "International Science Fund", desc: "Knowledge +25%, Money -10%", effect: { knowledge_mult: 1.25, money_mult: 0.9 } },
    { id: "trade_embargo", name: "Trade Regulations", desc: "Money +20%, Production -10%", effect: { money_mult: 1.2, production_mult: 0.9 } },
    { id: "cultural_heritage", name: "Cultural Heritage Act", desc: "Culture +30%, Knowledge -10%", effect: { culture_mult: 1.3, knowledge_mult: 0.9 } },
    { id: "space_race", name: "Space Cooperation", desc: "Space Prod +50%, Earth Prod -10%", effect: { space_mult: 1.5, production_mult: 0.9 } }
];

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
    const res = RESOLUTIONS[Math.floor(Math.random() * RESOLUTIONS.length)];

    cong.activeResolution = res.id;
    cong.sessionActive = true;
    cong.timer = 60; // 60s to vote
    cong.playerVote = null;
    cong.votes = { yes: 0, no: 0 };

    // Notify
    // alert(`📢 WORLD CONGRESS IN SESSION!\nVoting on: ${res.name}`); // Maybe too intrusive?
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
