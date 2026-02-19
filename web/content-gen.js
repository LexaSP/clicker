// content-gen.js

// Helper for procedural generation
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// --- Icons ---
const RELIC_ICONS = ["🗿", "🏺", "🔮", "⚔️", "🛡️", "💍", "📜", "👑", "🏰", "🏛️", "💎", "🧿", "🗝️", "⚱️", "🖼️", "🗡️", "🏹", "⛏️", "🔭", "⚖️"];

// --- Relics ---
// Expanded Lists
const relicPrefixes = [
    "Ancient", "Lost", "Cursed", "Divine", "Broken", "Glowing", "Rusty", "Golden", "Crystal", "Shadow",
    "Ethereal", "Time-worn", "Forgotten", "Mystic", "Arcane", "Cosmic", "Primeval", "Void", "Solar", "Lunar",
    "Infernal", "Celestial", "Abyssal", "Radiant", "Spectral", "Runed", "Enchanted", "Holy", "Dark", "Faded",
    "Mythic", "Legendary", "Forbidden", "Sacred", "Haunted", "Blessed", "Frozen", "Burning", "Electric", "Magnetic"
];
const relicNames = [
    "Shard", "Totem", "Amulet", "Ring", "Tablet", "Coin", "Crown", "Scepter", "Orb", "Gem",
    "Fragment", "Idol", "Mask", "Chalice", "Dagger", "Scroll", "Key", "Mirror", "Compass", "Beacon",
    "Pendant", "Bracelet", "Gauntlet", "Helmet", "Shield", "Sword", "Statue", "Urn", "Cube", "Prism",
    "Tome", "Wand", "Staff", "Cloak", "Boots", "Belt", "Necklace", "Earring", "Brooch", "Medallion"
];
const relicSuffixes = [
    "of Power", "of Time", "of Greed", "of Wisdom", "of Speed", "of Shadows", "of Light", "of Fire", "of Ice", "of Earth",
    "of Storms", "of Chaos", "of Order", "of Dreams", "of Nightmares", "of the Ancients", "of the Stars", "of the Deep", "of the Sky", "of Eternity",
    "of Destiny", "of Fate", "of Life", "of Death", "of Hope", "of Despair", "of Truth", "of Lies", "of War", "of Peace",
    "of the Dragon", "of the Phoenix", "of the Wolf", "of the Bear", "of the Eagle", "of the Snake", "of the Lion", "of the Tiger", "of the Shark", "of the Whale"
];

export function generateRelics() {
    const relics = [];
    let idCounter = 1;
    // Generate combinations
    for (let p of relicPrefixes) {
        for (let n of relicNames) {
            for (let s of relicSuffixes) {
                if (relics.length >= 300) break; // Cap at 300
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
                    icon: randomChoice(RELIC_ICONS),
                    rarity: rarity,
                    effect: { type: effectType, value: effectValue }, // e.g. +5%
                    description: `A ${rarity.toLowerCase()} relic that grants +${effectValue}% ${effectType.replace('_', ' ')}.`
                });
            }
            if (relics.length >= 300) break;
        }
        if (relics.length >= 300) break;
    }
    return relics;
}

// --- Research ---
// 100+ Research nodes
const eras = ["Stone Age", "Bronze Age", "Iron Age", "Middle Ages", "Renaissance", "Industrial Age", "Modern Age", "Information Age", "Future Age", "Singularity"];
const eraIcons = {
    "Stone Age": "🪨", "Bronze Age": "⚔️", "Iron Age": "🔨", "Middle Ages": "🏰",
    "Renaissance": "🎨", "Industrial Age": "🏭", "Modern Age": "🏙️",
    "Information Age": "💻", "Future Age": "🚀", "Singularity": "🌌"
};

const TECH_NAMES = {
    "Stone Age": ["Fire Discovery", "Stone Tools", "Wheel", "Cave Painting", "Hunting Tactics", "Shelter Building", "Basic Language", "Tribal Hierarchy", "Gathering", "Pottery", "Spear Crafting", "Fur Clothing"],
    "Bronze Age": ["Bronze Smelting", "Agriculture", "Writing", "Trade Routes", "City States", "Irrigation", "Masonry", "Chariots", "Mathematics", "Astronomy", "Sailing", "Currency"],
    "Iron Age": ["Iron Forging", "Alphabet", "Democracy", "Philosophy", "Roads", "Aqueducts", "Legions", "Catapults", "Paper", "Compass", "Glassblowing", "Concrete"],
    "Middle Ages": ["Feudalism", "Castles", "Guilds", "Crop Rotation", "Windmills", "Heavy Plough", "Universities", "Alchemy", "Gunpowder", "Plate Armor", "Printing Press", "Banking"],
    "Renaissance": ["Humanism", "Perspective", "Heliocentrism", "Anatomy", "Telescope", "Microscope", "Mercantilism", "Clockwork", "Muskets", "Exploration", "Colonialism", "Scientific Method"],
    "Industrial Age": ["Steam Engine", "Textile Mills", "Railroads", "Telegraph", "Steel Production", "Vaccines", "Electricity", "Photography", "Internal Combustion", "Dynamite", "Assembly Line", "Radio"],
    "Modern Age": ["Flight", "Penicillin", "Plastics", "Nuclear Power", "Transistors", "Satellites", "DNA Structure", "Space Travel", "Internet", "Robotics", "Solar Power", "GPS"],
    "Information Age": ["Smartphones", "Social Media", "Cloud Computing", "AI", "Blockchain", "VR", "Quantum Computing", "Nanotech", "Biotech", "Renewable Energy", "Cybernetics", "Mars Colony"],
    "Future Age": ["Fusion Power", "Anti-Gravity", "Teleportation", "Terraforming", "Androids", "Dyson Sphere", "FTL Travel", "Genetic Eng.", "Mind Uploading", "Force Fields", "Time Travel", "Immortality"],
    "Singularity": ["Hive Mind", "Reality Warping", "Multiverse Theory", "Omniscience", "Matter Creation", "Energy Beings", "Universal Peace", "Cosmic Awareness", "Simulation Theory", "Ascension", "Big Bang 2.0", "The End"]
};

