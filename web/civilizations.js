// civilizations.js

export const CIVILIZATIONS = {
    "Bronze Age": [
        {
            id: "egypt", name: "Egypt", icon: "🇪🇬",
            pros: ["Great Monument Building"], cons: ["Slow Expansion"],
            effect: { type: "production_mult", resource: "stone", value: 1.5 },
            unique_reward: { type: "relic", name: "The Pyramids", icon: "🔺", desc: "+50% Culture Gain", effect: { type: "production_mult", resource: "culture", value: 1.5 } }
        },
        {
            id: "sumer", name: "Sumeria", icon: "🇮🇶",
            pros: ["Early Science Boost"], cons: ["Weak Military"],
            effect: { type: "production_mult", resource: "knowledge", value: 1.2 },
            unique_reward: { type: "relic", name: "Clay Tablets", icon: "🧱", desc: "+20% Knowledge", effect: { type: "production_mult", resource: "knowledge", value: 1.2 } }
        },
        {
            id: "indus", name: "Indus Valley", icon: "🇮🇳",
            pros: ["Efficient Cities"], cons: ["Resource Dependent"],
            effect: { type: "production_mult", resource: "food", value: 1.3 },
            unique_reward: { type: "building", name: "Farm", count: 5 } // Start with 5 Farms
        },
        {
            id: "babylon", name: "Babylon", icon: "🦁",
            pros: ["Code of Law", "Scientific Growth"], cons: ["Surrounded by Enemies"],
            effect: { type: "production_mult", resource: "knowledge", value: 1.3 },
            unique_reward: { type: "relic", name: "Code of Hammurabi", icon: "📜", desc: "-10% Building Cost", effect: { type: "cost_reduction", value: 10 } }
        },
        {
            id: "hittites", name: "Hittites", icon: "⚔️",
            pros: ["Iron Weapons", "Chariot Warfare"], cons: ["Political Instability"],
            effect: { type: "army_power", value: 1.2 },
            unique_reward: { type: "resource", name: "Iron Cache", resource: "iron", amount: 100 } // Early Iron
        }
    ],
    "Iron Age": [
        {
            id: "rome", name: "Rome", icon: "🇮🇹",
            pros: ["Unstoppable Legions"], cons: ["High Maintenance Cost"],
            effect: { type: "army_power", value: 1.3 },
            unique_reward: { type: "relic", name: "The Colosseum", icon: "🏟️", desc: "+20% Army Power", effect: { type: "army_power", value: 1.2 } }
        },
        {
            id: "greece", name: "Greece", icon: "🇬🇷",
            pros: ["Cultural Hub"], cons: ["Internal Conflict"],
            effect: { type: "production_mult", resource: "culture", value: 1.3 },
            unique_reward: { type: "relic", name: "Parthenon Marble", icon: "🏛️", desc: "+30% Culture", effect: { type: "production_mult", resource: "culture", value: 1.3 } }
        },
        {
            id: "persia", name: "Persia", icon: "🇮🇷",
            pros: ["Wealth of Nations"], cons: ["Overextended Empire"],
            effect: { type: "production_mult", resource: "money", value: 1.3 },
            unique_reward: { type: "relic", name: "Royal Road", icon: "🛣️", desc: "+20% Money", effect: { type: "production_mult", resource: "money", value: 1.2 } }
        },
        {
            id: "carthage", name: "Carthage", icon: "🐘",
            pros: ["Maritime Trade Empire"], cons: ["Mercenary Reliance"],
            effect: { type: "production_mult", resource: "money", value: 1.4 },
            unique_reward: { type: "resource", name: "Mercenary Gold", resource: "money", amount: 5000 }
        },
        {
            id: "qin", name: "Qin Dynasty", icon: "🇨🇳",
            pros: ["Imperial Unification", "Bureaucracy"], cons: ["Strict Legalism"],
            effect: { type: "production_mult", resource: "production", value: 1.2 },
            unique_reward: { type: "relic", name: "Terracotta Army", icon: "🗿", desc: "+10% Production", effect: { type: "production_mult", resource: "clicks", value: 1.1 } }
        }
    ],
    "Middle Ages": [
        {
            id: "england", name: "England", icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
            pros: ["Strong Defense", "Longbowmen"], cons: ["Island Isolation"],
            effect: { type: "production_mult", resource: "wood", value: 1.4 },
            unique_reward: { type: "relic", name: "Magna Carta", icon: "📜", desc: "+10% All Production", effect: { type: "production_mult", resource: "clicks", value: 1.1 } }
        },
        {
            id: "arabia", name: "Caliphate", icon: "🇸🇦",
            pros: ["Scientific Golden Age"], cons: ["Religious Tensions"],
            effect: { type: "production_mult", resource: "knowledge", value: 1.4 },
            unique_reward: { type: "building", name: "University", count: 1 } // Early University
        },
        {
            id: "mongol", name: "Mongols", icon: "🇲🇳",
            pros: ["Terrifying Army", "Rapid Conquest"], cons: ["No Infrastructure"],
            effect: { type: "army_power", value: 1.5 },
            unique_reward: { type: "resource", name: "Plunder", resource: "money", amount: 10000 }
        },
        {
            id: "byzantium", name: "Byzantium", icon: "🏛️",
            pros: ["Theodosian Walls", "Silk Road Wealth"], cons: ["Constant Wars"],
            effect: { type: "production_mult", resource: "money", value: 1.4 },
            unique_reward: { type: "relic", name: "Greek Fire", icon: "🔥", desc: "+25% Army Power", effect: { type: "army_power", value: 1.25 } }
        },
        {
            id: "vikings", name: "Vikings", icon: "🛶",
            pros: ["Raiding Economy", "Naval Mastery"], cons: ["Diplomatic Isolation"],
            effect: { type: "production_mult", resource: "money", value: 1.3 },
            unique_reward: { type: "resource", name: "Raid Loot", resource: "wood", amount: 5000 }
        }
    ],
    "Renaissance": [
        {
            id: "spain", name: "Spain", icon: "🇪🇸",
            pros: ["Colonial Wealth", "Exploration"], cons: ["Inflation Risk"],
            effect: { type: "production_mult", resource: "money", value: 1.5 },
            unique_reward: { type: "relic", name: "Treasure Fleet", icon: "🚢", desc: "+50% Money", effect: { type: "production_mult", resource: "money", value: 1.5 } }
        },
        {
            id: "ottoman", name: "Ottoman Empire", icon: "🇹🇷",
            pros: ["Janissary Corps", "Crossroads of World"], cons: ["Succession Crisis"],
            effect: { type: "army_power", value: 1.4 },
            unique_reward: { type: "relic", name: "Great Bombard", icon: "💣", desc: "+30% Army Power", effect: { type: "army_power", value: 1.3 } }
        },
        {
            id: "china", name: "Ming Dynasty", icon: "🇨🇳",
            pros: ["Great Wall Construction", "Tribute System"], cons: ["Isolationism"],
            effect: { type: "production_mult", resource: "stone", value: 1.5 },
            unique_reward: { type: "relic", name: "Porcelain Trade", icon: "🏺", desc: "+30% Money", effect: { type: "production_mult", resource: "money", value: 1.3 } }
        },
        {
            id: "dutch", name: "Dutch Republic", icon: "🇳🇱",
            pros: ["Stock Market Pioneers", "Global Trade"], cons: ["Small Population"],
            effect: { type: "production_mult", resource: "money", value: 1.5 },
            unique_reward: { type: "building", name: "Bank", count: 3 } // Start with Banks
        },
        {
            id: "russia_tsar", name: "Tsardom of Russia", icon: "🇷🇺",
            pros: ["Endless Expansion", "Siberian Resources"], cons: ["Serfdom Economy"], // Hidden Buff
            effect: { type: "production_mult", resource: "wood", value: 2.0 },
            unique_reward: { type: "relic", name: "Fur Trade", icon: "🧥", desc: "+50% Wood", effect: { type: "production_mult", resource: "wood", value: 1.5 } }
        }
    ],
    "Industrial Age": [
        {
            id: "uk", name: "British Empire", icon: "🇬🇧",
            pros: ["Workshop of the World", "Global Hegemony"], cons: ["Colonial Unrest"],
            effect: { type: "production_mult", resource: "money", value: 1.5 },
            unique_reward: { type: "relic", name: "Royal Navy", icon: "⚓", desc: "+40% Money", effect: { type: "production_mult", resource: "money", value: 1.4 } }
        },
        {
            id: "germany", name: "Germany", icon: "🇩🇪",
            pros: ["Precision Engineering", "Chemical Industry"], cons: ["Resource Scarcity"],
            effect: { type: "production_mult", resource: "production", value: 1.2 },
            unique_reward: { type: "building", name: "Factory", count: 2 }
        },
        {
            id: "russia", name: "Russian Empire", icon: "🇷🇺",
            pros: ["Vast Landmass", "Unmatched Industrial Power"], cons: ["Slow Modernization"],
            effect: { type: "production_mult", resource: "production", value: 2.5 },
            unique_reward: { type: "relic", name: "Trans-Siberian Railway", icon: "🚂", desc: "+100% Production", effect: { type: "production_mult", resource: "clicks", value: 2.0 } }
        },
        {
            id: "france", name: "France", icon: "🇫🇷",
            pros: ["Cultural Prestige", "Belle Époque"], cons: ["Political Instability"],
            effect: { type: "production_mult", resource: "culture", value: 1.5 },
            unique_reward: { type: "relic", name: "Eiffel Tower", icon: "🗼", desc: "+50% Culture", effect: { type: "production_mult", resource: "culture", value: 1.5 } }
        },
        {
            id: "usa_ind", name: "United States", icon: "🇺🇸",
            pros: ["Gilded Age Industry", "Immigrant Workforce"], cons: ["Civil Unrest"],
            effect: { type: "production_mult", resource: "production", value: 1.3 },
            unique_reward: { type: "relic", name: "Standard Oil", icon: "🛢️", desc: "+200% Oil Production", effect: { type: "production_mult", resource: "oil", value: 3.0 } }
        }
    ],
    "Modern Age": [
        {
            id: "usa", name: "Superpower USA", icon: "🇺🇸",
            pros: ["Global Dominance", "Cultural Export"], cons: ["Military Overspending"],
            effect: { type: "production_mult", resource: "money", value: 1.2 },
            unique_reward: { type: "relic", name: "The Internet", icon: "🌐", desc: "+50% Knowledge", effect: { type: "production_mult", resource: "knowledge", value: 1.5 } }
        },
        {
            id: "ussr", name: "USSR", icon: "☭",
            pros: ["Rapid Industrialization", "Space Race Leader"], cons: ["Bureaucratic Inefficiency"],
            effect: { type: "production_mult", resource: "production", value: 2.5 },
            unique_reward: { type: "relic", name: "Sputnik", icon: "🛰️", desc: "+100% Knowledge", effect: { type: "production_mult", resource: "knowledge", value: 2.0 } }
        },
        {
            id: "japan", name: "Japan", icon: "🇯🇵",
            pros: ["Tech Innovation", "Economic Miracle"], cons: ["Aging Population"],
            effect: { type: "production_mult", resource: "knowledge", value: 1.5 },
            unique_reward: { type: "relic", name: "Bullet Train", icon: "🚄", desc: "+20% Production", effect: { type: "production_mult", resource: "clicks", value: 1.2 } }
        },
        {
            id: "china_prc", name: "PRC", icon: "🇨🇳",
            pros: ["Massive Workforce", "Infrastructure Boom"], cons: ["Early Isolation"],
            effect: { type: "production_mult", resource: "production", value: 1.4 },
            unique_reward: { type: "building", name: "Factory", count: 10 } // Industrial Giant
        },
        {
            id: "eu", name: "European Union", icon: "🇪🇺",
            pros: ["Economic Integration", "Soft Power"], cons: ["Complex Bureaucracy"],
            effect: { type: "production_mult", resource: "culture", value: 1.6 },
            unique_reward: { type: "relic", name: "Single Market", icon: "💶", desc: "+30% Money", effect: { type: "production_mult", resource: "money", value: 1.3 } }
        }
    ],
    // ... Future Eras follow same pattern (Skipped for brevity, can implement if requested, but logic is established)
    "Information Age": [
        {
            id: "silicon", name: "Silicon Valley", icon: "💻",
            pros: ["Digital Revolution", "Venture Capital"], cons: ["Privacy Erosion"],
            effect: { type: "production_mult", resource: "clicks", value: 1.5 },
            unique_reward: { type: "building", name: "Supercomputer", count: 1 }
        },
        {
            id: "shenzhen", name: "Shenzhen", icon: "🏭",
            pros: ["Hardware Capital", "Supply Chain Speed"], cons: ["Environmental Cost"],
            effect: { type: "production_mult", resource: "production", value: 1.5 },
            unique_reward: { type: "resource", name: "Rare Earths", resource: "money", amount: 100000 }
        },
        {
            id: "nordic", name: "Nordic Model", icon: "❄️",
            pros: ["Social Stability", "Green Energy"], cons: ["High Taxation"],
            effect: { type: "production_mult", resource: "culture", value: 1.5 },
            unique_reward: { type: "relic", name: "Wind Farms", icon: "🌬️", desc: "+50% Energy", effect: { type: "production_mult", resource: "energy", value: 1.5 } }
        },
        {
            id: "tigers", name: "Asian Tigers", icon: "🐅",
            pros: ["Financial Hubs", "Rapid Growth"], cons: ["Market Volatility"],
            effect: { type: "production_mult", resource: "money", value: 1.6 },
            unique_reward: { type: "building", name: "Bank", count: 10 }
        },
        {
            id: "cyber", name: "Cyber-State", icon: "🌐",
            pros: ["E-Governance", "Digital Citizenship"], cons: ["Cyber Warfare Risk"],
            effect: { type: "production_mult", resource: "knowledge", value: 1.6 },
            unique_reward: { type: "relic", name: "Blockchain", icon: "🔗", desc: "+20% All Production", effect: { type: "production_mult", resource: "clicks", value: 1.2 } }
        }
    ],
    "Future Age": [
        {
            id: "utopia", name: "Global Utopia", icon: "🌍",
            pros: ["Post-Scarcity Economy", "World Peace"], cons: ["Cultural Homogeneity"],
            effect: { type: "production_mult", resource: "food", value: 2.0 },
            unique_reward: { type: "relic", name: "Replicator", icon: "🥪", desc: "+Infinite Food", effect: { type: "production_mult", resource: "food", value: 10.0 } }
        },
        {
            id: "corp", name: "MegaCorp", icon: "🏢",
            pros: ["Efficiency Maximization", "Interstellar Trade"], cons: ["Corporate Feudalism"],
            effect: { type: "production_mult", resource: "money", value: 2.0 },
            unique_reward: { type: "building", name: "FusionReactor", count: 5 }
        },
        {
            id: "techno", name: "Technate", icon: "🤖",
            pros: ["AI Governance", "Singularity"], cons: ["Loss of Agency"],
            effect: { type: "production_mult", resource: "knowledge", value: 2.0 },
            unique_reward: { type: "relic", name: "The Singularity", icon: "👁️", desc: "+500% Knowledge", effect: { type: "production_mult", resource: "knowledge", value: 5.0 } }
        },
        {
            id: "mars", name: "Martian Federation", icon: "🔴",
            pros: ["New Frontier", "Terraforming Tech"], cons: ["Life Support Dependence"],
            effect: { type: "production_mult", resource: "stone", value: 2.0 },
            unique_reward: { type: "resource", name: "Helium-3", resource: "energy", amount: 1000000 }
        },
        {
            id: "hive", name: "AI Collective", icon: "🧠",
            pros: ["Instant Calculation", "Unified Purpose"], cons: ["Zero Individuality"],
            effect: { type: "production_mult", resource: "clicks", value: 2.0 },
            unique_reward: { type: "relic", name: "Quantum Mind", icon: "⚛️", desc: "+300% Click Power", effect: { type: "click_boost", value: 300 } }
        }
    ]
};

export function getCivMultiplier(gameState, type, resource) {
    let mult = 1.0;
    if (!gameState.civilizationHistory) return mult;

    // Iterate over all chosen civs (accumulative bonuses)
    Object.values(gameState.civilizationHistory).forEach(civ => {
        if (civ.effect.type === type && (!civ.effect.resource || civ.effect.resource === resource)) {
            mult *= civ.effect.value;
        }

        // Specific case: 'production' resource applies to base building output multiplier.
        // It should probably apply to EVERYTHING if it's "production".
        if (type === "production" && civ.effect.resource === "production") {
            mult *= civ.effect.value;
        }

        // Army power handled separately usually
        if (type === "army_power" && civ.effect.type === "army_power") {
            mult *= civ.effect.value;
        }
    });
    return mult;
}
