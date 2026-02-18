// dynasty.js
// Manage rulers, heirs, and traits

export const RULER_TRAITS = [
    { id: "charismatic", name: "Charismatic", desc: "+10% Culture Gain", type: "culture_mult", value: 1.10 },
    { id: "militarist", name: "Militarist", desc: "+20% Army Power", type: "army_mult", value: 1.20 },
    { id: "industrialist", name: "Industrialist", desc: "+10% Production", type: "production_mult", value: 1.10 },
    { id: "scientist", name: "Scientist", desc: "+15% Knowledge Gain", type: "knowledge_mult", value: 1.15 },
    { id: "greedy", name: "Greedy", desc: "+20% Money Gain", type: "money_mult", value: 1.20 },
    { id: "architect", name: "Architect", desc: "-10% Building Cost", type: "cost_mult", value: 0.90 },
    { id: "diplomat", name: "Diplomat", desc: "+15% Diplomatic Relations", type: "diplo_mult", value: 1.15 },
    { id: "tyrant", name: "Tyrant", desc: "+50% Army Power, -20% Happiness", type: "mixed", effect: (state) => { return { army: 1.5, happiness: 0.8 }; } }
];

export const DYNASTY_NAMES = [
    "Caesar", "Napoleon", "Khan", "Windsor", "Medici", "Tokugawa", "Washington", "Ramses", "Alexander", "Charlemagne"
];

export function generateRuler(era) {
    const name = DYNASTY_NAMES[Math.floor(Math.random() * DYNASTY_NAMES.length)];
    // 1-2 traits
    const traits = [];
    const count = 1 + (Math.random() > 0.7 ? 1 : 0);

    for (let i = 0; i < count; i++) {
        const trait = RULER_TRAITS[Math.floor(Math.random() * RULER_TRAITS.length)];
        if (!traits.find(t => t.id === trait.id)) {
            traits.push(trait);
        }
    }

    // Age 18-40
    const age = 18 + Math.floor(Math.random() * 22);

    return {
        name: `${name} ${romanize(Math.floor(Math.random() * 10) + 1)}`,
        age: age,
        maxAge: 60 + Math.floor(Math.random() * 30), // Dies between 60-90
        traits: traits,
        reignStart: Date.now()
    };
}

function romanize(num) {
    // Simple 1-10
    const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    return roman[num] || num;
}

export function updateDynasty(state, dt) {
    if (!state.dynasty) {
        state.dynasty = {
            currentRuler: generateRuler(state.era),
            heir: generateRuler(state.era),
            history: []
        };
        // Heir is usually younger
        state.dynasty.heir.age = Math.max(0, state.dynasty.currentRuler.age - 20);
    }

    const ruler = state.dynasty.currentRuler;

    // Age ruler (1 year per minute? or per tick?)
    // Let's say 1 year = 60 seconds.
    ruler.age += dt / 60;

    // Check death
    if (ruler.age >= ruler.maxAge) {
        succession(state);
    }
}

export function succession(state) {
    const oldRuler = state.dynasty.currentRuler;
    state.dynasty.history.push(oldRuler);

    // Heir takes over
    state.dynasty.currentRuler = state.dynasty.heir;
    state.dynasty.currentRuler.reignStart = Date.now();
    state.dynasty.currentRuler.age = Math.max(18, state.dynasty.currentRuler.age); // Minimum age to rule

    // Generate new heir
    state.dynasty.heir = generateRuler(state.era);
    state.dynasty.heir.age = 0; // Newborn

    return { old: oldRuler, new: state.dynasty.currentRuler };
}

export function getDynastyMultiplier(state, type) {
    let mult = 1.0;
    if (!state.dynasty || !state.dynasty.currentRuler) return mult;

    state.dynasty.currentRuler.traits.forEach(t => {
        if (t.type === `${type}_mult`) {
            mult *= t.value;
        }
        // Handle mixed/special types elsewhere or map them
    });

    return mult;
}
