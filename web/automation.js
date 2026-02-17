// automation.js

export const GOVERNORS = [
    {
        id: "elder",
        name: "Tribal Elder",
        era: "Stone Age",
        cost: { food: 5000 }, // 10x cost
        type: "auto_click",
        rate: 1,
        desc: "Wisdom of the ancients. Clicks 1 time/sec.",
        icon: "👴"
    },
    {
        id: "scribe",
        name: "Royal Scribe",
        era: "Bronze Age",
        cost: { knowledge: 10000, money: 2500 }, // ~5x cost
        type: "auto_buy_building",
        interval: 30, // 30s interval
        desc: "Keeps records. Auto-buys cheap buildings every 30s.",
        icon: "📜"
    },
    {
        id: "merchant",
        name: "Merchant Prince",
        era: "Renaissance",
        cost: { money: 100000 }, // 10x cost
        type: "auto_buy_building",
        interval: 15,
        desc: "Master of coin. Auto-buys cheap buildings every 15s.",
        icon: "⚖️"
    },
    {
        id: "general",
        name: "Field Marshal",
        era: "Industrial Age",
        cost: { money: 500000, steel: 10000 }, // 10x cost
        type: "auto_click",
        rate: 5,
        desc: "Military discipline. Clicks 5 times/sec.",
        icon: "🎖️"
    },
    {
        id: "tycoon",
        name: "Industrial Tycoon",
        era: "Industrial Age",
        cost: { money: 1000000 }, // 10x cost
        type: "auto_buy_building",
        interval: 5,
        desc: "Mass production. Auto-buys cheap buildings every 5s.",
        icon: "🎩"
    },
    {
        id: "ai_core",
        name: "AI Governor",
        era: "Information Age",
        cost: { energy: 50000, money: 10000000 }, // 10x cost
        type: "auto_click",
        rate: 20,
        desc: "Quantum processing. Clicks 20 times/sec.",
        icon: "🤖"
    },
    {
        id: "hive_queen",
        name: "Hive Queen",
        era: "Future Age",
        cost: { food: 10000000, energy: 500000 }, // 10x cost
        type: "auto_buy_building",
        interval: 1,
        desc: "Swarm intelligence. Auto-buys cheap buildings every 1s.",
        icon: "👽"
    }
];

export function hireGovernor(gameState, id) {
    const gov = GOVERNORS.find(g => g.id === id);
    if (!gov) return { success: false, msg: "Governor not found." };

    if (gameState.governors && gameState.governors.some(g => g.id === id)) {
        return { success: false, msg: "Already hired." };
    }

    // Check cost
    for (let res in gov.cost) {
        if ((gameState.resources[res] || 0) < gov.cost[res]) {
            return { success: false, msg: `Not enough ${res}.` };
        }
    }

    // Pay
    for (let res in gov.cost) {
        gameState.resources[res] -= gov.cost[res];
    }

    if (!gameState.governors) gameState.governors = [];

    // Initialize state for the governor (e.g. timers)
    gameState.governors.push({
        id: id,
        active: true, // Default ON
        timer: 0
    });

    return { success: true, msg: `${gov.name} Hired!` };
}

export function toggleGovernor(gameState, id) {
    const gState = gameState.governors.find(g => g.id === id);
    if (gState) {
        gState.active = !gState.active;
        return gState.active;
    }
    return false;
}

export function processAutomation(gameState, dt, manualClickFn, buyBuildingFn) {
    if (!gameState.governors) return;

    gameState.governors.forEach(gState => {
        if (!gState.active) return; // Skip if disabled

        const govDef = GOVERNORS.find(g => g.id === gState.id);
        if (!govDef) return;

        if (govDef.type === "auto_click") {
            gState.timer += dt * govDef.rate;
            while (gState.timer >= 1) {
                manualClickFn(null);
                gState.timer -= 1;
            }
        } else if (govDef.type === "auto_buy_building") {
            gState.timer += dt;
            if (gState.timer >= govDef.interval) {
                gState.timer = 0;

                let cheapest = null;
                let minCost = Infinity;

                for (let key in gameState.buildings) {
                    const b = gameState.buildings[key];
                    if (b.cost < minCost) {
                        minCost = b.cost;
                        cheapest = key;
                    }
                }

                // Smart Threshold: Only buy if we have 10x the cost
                // prevents draining bank
                if (cheapest && gameState.resources.clicks >= minCost * 10) {
                    buyBuildingFn(cheapest);
                }
            }
        }
    });
}
