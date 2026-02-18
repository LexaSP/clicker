// religion.js

export const DOGMAS = [
    { id: "pacifism", name: "Pacifism", desc: "+20% Happiness (Multiplier)", cost: 100 },
    { id: "crusade", name: "Holy War", desc: "+30% Army Power", cost: 100 },
    { id: "tithing", name: "Tithing", desc: "+20% Money Gain", cost: 100 },
    { id: "scholasticism", name: "Scholasticism", desc: "+20% Knowledge Gain", cost: 100 }
];

export function getReligionState(gameState) {
    if (!gameState.religion) {
        gameState.religion = {
            founded: false,
            name: "",
            faith: 0,
            dogmas: []
        };
    }
    return gameState.religion;
}

export function foundReligion(gameState, name) {
    const rel = getReligionState(gameState);
    if (rel.founded) return { success: false, msg: "Already founded." };
    if (gameState.resources.culture < 1000) return { success: false, msg: "Need 1000 Culture." };

    gameState.resources.culture -= 1000;
    rel.founded = true;
    rel.name = name;
    return { success: true, msg: `Religion '${name}' founded!` };
}

export function adoptDogma(gameState, dogmaId) {
    const rel = getReligionState(gameState);
    if (!rel.founded) return { success: false, msg: "No religion founded." };

    if (rel.dogmas.includes(dogmaId)) return { success: false, msg: "Already adopted." };
    if (rel.dogmas.length >= 3) return { success: false, msg: "Max 3 Dogmas." };

    const dogma = DOGMAS.find(d => d.id === dogmaId);
    if (rel.faith < dogma.cost) return { success: false, msg: "Not enough Faith." };

    rel.faith -= dogma.cost;
    rel.dogmas.push(dogmaId);
    return { success: true, msg: `Dogma '${dogma.name}' adopted!` };
}

export function updateReligion(gameState, dt) {
    const rel = getReligionState(gameState);
    if (!rel.founded) return;

    // Passive Faith Gain based on culture
    // 1 Faith per 100 culture/sec?
    // Let's simplified: 1 Faith/sec base + multipliers
    rel.faith += 1 * dt;
}

export function getFaithMultiplier(gameState, type) {
    const rel = getReligionState(gameState);
    if (!rel.founded) return 1.0;

    let mult = 1.0;
    rel.dogmas.forEach(dId => {
        const d = DOGMAS.find(x => x.id === dId);
        if (dId === "pacifism" && type === "production") mult *= 1.2;
        if (dId === "crusade" && type === "army_power") mult *= 1.3;
        if (dId === "tithing" && type === "money") mult *= 1.2;
        if (dId === "scholasticism" && type === "knowledge") mult *= 1.2;
    });
    return mult;
}
