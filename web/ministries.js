// ministries.js

export const MINISTERS = [
    {
        id: "defense",
        title: "Minister of Defense",
        name: "General Ares",
        icon: "🛡️",
        desc: "Boosts Army Power. Unlocks Tactics.",
        effectType: "army_power",
        baseMult: 0.05, // +5% per level
        tactics: [
            { level: 5, name: "Conscription", desc: "-10% Unit Cost", type: "cost_reduction_unit", value: 10 },
            { level: 10, name: "Blitzkrieg", desc: "+20% Combat Win Chance", type: "combat_chance", value: 20 }
        ]
    },
    {
        id: "economy",
        title: "Minister of Economy",
        name: "Lord Coin",
        icon: "💰",
        desc: "Boosts Money Production.",
        effectType: "production_mult",
        resource: "money",
        baseMult: 0.05,
        tactics: [
            { level: 5, name: "Tax Haven", desc: "+10% Money", type: "production_mult_money", value: 1.1 },
            { level: 10, name: "Free Market", desc: "+20% Trade Efficiency", type: "trade_boost", value: 1.2 }
        ]
    },
    {
        id: "science",
        title: "Minister of Science",
        name: "Dr. Nexus",
        icon: "🔬",
        desc: "Boosts Knowledge Production.",
        effectType: "production_mult",
        resource: "knowledge",
        baseMult: 0.05,
        tactics: [
            { level: 5, name: "Grants", desc: "-5% Research Cost", type: "cost_reduction_tech", value: 5 },
            { level: 10, name: "Eureka", desc: "1% chance for instant tech on click", type: "eureka_chance", value: 1 }
        ]
    },
    {
        id: "culture",
        title: "Minister of Culture",
        name: "Lady Muse",
        icon: "🎨",
        desc: "Boosts Culture & Click Power.",
        effectType: "click_boost", // or culture
        baseMult: 0.05,
        tactics: [
            { level: 5, name: "Festivals", desc: "+10% Culture", type: "production_mult_culture", value: 1.1 },
            { level: 10, name: "Golden Age", desc: "+20% Symbols of Era on Reset", type: "prestige_gain", value: 1.2 }
        ]
    }
];

export function updateMinisters(gameState, dt) {
    if (!gameState.ministries) gameState.ministries = {};

    // Initialize if missing
    MINISTERS.forEach(m => {
        if (!gameState.ministries[m.id]) {
            gameState.ministries[m.id] = { xp: 0, level: 1, activeTactics: [] };
        }
    });

    // Passive XP Gain (1 XP per second * multipliers?)
    // Maybe actions give XP too, but for simplicity passive is good.
    const xpRate = 1;

    Object.keys(gameState.ministries).forEach(key => {
        const min = gameState.ministries[key];
        min.xp += xpRate * dt;

        // Level Up: Cost = 100 * 1.5^(L-1)
        const nextLevelCost = Math.floor(100 * Math.pow(1.5, min.level - 1));
        if (min.xp >= nextLevelCost) {
            min.xp -= nextLevelCost;
            min.level++;
            // Notify?
            // console.log(`${key} leveled up to ${min.level}`);
        }
    });
}

export function getMinistryMultiplier(gameState, type, resource) {
    let mult = 1.0;
    if (!gameState.ministries) return mult;

    MINISTERS.forEach(m => {
        const state = gameState.ministries[m.id];
        if (!state) return;

        // Base Effect (Level Scaling)
        if (m.effectType === type && (!m.resource || m.resource === resource)) {
            // e.g. Level 1 = 1.05, Level 10 = 1.5
            // Formula: 1 + (Level * Base)
            mult *= (1 + (state.level * m.baseMult));
        }

        // Tactics (Unlocked at levels)
        m.tactics.forEach(tac => {
            if (state.level >= tac.level) {
                // If tactic matches type
                // Note: Tactics have diverse types like 'cost_reduction_tech'
                // We need to map them or check strictly
                if (tac.type === type) {
                    mult *= tac.value; // simplistic
                }

                // Specific mappings
                if (type === "cost" && resource === "tech" && tac.type === "cost_reduction_tech") {
                    mult -= (tac.value / 100);
                }
                // etc.
            }
        });
    });
    return mult;
}
