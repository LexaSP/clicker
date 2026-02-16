// wonders.js

export const WONDERS = [
    {
        id: "pyramids",
        name: "Great Pyramids",
        era: "Bronze Age",
        cost: { stone: 10000, food: 5000 },
        description: "A testament to immortality.",
        effect: { type: "production_mult", resource: "stone", value: 2.0 }, // Double Stone
        bonusText: "Double Stone Production",
        icon: "🔺"
    },
    {
        id: "hanging_gardens",
        name: "Hanging Gardens",
        era: "Iron Age",
        cost: { food: 20000, water: 5000, stone: 5000 }, // Water mapped to food usually, but let's stick to standard resources
        description: "A lush paradise in the desert.",
        effect: { type: "production_mult", resource: "food", value: 2.0 },
        bonusText: "Double Food Production",
        icon: "🌳"
    },
    {
        id: "great_wall",
        name: "Great Wall",
        era: "Iron Age",
        cost: { stone: 50000, food: 10000 },
        description: "A barrier against the barbarians.",
        effect: { type: "army_power", value: 1.5 }, // 50% Army Power
        bonusText: "+50% Army Power",
        icon: "🧱"
    },
    {
        id: "library_alexandria",
        name: "Library of Alexandria",
        era: "Iron Age",
        cost: { knowledge: 5000, stone: 10000 },
        description: "The sum of all human knowledge.",
        effect: { type: "production_mult", resource: "knowledge", value: 2.0 },
        bonusText: "Double Knowledge Gain",
        icon: "📚"
    },
    {
        id: "colosseum",
        name: "The Colosseum",
        era: "Middle Ages", // Rome is Iron, but let's push some to Mid for pacing
        cost: { stone: 100000, money: 5000 },
        description: "Bread and circuses for the masses.",
        effect: { type: "production_mult", resource: "culture", value: 2.0 },
        bonusText: "Double Culture",
        icon: "🏟️"
    },
    {
        id: "taj_mahal",
        name: "Taj Mahal",
        era: "Renaissance",
        cost: { stone: 200000, money: 20000 },
        description: "A teardrop on the cheek of eternity.",
        effect: { type: "production_mult", value: 1.5 }, // Generic production boost
        bonusText: "+50% Wonder Production (All Resources)",
        icon: "🕌"
    },
    {
        id: "eiffel_tower",
        name: "Eiffel Tower",
        era: "Industrial Age",
        cost: { steel: 5000, money: 50000 },
        description: "An icon of the industrial age.",
        effect: { type: "production_mult", resource: "culture", value: 3.0 },
        bonusText: "Triple Culture",
        icon: "🗼"
    },
    {
        id: "panama_canal",
        name: "Panama Canal",
        era: "Modern Age",
        cost: { money: 1000000, steel: 20000 },
        description: "Connecting the oceans.",
        effect: { type: "production_mult", resource: "money", value: 2.0 },
        bonusText: "Double Money Production",
        icon: "🚢"
    },
    {
        id: "moon_base",
        name: "Moon Base Alpha",
        era: "Information Age",
        cost: { money: 10000000, steel: 50000, energy: 10000 },
        description: "Our first foothold on another world.",
        effect: { type: "production_mult", resource: "knowledge", value: 5.0 },
        bonusText: "5x Knowledge Production",
        icon: "🌑"
    },
    {
        id: "dyson_sphere",
        name: "Dyson Sphere",
        era: "Future Age",
        cost: { steel: 1000000, energy: 500000, money: 1000000000 },
        description: "Harnessing the full power of a star.",
        effect: { type: "production_mult", resource: "energy", value: 100.0 },
        bonusText: "100x Energy Production",
        icon: "🌞"
    }
];

export function getWonderMultiplier(gameState, type, resource) {
    let mult = 1.0;
    if (!gameState.wonders) return mult;

    // Iterate built wonders
    gameState.wonders.forEach(wId => {
        const wonder = WONDERS.find(w => w.id === wId);
        if (wonder) {
            // Standard Match
            if (wonder.effect.type === type) {
                if (!wonder.effect.resource || wonder.effect.resource === resource) {
                    mult *= wonder.effect.value;
                }
            }

            // Special Case: Taj Mahal boosts ALL production_mult types regardless of resource
            if (wonder.id === "taj_mahal" && type === "production_mult") {
                mult *= 1.5; // Stacks with its own definition if effect type matches?
                // To avoid double counting, we rely on the specific check here.
                // Since we changed definition to generic production_mult without resource,
                // the standard match above handles "null" resource.
                // But for specific resources (e.g. "wood"), standard match fails (undefined != wood).
                // So this block ensures it applies to specific resources too.
            }
        }
    });
    return mult;
}

export function buildWonder(gameState, wonderId) {
    const wonder = WONDERS.find(w => w.id === wonderId);
    if (!wonder) return { success: false, msg: "Wonder not found." };

    // Check if already built
    if (gameState.wonders && gameState.wonders.includes(wonderId)) {
        return { success: false, msg: "Already constructed." };
    }

    // Check costs
    for (let res in wonder.cost) {
        if ((gameState.resources[res] || 0) < wonder.cost[res]) {
            return { success: false, msg: `Not enough ${res}.` };
        }
    }

    // Deduct
    for (let res in wonder.cost) {
        gameState.resources[res] -= wonder.cost[res];
    }

    if (!gameState.wonders) gameState.wonders = [];
    gameState.wonders.push(wonderId);

    return { success: true, msg: `${wonder.name} Constructed! ${wonder.bonusText}` };
}
