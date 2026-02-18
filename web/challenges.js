// challenges.js

export const CHALLENGES = [
    {
        id: "speedrun",
        name: "Speedrun: Future Rush",
        description: "Reach the Future Age in under 2 hours.",
        conditionDesc: "No restrictions.",
        goal: (state) => state.era === "Future Age",
        reward: { name: "Time Warp", desc: "+10% Production Speed", type: "production_mult", value: 1.1 }
    },
    {
        id: "pacifist",
        name: "Pacifist Run",
        description: "Reach the Information Age without training any military units.",
        conditionDesc: "Cannot train Units.",
        constraints: { noWar: true },
        goal: (state) => state.era === "Information Age",
        reward: { name: "Dove of Peace", desc: "+20% Culture & Knowledge", type: "peace_bonus", value: 1.2 }
    },
    {
        id: "one_city",
        name: "One City Challenge",
        description: "Reach the Modern Age with only 1 of each building type.",
        conditionDesc: "Max 1 of each building.",
        constraints: { maxBuildings: 1 },
        goal: (state) => state.era === "Modern Age",
        reward: { name: "Urban Planning", desc: "-10% Building Costs", type: "cost_reduction", value: 10 }
    },
    {
        id: "lazy_leader",
        name: "Lazy Leader",
        description: "Reach the Industrial Age with 0 manual clicks.",
        conditionDesc: "Manual Clicking Disabled.",
        constraints: { noManualClicks: true },
        goal: (state) => state.era === "Industrial Age",
        reward: { name: "Automation Tech", desc: "+25% Passive Production", type: "production_mult", value: 1.25 }
    },
    {
        id: "austere",
        name: "Age of Austerity",
        description: "Reach the Renaissance without buying any upgrades/techs (only buildings allowed).",
        conditionDesc: "Research Disabled.",
        constraints: { noResearch: true },
        goal: (state) => state.era === "Renaissance",
        reward: { name: "Minimalism", desc: "+50% Resource Cap / Efficiency", type: "production_mult", value: 1.5 }
    }
];

export function getWeeklyChallenge() {
    // Generate based on current week number
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const day = Math.floor(diff / oneDay);
    const week = Math.floor(day / 7);

    // Seeded Random
    const seed = week + now.getFullYear();
    const pseudoRandom = (x) => { return ((x * 9301 + 49297) % 233280) / 233280; };
    const rand = pseudoRandom(seed);

    // Pick base challenge and add modifier
    const base = CHALLENGES[Math.floor(rand * CHALLENGES.length)];

    return {
        id: `weekly_${week}_${now.getFullYear()}`,
        name: `Weekly Challenge #${week}: ${base.name} EX`,
        description: `WEEKLY EVENT: ${base.description} (Harder Difficulty)`,
        conditionDesc: `${base.conditionDesc} + 50% Higher Costs`,
        constraints: base.constraints,
        goal: base.goal,
        reward: { name: "Weekly Trophy", desc: "+100% Production for 7 Days", type: "production_mult", value: 2.0 },
        isWeekly: true
    };
}

export function getChallengeRewardMult(gameState, type) {
    let mult = 1.0;
    if (!gameState.completedChallenges) return mult;

    gameState.completedChallenges.forEach(cId => {
        let chal = CHALLENGES.find(c => c.id === cId);

        // Check if it's a weekly one stored
        if (!chal && cId.startsWith("weekly_")) {
            // Reconstruct logic? Or assume we store reward data.
            // For simplicity, if we completed a weekly, we just give a generic bonus if we can't find it.
            // Or better, we assume the reward logic is generic.
            chal = { reward: { type: "production_mult", value: 1.05 } }; // Small perma bonus for weekly
        }

        if (chal && chal.reward.type === type) {
            if (type === "production_mult") mult *= chal.reward.value;
            // Add other types as needed
        }

        if (type === "peace_bonus" && chal && chal.reward.type === "peace_bonus") {
             // Logic handled elsewhere for specific resources?
             // Or maybe we map peace_bonus to production_mult internally for culture/knowl
        }
    });
    return mult;
}

export function checkChallengeVictory(gameState) {
    if (!gameState.activeChallenge) return null;

    let chal = CHALLENGES.find(c => c.id === gameState.activeChallenge);
    // Check Weekly
    if (!chal && gameState.activeChallenge.startsWith("weekly_")) {
        chal = getWeeklyChallenge(); // Re-generate to check goal
        if (gameState.activeChallenge !== chal.id) chal = null; // Stale weekly?
    }

    if (!chal) return null;

    if (chal.goal(gameState)) {
        return chal;
    }
    return null;
}
