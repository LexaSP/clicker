// civilizations.js

export const CIVILIZATIONS = {
    "Bronze Age": [
        {
            id: "egypt", name: "Egypt", icon: "🇪🇬",
            pros: ["Great Monument Building"], cons: ["Slow Expansion"],
            effect: { type: "production_mult", resource: "stone", value: 1.5 }
        },
        {
            id: "sumer", name: "Sumeria", icon: "🇮🇶",
            pros: ["Early Science Boost"], cons: ["Weak Military"],
            effect: { type: "production_mult", resource: "knowledge", value: 1.2 }
        },
        {
            id: "indus", name: "Indus Valley", icon: "🇮🇳",
            pros: ["Efficient Cities"], cons: ["Resource Dependent"],
            effect: { type: "production_mult", resource: "food", value: 1.3 }
        },
        {
            id: "babylon", name: "Babylon", icon: "🦁",
            pros: ["Code of Law", "Scientific Growth"], cons: ["Surrounded by Enemies"],
            effect: { type: "production_mult", resource: "knowledge", value: 1.3 }
        },
        {
            id: "hittites", name: "Hittites", icon: "⚔️",
            pros: ["Iron Weapons", "Chariot Warfare"], cons: ["Political Instability"],
            effect: { type: "army_power", value: 1.2 }
        }
    ],
    "Iron Age": [
        {
            id: "rome", name: "Rome", icon: "🇮🇹",
            pros: ["Unstoppable Legions"], cons: ["High Maintenance Cost"],
            effect: { type: "army_power", value: 1.3 }
        },
        {
            id: "greece", name: "Greece", icon: "🇬🇷",
            pros: ["Cultural Hub"], cons: ["Internal Conflict"],
            effect: { type: "production_mult", resource: "culture", value: 1.3 }
        },
        {
            id: "persia", name: "Persia", icon: "🇮🇷",
            pros: ["Wealth of Nations"], cons: ["Overextended Empire"],
            effect: { type: "production_mult", resource: "money", value: 1.3 }
        },
        {
            id: "carthage", name: "Carthage", icon: "🐘",
            pros: ["Maritime Trade Empire"], cons: ["Mercenary Reliance"],
            effect: { type: "production_mult", resource: "money", value: 1.4 }
        },
        {
            id: "qin", name: "Qin Dynasty", icon: "🇨🇳",
            pros: ["Imperial Unification", "Bureaucracy"], cons: ["Strict Legalism"],
            effect: { type: "production_mult", resource: "production", value: 1.2 }
        }
    ],
    "Middle Ages": [
        {
            id: "england", name: "England", icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
            pros: ["Strong Defense", "Longbowmen"], cons: ["Island Isolation"],
            effect: { type: "production_mult", resource: "wood", value: 1.4 }
        },
        {
            id: "arabia", name: "Caliphate", icon: "🇸🇦",
            pros: ["Scientific Golden Age"], cons: ["Religious Tensions"],
            effect: { type: "production_mult", resource: "knowledge", value: 1.4 }
        },
        {
            id: "mongol", name: "Mongols", icon: "🇲🇳",
            pros: ["Terrifying Army", "Rapid Conquest"], cons: ["No Infrastructure"],
            effect: { type: "army_power", value: 1.5 }
        },
        {
            id: "byzantium", name: "Byzantium", icon: "🏛️",
            pros: ["Theodosian Walls", "Silk Road Wealth"], cons: ["Constant Wars"],
            effect: { type: "production_mult", resource: "money", value: 1.4 }
        },
        {
            id: "vikings", name: "Vikings", icon: "🛶",
            pros: ["Raiding Economy", "Naval Mastery"], cons: ["Diplomatic Isolation"],
            effect: { type: "production_mult", resource: "money", value: 1.3 }
        }
    ],
    "Renaissance": [
        {
            id: "spain", name: "Spain", icon: "🇪🇸",
            pros: ["Colonial Wealth", "Exploration"], cons: ["Inflation Risk"],
            effect: { type: "production_mult", resource: "money", value: 1.5 }
        },
        {
            id: "ottoman", name: "Ottoman Empire", icon: "🇹🇷",
            pros: ["Janissary Corps", "Crossroads of World"], cons: ["Succession Crisis"],
            effect: { type: "army_power", value: 1.4 }
        },
        {
            id: "china", name: "Ming Dynasty", icon: "🇨🇳",
            pros: ["Great Wall Construction", "Tribute System"], cons: ["Isolationism"],
            effect: { type: "production_mult", resource: "stone", value: 1.5 }
        },
        {
            id: "dutch", name: "Dutch Republic", icon: "🇳🇱",
            pros: ["Stock Market Pioneers", "Global Trade"], cons: ["Small Population"],
            effect: { type: "production_mult", resource: "money", value: 1.5 }
        },
        {
            id: "russia_tsar", name: "Tsardom of Russia", icon: "🇷🇺",
            pros: ["Endless Expansion", "Siberian Resources"], cons: ["Serfdom Economy"], // Hidden Buff
            effect: { type: "production_mult", resource: "wood", value: 2.0 }
        }
    ],
    "Industrial Age": [
        {
            id: "uk", name: "British Empire", icon: "🇬🇧",
            pros: ["Workshop of the World", "Global Hegemony"], cons: ["Colonial Unrest"],
            effect: { type: "production_mult", resource: "money", value: 1.5 }
        },
        {
            id: "germany", name: "Germany", icon: "🇩🇪",
            pros: ["Precision Engineering", "Chemical Industry"], cons: ["Resource Scarcity"],
            effect: { type: "production_mult", resource: "production", value: 1.2 }
        },
        {
            id: "russia", name: "Russian Empire", icon: "🇷🇺",
            pros: ["Vast Landmass", "Limitless Resources"], cons: ["Slow Modernization"], // Hidden Buff: actually 3x Wood
            effect: { type: "production_mult", resource: "wood", value: 3.0 }
        },
        {
            id: "france", name: "France", icon: "🇫🇷",
            pros: ["Cultural Prestige", "Belle Époque"], cons: ["Political Instability"],
            effect: { type: "production_mult", resource: "culture", value: 1.5 }
        },
        {
            id: "usa_ind", name: "United States", icon: "🇺🇸",
            pros: ["Gilded Age Industry", "Immigrant Workforce"], cons: ["Civil Unrest"],
            effect: { type: "production_mult", resource: "production", value: 1.3 }
        }
    ],
    "Modern Age": [
        {
            id: "usa", name: "Superpower USA", icon: "🇺🇸",
            pros: ["Global Dominance", "Cultural Export"], cons: ["Military Overspending"], // Hidden Nerf: actually only 1.2x Money
            effect: { type: "production_mult", resource: "money", value: 1.2 }
        },
        {
            id: "ussr", name: "USSR", icon: "☭",
            pros: ["Rapid Industrialization", "Space Race Leader"], cons: ["Bureaucratic Inefficiency"], // Hidden Buff: actually 2.5x Production
            effect: { type: "production_mult", resource: "production", value: 2.5 }
        },
        {
            id: "japan", name: "Japan", icon: "🇯🇵",
            pros: ["Tech Innovation", "Economic Miracle"], cons: ["Aging Population"],
            effect: { type: "production_mult", resource: "knowledge", value: 1.5 }
        },
        {
            id: "china_prc", name: "PRC", icon: "🇨🇳",
            pros: ["Massive Workforce", "Infrastructure Boom"], cons: ["Early Isolation"],
            effect: { type: "production_mult", resource: "production", value: 1.4 }
        },
        {
            id: "eu", name: "European Union", icon: "🇪🇺",
            pros: ["Economic Integration", "Soft Power"], cons: ["Complex Bureaucracy"],
            effect: { type: "production_mult", resource: "culture", value: 1.6 }
        }
    ],
    "Information Age": [
        {
            id: "silicon", name: "Silicon Valley", icon: "💻",
            pros: ["Digital Revolution", "Venture Capital"], cons: ["Privacy Erosion"],
            effect: { type: "production_mult", resource: "clicks", value: 1.5 }
        },
        {
            id: "shenzhen", name: "Shenzhen", icon: "🏭",
            pros: ["Hardware Capital", "Supply Chain Speed"], cons: ["Environmental Cost"],
            effect: { type: "production_mult", resource: "production", value: 1.5 }
        },
        {
            id: "nordic", name: "Nordic Model", icon: "❄️",
            pros: ["Social Stability", "Green Energy"], cons: ["High Taxation"],
            effect: { type: "production_mult", resource: "culture", value: 1.5 }
        },
        {
            id: "tigers", name: "Asian Tigers", icon: "🐅",
            pros: ["Financial Hubs", "Rapid Growth"], cons: ["Market Volatility"],
            effect: { type: "production_mult", resource: "money", value: 1.6 }
        },
        {
            id: "cyber", name: "Cyber-State", icon: "🌐",
            pros: ["E-Governance", "Digital Citizenship"], cons: ["Cyber Warfare Risk"],
            effect: { type: "production_mult", resource: "knowledge", value: 1.6 }
        }
    ],
    "Future Age": [
        {
            id: "utopia", name: "Global Utopia", icon: "🌍",
            pros: ["Post-Scarcity Economy", "World Peace"], cons: ["Cultural Homogeneity"],
            effect: { type: "production_mult", resource: "food", value: 2.0 }
        },
        {
            id: "corp", name: "MegaCorp", icon: "🏢",
            pros: ["Efficiency Maximization", "Interstellar Trade"], cons: ["Corporate Feudalism"],
            effect: { type: "production_mult", resource: "money", value: 2.0 }
        },
        {
            id: "techno", name: "Technate", icon: "🤖",
            pros: ["AI Governance", "Singularity"], cons: ["Loss of Agency"],
            effect: { type: "production_mult", resource: "knowledge", value: 2.0 }
        },
        {
            id: "mars", name: "Martian Federation", icon: "🔴",
            pros: ["New Frontier", "Terraforming Tech"], cons: ["Life Support Dependence"],
            effect: { type: "production_mult", resource: "stone", value: 2.0 }
        },
        {
            id: "hive", name: "AI Collective", icon: "🧠",
            pros: ["Instant Calculation", "Unified Purpose"], cons: ["Zero Individuality"],
            effect: { type: "production_mult", resource: "clicks", value: 2.0 }
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
