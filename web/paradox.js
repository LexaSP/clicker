// paradox.js
// Paradoxes are triggered by excessive resource usage or specific choices in past eras.

export const PARADOXES = [
    {
        id: "deforestation",
        name: "Ecological Collapse",
        description: "Your ancestors over-harvested the forests. Wood is scarce.",
        icon: "🍂",
        trigger: (state) => state.stats.history && state.stats.history["Stone Age"] && state.stats.history["Stone Age"].woodGathered > 5000,
        effect: { type: "production_mult", resource: "wood", value: 0.5 } // 50% less wood
    },
    {
        id: "lost_knowledge",
        name: "Dark Age Legacy",
        description: "Knowledge was lost in the Middle Ages. Research is harder.",
        icon: "🕯️",
        trigger: (state) => state.stats.history && state.stats.history["Middle Ages"] && state.stats.history["Middle Ages"].knowledgeSpent < 1000,
        effect: { type: "cost_mult", resource: "knowledge", value: 1.5 } // 50% more expensive
    },
    {
        id: "cyber_plague",
        name: "Y2K Glitch",
        description: "Code from the Information Age is unstable. Automation is buggy.",
        icon: "👾",
        trigger: (state) => state.era === "Future Age" && state.buildings["AutoClicker"].count > 500,
        effect: { type: "production_mult", resource: "clicks", value: 0.8 } // 20% less production
    },
    {
        id: "genetic_drift",
        name: "Genetic Drift",
        description: "Over-reliance on food modification weakened the population.",
        icon: "🧬",
        trigger: (state) => state.stats.history && state.stats.history["Modern Age"] && state.stats.history["Modern Age"].foodConsumed > 100000,
        effect: { type: "production_mult", resource: "food", value: 0.7 }
    }
];

export function checkParadoxes(gameState) {
    if (!gameState.paradoxes) gameState.paradoxes = [];

    const newParadoxes = [];
    PARADOXES.forEach(p => {
        if (!gameState.paradoxes.includes(p.id)) {
            if (p.trigger(gameState)) {
                gameState.paradoxes.push(p.id);
                newParadoxes.push(p);
                console.log(`Paradox Triggered: ${p.name}`);
            }
        }
    });

    return newParadoxes;
}

export function getParadoxMultiplier(gameState, type, resource) {
    let mult = 1.0;
    if (!gameState.paradoxes) return mult;

    gameState.paradoxes.forEach(pid => {
        const p = PARADOXES.find(px => px.id === pid);
        if (p && p.effect.type === type && (!p.effect.resource || p.effect.resource === resource)) {
            mult *= p.effect.value;
        }
    });
    return mult;
}
