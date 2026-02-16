// government.js

export const GOVERNMENTS = [
    { id: "gov_tribal", name: "Tribal Council", era: "Stone Age", effect: { type: "production_mult", resource: "food", value: 1.2 }, desc: "+20% Food" },
    { id: "gov_monarchy", name: "Monarchy", era: "Bronze Age", effect: { type: "army_power", value: 1.2 }, desc: "+20% Army Power" },
    { id: "gov_republic", name: "Republic", era: "Iron Age", effect: { type: "production_mult", resource: "money", value: 1.2 }, desc: "+20% Money" },
    { id: "gov_theocracy", name: "Theocracy", era: "Middle Ages", effect: { type: "production_mult", resource: "culture", value: 1.3 }, desc: "+30% Culture" },
    { id: "gov_democracy", name: "Democracy", era: "Modern Age", effect: { type: "production_mult", resource: "knowledge", value: 1.3 }, desc: "+30% Knowledge" },
    { id: "gov_technocracy", name: "Technocracy", era: "Future Age", effect: { type: "production_mult", resource: "clicks", value: 1.5 }, desc: "+50% Production" }
];

export const POLICIES = [
    { id: "pol_conscription", name: "Conscription", cost: { culture: 100 }, effect: { type: "army_power", value: 1.1 }, desc: "+10% Army Power" },
    { id: "pol_education", name: "Public Education", cost: { money: 200 }, effect: { type: "production_mult", resource: "knowledge", value: 1.1 }, desc: "+10% Knowledge" },
    { id: "pol_sustainability", name: "Sustainability", cost: { knowledge: 300 }, effect: { type: "paradox_reduce", value: 0.5 }, desc: "Halves negative Paradox effects" },
    { id: "pol_trade", name: "Free Trade", cost: { culture: 150 }, effect: { type: "production_mult", resource: "money", value: 1.2 }, desc: "+20% Money" }
];

export function adoptGovernment(gameState, govId) {
    const gov = GOVERNMENTS.find(g => g.id === govId);
    if (!gov) return false;

    // Check Era requirement (simplified: must be at least that era or unlocked)
    // For now, allow if reached era.
    // Ideally we check if era index >= gov era index.

    // Cost?
    // Let's make switching cost 500 culture.
    if ((gameState.resources.culture || 0) < 500) return false;

    gameState.resources.culture -= 500;
    gameState.government.type = govId;
    return true;
}

export function togglePolicy(gameState, polId) {
    const pol = POLICIES.find(p => p.id === polId);
    if (!pol) return false;

    const isActive = gameState.government.policies.includes(polId);

    if (isActive) {
        // Remove
        gameState.government.policies = gameState.government.policies.filter(id => id !== polId);
        return "Removed";
    } else {
        // Add (Limit 3)
        if (gameState.government.policies.length >= 3) return false;

        // Check Cost (One time or Upkeep? Let's do One time for simplicity)
        for (let res in pol.cost) {
            if ((gameState.resources[res] || 0) < pol.cost[res]) return false;
        }

        // Pay
        for (let res in pol.cost) {
            gameState.resources[res] -= pol.cost[res];
        }

        gameState.government.policies.push(polId);
        return "Adopted";
    }
}

export function getGovernmentMultiplier(gameState, type, resource) {
    let mult = 1.0;
    if (!gameState.government) return mult;

    // Gov Type Effect
    const gov = GOVERNMENTS.find(g => g.id === gameState.government.type);
    if (gov && gov.effect.type === type && (!gov.effect.resource || gov.effect.resource === resource)) {
        mult *= gov.effect.value;
    }

    // Policies Effect
    gameState.government.policies.forEach(pid => {
        const pol = POLICIES.find(p => p.id === pid);
        if (pol && pol.effect.type === type && (!pol.effect.resource || pol.effect.resource === resource)) {
            mult *= pol.effect.value;
        }
    });

    return mult;
}
