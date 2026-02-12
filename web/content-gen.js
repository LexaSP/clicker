// content-gen.js

// Helper for procedural generation
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// --- Relics ---
// 200+ Relics
const relicPrefixes = ["Ancient", "Lost", "Cursed", "Divine", "Broken", "Glowing", "Rusty", "Golden", "Crystal", "Shadow", "Ethereal", "Time-worn", "Forgotten", "Mystic", "Arcane", "Cosmic", "Primeval", "Void", "Solar", "Lunar"];
const relicNames = ["Shard", "Totem", "Amulet", "Ring", "Tablet", "Coin", "Crown", "Scepter", "Orb", "Gem", "Fragment", "Idol", "Mask", "Chalice", "Dagger", "Scroll", "Key", "Mirror", "Compass", "Beacon"];
const relicSuffixes = ["of Power", "of Time", "of Greed", "of Wisdom", "of Speed", "of Shadows", "of Light", "of Fire", "of Ice", "of Earth", "of Storms", "of Chaos", "of Order", "of Dreams", "of Nightmares", "of the Ancients", "of the Stars", "of the Deep", "of the Sky", "of Eternity"];

export function generateRelics() {
    const relics = [];
    let idCounter = 1;
    // Generate combinations
    for (let p of relicPrefixes) {
        for (let n of relicNames) {
            for (let s of relicSuffixes) {
                if (relics.length >= 250) break; // Cap at 250 for now
                const name = `${p} ${n} ${s}`;
                const rarity = randomChoice(["Common", "Uncommon", "Rare", "Epic", "Legendary"]);

                // Effect generation
                let effectType = randomChoice(["click_boost", "production_boost", "cost_reduction", "crit_chance", "crit_damage"]);
                let effectValue = 0;

                switch(rarity) {
                    case "Common": effectValue = randomInt(1, 5); break;
                    case "Uncommon": effectValue = randomInt(5, 15); break;
                    case "Rare": effectValue = randomInt(15, 30); break;
                    case "Epic": effectValue = randomInt(30, 60); break;
                    case "Legendary": effectValue = randomInt(60, 100); break;
                }

                relics.push({
                    id: `relic_${idCounter++}`,
                    name: name,
                    rarity: rarity,
                    effect: { type: effectType, value: effectValue }, // e.g. +5%
                    description: `A ${rarity.toLowerCase()} relic that grants +${effectValue}% ${effectType.replace('_', ' ')}.`
                });
            }
            if (relics.length >= 250) break;
        }
        if (relics.length >= 250) break;
    }
    return relics;
}

// --- Research ---
// 100+ Research nodes
// We can simulate a tech tree with eras
const eras = ["Stone Age", "Bronze Age", "Iron Age", "Middle Ages", "Renaissance", "Industrial Age", "Modern Age", "Information Age", "Future Age", "Singularity"];

export function generateResearch() {
    const research = [];
    let idCounter = 1;

    eras.forEach((era, eraIndex) => {
        // Generate ~10 techs per era
        for (let i = 1; i <= 12; i++) {
            const techId = `tech_${eraIndex}_${i}`;
            const name = `${era} Tech ${i}`; // Placeholder names for now, could use a list

            // Dependencies: Previous tech in same era, or last tech of previous era
            let requirements = [];
            if (i > 1) {
                requirements.push(`tech_${eraIndex}_${i-1}`);
            } else if (eraIndex > 0) {
                requirements.push(`tech_${eraIndex-1}_12`);
            }

            const cost = Math.floor(100 * Math.pow(1.5, (eraIndex * 12 + i)));

            research.push({
                id: techId,
                name: name,
                era: era,
                cost: cost,
                requirements: requirements,
                effect: { type: "production_multiplier", value: 1.2 } // 20% boost per tech
            });
        }
    });
    return research;
}

// --- Ideas ---
// 300+ Ideas
const ideaVerbs = ["Study", "Analyze", "Synthesize", "Experiment", "Theorize", "Observe", "Calculate", "Simulate", "Explore", "Invent"];
const ideaNouns = ["Nature", "Physics", "Chemistry", "Biology", "Society", "Economics", "Philosophy", "Art", "Music", "History", "Math", "Logic", "Space", "Time", "Matter", "Energy", "Life", "Mind", "Soul", "Void"];
const ideaModifiers = ["Basic", "Advanced", "Complex", "Abstract", "Applied", "Theoretical", "Quantum", "Meta", "Hyper", "Neo"];

export function generateIdeas() {
    const ideas = [];
    let idCounter = 1;

    for (let v of ideaVerbs) {
        for (let n of ideaNouns) {
            for (let m of ideaModifiers) {
                if (ideas.length >= 350) break;
                const name = `${m} ${v} of ${n}`;
                ideas.push({
                    id: `idea_${idCounter++}`,
                    name: name,
                    cost: { knowledge: randomInt(10, 1000) }, // Uses 'knowledge' resource
                    effect: { type: "inspiration_boost", value: randomInt(1, 10) }
                });
            }
             if (ideas.length >= 350) break;
        }
         if (ideas.length >= 350) break;
    }
    return ideas;
}

// --- Expeditions ---
// 50+ Expeditions
const locations = ["Forest", "Cave", "Mountain", "Desert", "Ocean", "Ruins", "Temple", "Dungeon", "Castle", "City", "Sky", "Space", "Dimension", "Timeline", "Void"];
const diffs = ["Easy", "Medium", "Hard", "Expert", "Nightmare"];

export function generateExpeditions() {
    const expeditions = [];
    let idCounter = 1;

    locations.forEach(loc => {
        diffs.forEach(diff => {
            expeditions.push({
                id: `exp_${idCounter++}`,
                name: `${diff} Expedition to ${loc}`,
                duration: randomInt(10, 300), // seconds
                difficulty: diff,
                cost: { food: randomInt(100, 5000) },
                rewards: { relics: randomInt(0, 1), resources: randomInt(1000, 100000) }
            });
        });
    });
    return expeditions;
}

// --- Recipes ---
export function generateRecipes() {
    return [
        { id: "craft_potion", name: "Health Potion", inputs: { herb: 2, water: 1 }, output: { potion: 1 } },
        { id: "craft_tool", name: "Stone Tool", inputs: { stone: 2, wood: 1 }, output: { tool: 1 } },
        { id: "craft_bronze", name: "Bronze Ingot", inputs: { copper: 1, tin: 1 }, output: { bronze: 1 } },
        // ... add more as needed
    ];
}