export function generateResearch() {
    console.log("Generating Research...");
    const research = [];

    eras.forEach((era, eraIndex) => {
        // SCALED: Generate ~20 techs per era (was 12)
        for (let i = 1; i <= 20; i++) {
            const techId = `tech_${eraIndex}_${i}`;

            // Name generation
            let name = `${era} Tech ${i}`;
            if (TECH_NAMES[era] && TECH_NAMES[era][i-1]) {
                name = TECH_NAMES[era][i-1];
            }

            // Flavor Text
            const flavor = `Unlocks new capabilities in the ${era}.`;

            // Dependencies
            let requirements = [];
            if (i > 1) {
                requirements.push(`tech_${eraIndex}_${i-1}`);
            } else if (eraIndex > 0) {
                requirements.push(`tech_${eraIndex-1}_20`);
            }

            // Base cost scales with Era (10x per era) and Tech level within era (1.2x per tech)
            const cost = Math.floor(100 * Math.pow(8, eraIndex) * Math.pow(1.25, i));

            // Assign type: Alternate
            const type = (i % 2 === 0) ? "culture" : "knowledge";

            research.push({
                id: techId,
                name: name,
                icon: eraIcons[era] || "🔬",
                era: era,
                cost: cost,
                costType: type,
                requirements: requirements,
                description: flavor,
                effect: { type: "production_multiplier", value: 1.2 }
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
const locationIcons = {
    "Forest": "🌲", "Cave": "🦇", "Mountain": "🏔️", "Desert": "🌵", "Ocean": "🌊",
    "Ruins": "🏛️", "Temple": "🕌", "Dungeon": "🕸️", "Castle": "🏰", "City": "🏙️",
    "Sky": "☁️", "Space": "🚀", "Dimension": "🌀", "Timeline": "⏳", "Void": "⚫"
};

export function generateExpeditions() {
    const expeditions = [];
    let idCounter = 1;

    locations.forEach(loc => {
        // Generate variations: Short, Medium, Long, Epic
        const types = [
            { name: "Short", duration: 1800, mult: 2.0 }, // 30 mins, High Reward
            { name: "Medium", duration: 14400, mult: 10.0 }, // 4 hours, Jackpot
            { name: "Long", duration: 43200, mult: 40.0 }, // 12 hours, Massive
            { name: "Epic", duration: 86400, mult: 100.0 } // 24 hours, Game Changing
        ];

        types.forEach(type => {
            let resourceType = "food";
            if (loc === "Forest") resourceType = "wood";
            if (loc === "Mountain" || loc === "Cave") resourceType = "stone";
            if (loc === "Desert") resourceType = "relicShards";

            // Risk: 10% to 75%, but Epic is always risky
            const risk = type.name === "Epic" ? randomInt(50, 90) : randomInt(10, 75);

            // Base reward scaled by duration * efficiency * risk bonus
            const riskBonus = 1 + (risk / 100) * 3;
            const baseAmount = 5000; // Base loot per 30 mins (Massive increase)
            const durationRatio = type.duration / 1800; // 1, 8, 24, 48 intervals

            const lootAmount = Math.floor(baseAmount * durationRatio * type.mult * riskBonus);

            expeditions.push({
                id: `exp_${idCounter++}`,
                name: `${type.name} Expedition to ${loc}`,
                icon: locationIcons[loc] || "🗺️",
                duration: type.duration,
                difficulty: `${risk}% Risk`,
                risk: risk,
                cost: { food: Math.floor(500 * durationRatio * type.mult) }, // Investment cost
                rewards: {
                    relics: (risk > 50 ? Math.floor(type.mult / 10) + 1 : (Math.random() < 0.3 ? 1 : 0)),
                    money: Math.floor(5000 * durationRatio * type.mult * riskBonus),
                    loot: { type: resourceType, amount: lootAmount }
                }
            });
        });
    });
    return expeditions;
}

// --- Recipes ---
export function generateRecipes() {
    return [
        { id: "craft_potion", name: "Health Potion", icon: "🧪", inputs: { herb: 2, water: 1 }, output: { potion: 1 } },
        { id: "craft_tool", name: "Stone Tool", icon: "🔨", inputs: { stone: 2, wood: 1 }, output: { tool: 1 } },
        { id: "craft_bronze", name: "Bronze Ingot", icon: "🧱", inputs: { copper: 1, tin: 1 }, output: { bronze: 1 } },
        { id: "craft_sword", name: "Iron Sword", icon: "⚔️", inputs: { iron: 2, wood: 1 }, output: { sword: 1 } },
        { id: "craft_crown", name: "Gold Crown", icon: "👑", inputs: { gold: 5 }, output: { crown: 1 } }
    ];
}
