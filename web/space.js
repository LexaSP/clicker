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
    const types = PLANET_TYPES; // shorthand
    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        planets.push({
            id: `planet_${Date.now()}_${i}`,
            name: `${type.name} World ${i+1}`,
            type: type.name,
            icon: type.icon,
            resources: type.resources,
            colonized: false,
            terraformLevel: 0,
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

export function terraformPlanet(gameState, planetId) {
    const planet = gameState.space.planets.find(p => p.id === planetId);
    if (!planet || !planet.colonized) return { success: false, msg: "Must colonize first." };

    if (planet.terraformLevel >= 5) return { success: false, msg: "Max terraform level reached." };

    const cost = 5000 * Math.pow(2, planet.terraformLevel);
    if (gameState.resources.energy < cost) return { success: false, msg: `Need ${cost} Energy.` };

    gameState.resources.energy -= cost;
    planet.terraformLevel++;

    // Boost production
    planet.production.money = Math.floor(planet.production.money * 1.5);
    planet.production.knowledge = Math.floor(planet.production.knowledge * 1.5);

    return { success: true, msg: `Terraformed to Level ${planet.terraformLevel}!` };
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
