// ascension.js

export const ASCENSION_TREE = [
    // Root
    {
        id: "legacy_start",
        name: "Legacy",
        desc: "Start new runs with 100 Clicks.",
        cost: 1,
        x: 400, y: 50,
        req: [],
        effect: { type: "start_resource", resource: "clicks", value: 100 }
    },

    // --- Power Branch (Left) ---
    {
        id: "warlord_1",
        name: "Warlord I",
        desc: "Start new runs with 5 Warriors.",
        cost: 5,
        x: 250, y: 150,
        req: ["legacy_start"],
        effect: { type: "start_unit", unit: "Warrior", value: 5 }
    },
    {
        id: "tyrant_1",
        name: "Tyrant",
        desc: "+50% Click Power permanently.",
        cost: 10,
        x: 150, y: 250,
        req: ["warlord_1"],
        effect: { type: "perm_mult", target: "click", value: 1.5 }
    },
    {
        id: "emperor",
        name: "Emperor",
        desc: "-20% Wonder Cost.",
        cost: 50,
        x: 250, y: 350,
        req: ["tyrant_1"],
        effect: { type: "cost_reduction", target: "wonder", value: 20 }
    },

    // --- Greed Branch (Center) ---
    {
        id: "merchant_1",
        name: "Merchant",
        desc: "Trade rates improved by 10%.",
        cost: 5,
        x: 400, y: 150,
        req: ["legacy_start"],
        effect: { type: "trade_boost", value: 1.1 }
    },
    {
        id: "tycoon_1",
        name: "Tycoon",
        desc: "Keep 1% of Money on Prestige reset.",
        cost: 25,
        x: 400, y: 250,
        req: ["merchant_1"],
        effect: { type: "keep_res", resource: "money", value: 0.01 }
    },
    {
        id: "banker",
        name: "Offshore Accounts",
        desc: "+10% Offline Production Efficiency.",
        cost: 50,
        x: 400, y: 350,
        req: ["tycoon_1"],
        effect: { type: "offline_boost", value: 1.1 }
    },

    // --- Wisdom Branch (Right) ---
    {
        id: "scholar_1",
        name: "Scholar",
        desc: "Start new runs with 500 Knowledge.",
        cost: 5,
        x: 550, y: 150,
        req: ["legacy_start"],
        effect: { type: "start_resource", resource: "knowledge", value: 500 }
    },
    {
        id: "visionary",
        name: "Visionary",
        desc: "-10% Tech Research Cost.",
        cost: 15,
        x: 650, y: 250,
        req: ["scholar_1"],
        effect: { type: "cost_reduction", target: "tech", value: 10 }
    },
    {
        id: "timelord",
        name: "Time Keeper",
        desc: "Prestige gain +20%.",
        cost: 100,
        x: 550, y: 350,
        req: ["visionary"],
        effect: { type: "prestige_gain", value: 1.2 }
    }
];

export function buyAscensionPerk(gameState, perkId) {
    const perk = ASCENSION_TREE.find(p => p.id === perkId);
    if (!perk) return { success: false, msg: "Perk not found." };

    // Check if owned
    if (!gameState.ascensionPerks) gameState.ascensionPerks = [];
    if (gameState.ascensionPerks.includes(perkId)) return { success: false, msg: "Already owned." };

    // Check requirements
    const reqMet = perk.req.every(r => gameState.ascensionPerks.includes(r));
    if (!reqMet) return { success: false, msg: "Prerequisites not met." };

    // Check cost
    if (gameState.resources.symbolsOfEra < perk.cost) return { success: false, msg: "Not enough Symbols of Era." };

    // Buy
    gameState.resources.symbolsOfEra -= perk.cost;
    gameState.ascensionPerks.push(perkId);
    return { success: true, msg: `${perk.name} Unlocked!` };
}

export function getAscensionMultiplier(gameState, type, target) {
    let mult = 1.0;
    // For additive bonuses, start at 0
    if (type === "cost_reduction") mult = 0.0;

    if (!gameState.ascensionPerks) return mult;

    gameState.ascensionPerks.forEach(pId => {
        const perk = ASCENSION_TREE.find(p => p.id === pId);
        // Target check: either perk has no target (global) OR targets match OR caller didn't specify target (global query)
        // Actually, if caller asks for "building" cost, we want perks with target="building" OR generic.
        // If perk has target="tech", we ignore.

        // Strict logic:
        // If perk has target, it MUST match the requested target.
        // If perk has NO target, it applies to everything (if type matches).

        if (perk && perk.effect.type === type) {
            const matchTarget = !perk.effect.target || (target && perk.effect.target === target);

            if (matchTarget) {
                if (type === "cost_reduction") mult += perk.effect.value;
                else mult *= perk.effect.value;
            }
        }
    });
    return mult;
}
