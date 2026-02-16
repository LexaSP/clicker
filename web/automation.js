// automation.js

export const GOVERNORS = [
    {
        id: "elder",
        name: "Tribal Elder",
        era: "Stone Age",
        cost: { food: 500 },
        type: "auto_click",
        rate: 1, // 1 click per second
        desc: "Wisdom of the ancients. Clicks 1 time/sec.",
        icon: "👴"
    },
    {
        id: "scribe",
        name: "Royal Scribe",
        era: "Bronze Age",
        cost: { knowledge: 2000, money: 500 },
        type: "auto_buy_building",
        interval: 10, // Buys every 10 seconds
        desc: "Keeps records. Buys cheapest building every 10s.",
        icon: "📜"
    },
    {
        id: "merchant",
        name: "Merchant Prince",
        era: "Renaissance",
        cost: { money: 10000 },
        type: "auto_buy_upgrade", // New type: research? Or just buildings faster? Let's stick to buildings for now.
        interval: 5,
        desc: "Master of coin. Buys cheapest building every 5s.",
        icon: "⚖️"
    },
    {
        id: "general",
        name: "Field Marshal",
        era: "Industrial Age",
        cost: { money: 50000, steel: 1000 },
        type: "auto_click",
        rate: 5,
        desc: "Military discipline. Clicks 5 times/sec.",
        icon: "🎖️"
    },
    {
        id: "tycoon",
        name: "Industrial Tycoon",
        era: "Industrial Age",
        cost: { money: 100000 },
        type: "auto_buy_building",
        interval: 2,
        desc: "Mass production. Buys cheapest building every 2s.",
        icon: "🎩"
    },
    {
        id: "ai_core",
        name: "AI Governor",
        era: "Information Age",
        cost: { energy: 5000, money: 1000000 },
        type: "auto_click",
        rate: 20,
        desc: "Quantum processing. Clicks 20 times/sec.",
        icon: "🤖"
    },
    {
        id: "hive_queen",
        name: "Hive Queen",
        era: "Future Age",
        cost: { food: 1000000, energy: 50000 },
        type: "auto_buy_building",
        interval: 0.5,
        desc: "Swarm intelligence. Buys cheapest building every 0.5s.",
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
        timer: 0
    });

    return { success: true, msg: `${gov.name} Hired!` };
}

export function processAutomation(gameState, dt, manualClickFn, buyBuildingFn) {
    if (!gameState.governors) return;

    gameState.governors.forEach(gState => {
        const govDef = GOVERNORS.find(g => g.id === gState.id);
        if (!govDef) return;

        if (govDef.type === "auto_click") {
            // Rate is clicks per second.
            // We can treat this as continuous production or discrete events.
            // Discrete events allow synergy with "manualClick" logic (crit, etc).
            // Continuous is better for performance.
            // User requested "Managers who click FOR you". implies discrete clicks.
            // To avoid lag, we accumulate 'clicks pending'.

            gState.timer += dt * govDef.rate;
            while (gState.timer >= 1) {
                manualClickFn(null); // Pass null event to indicate automated
                gState.timer -= 1;
            }
        } else if (govDef.type === "auto_buy_building") {
            gState.timer += dt;
            if (gState.timer >= govDef.interval) {
                gState.timer = 0;
                // Find cheapest building
                // We need access to the building list and costs.
                // Assuming buyBuildingFn handles "buy cheapest if argument is generic?"
                // Or we implement logic here.
                // We need to scan gameState.buildings

                let cheapest = null;
                let minCost = Infinity;

                for (let key in gameState.buildings) {
                    const b = gameState.buildings[key];
                    // We need current cost. It's stored in state now.
                    if (b.cost < minCost) {
                        minCost = b.cost;
                        cheapest = key;
                    }
                }

                if (cheapest && gameState.resources.clicks >= minCost) {
                    buyBuildingFn(cheapest);
                }
            }
        }
    });
}
