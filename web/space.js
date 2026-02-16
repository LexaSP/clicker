// space.js

const PLANET_TYPES = [
    { name: "Terran", icon: "🌍", resources: ["wood", "food", "water"], chance: 0.1 },
    { name: "Desert", icon: "🪐", resources: ["stone", "relicShards", "spice"], chance: 0.3 },
    { name: "Ice", icon: "❄️", resources: ["water", "crystal"], chance: 0.3 },
    { name: "Gas Giant", icon: "🌫️", resources: ["hydrogen", "helium"], chance: 0.2 },
    { name: "Volcanic", icon: "🌋", resources: ["obsidian", "metal"], chance: 0.1 }
];

export function generatePlanets(count = 5) {
    const planets = [];
    for (let i = 0; i < count; i++) {
        const type = PLANET_TYPES[Math.floor(Math.random() * PLANET_TYPES.length)];
        planets.push({
            id: `planet_${Date.now()}_${i}`,
            name: `${type.name} World ${i+1}`,
            type: type.name,
            icon: type.icon,
            resources: type.resources,
            colonized: false,
            cost: { money: 10000, knowledge: 5000, food: 2000 },
            production: { money: 100, knowledge: 50 } // Passive income
        });
    }
    return planets;
}

export function colonizePlanet(gameState, planetId) {
    const planet = gameState.space.planets.find(p => p.id === planetId);
    if (!planet || planet.colonized) return false;

    // Check cost
    for (let res in planet.cost) {
        if ((gameState.resources[res] || 0) < planet.cost[res]) return false;
    }

    // Pay
    for (let res in planet.cost) {
        gameState.resources[res] -= planet.cost[res];
    }

    planet.colonized = true;
    return true;
}

export function getSpaceProduction(gameState) {
    let prod = { money: 0, knowledge: 0 };
    if (!gameState.space || !gameState.space.planets) return prod;

    gameState.space.planets.forEach(p => {
        if (p.colonized) {
            prod.money += p.production.money;
            prod.knowledge += p.production.knowledge;
        }
    });
    return prod;
}
