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
            pros: ["Wealth of Nations"], cons: ["Overextended"],
            effect: { type: "production_mult", resource: "money", value: 1.3 }
        }
    ],
    "Middle Ages": [
        {
            id: "england", name: "England", icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
            pros: ["Strong Defense"], cons: ["Slow Growth"],
            effect: { type: "production_mult", resource: "wood", value: 1.4 }
        },
        {
            id: "arabia", name: "Caliphate", icon: "🇸🇦",
            pros: ["Scientific Golden Age"], cons: ["Religious Tensions"],
            effect: { type: "production_mult", resource: "knowledge", value: 1.4 }
        },
        {
            id: "mongol", name: "Mongols", icon: "🇲🇳",
            pros: ["Terrifying Army"], cons: ["No Infrastructure"],
            effect: { type: "army_power", value: 1.5 }
        }
    ],
    "Renaissance": [
        {
            id: "florence", name: "Florence", icon: "⚜️",
            pros: ["Artistic Renaissance"], cons: ["Small Territory"],
            effect: { type: "production_mult", resource: "culture", value: 1.5 }
        },
        {
            id: "spain", name: "Spain", icon: "🇪🇸",
            pros: ["Colonial Wealth"], cons: ["Inflation Risk"],
            effect: { type: "production_mult", resource: "money", value: 1.5 }
        },
        {
            id: "china", name: "Ming Dynasty", icon: "🇨🇳",
            pros: ["Vast Construction"], cons: ["Isolationism"],
            effect: { type: "production_mult", resource: "stone", value: 1.5 }
        }
    ],
    "Industrial Age": [
        {
            id: "uk", name: "British Empire", icon: "🇬🇧",
            pros: ["Global Trade Network"], cons: ["Colonial Unrest"],
            effect: { type: "production_mult", resource: "money", value: 1.5 }
        },
        {
            id: "germany", name: "Germany", icon: "🇩🇪",
            pros: ["Precision Engineering"], cons: ["Resource Scarcity"],
            effect: { type: "production_mult", resource: "production", value: 1.2 }
        },
        {
            id: "russia", name: "Russian Empire", icon: "🇷🇺",
            pros: ["Steady Resource Growth", "Large Workforce"], cons: ["Slow Modernization"], // Hidden Buff: actually 3x Wood
            effect: { type: "production_mult", resource: "wood", value: 3.0 }
        }
    ],
    "Modern Age": [
        {
            id: "usa", name: "USA", icon: "🇺🇸",
            pros: ["Unrivaled Economic Power", "Land of Opportunity"], cons: ["High Consumption"], // Hidden Nerf: actually only 1.2x Money
            effect: { type: "production_mult", resource: "money", value: 1.2 }
        },
        {
            id: "ussr", name: "USSR", icon: "☭",
            pros: ["Planned Economy", "Heavy Industry Focus"], cons: ["Bureaucracy"], // Hidden Buff: actually 2.5x Production
            effect: { type: "production_mult", resource: "production", value: 2.5 }
        },
        {
            id: "japan", name: "Japan", icon: "🇯🇵",
            pros: ["Tech Innovation"], cons: ["Aging Population"],
            effect: { type: "production_mult", resource: "knowledge", value: 1.5 }
        }
    ],
    "Information Age": [
        {
            id: "silicon", name: "Silicon Valley", icon: "💻",
            pros: ["Digital Revolution"], cons: ["Privacy Loss"],
            effect: { type: "production_mult", resource: "clicks", value: 1.5 }
        },
        {
            id: "shenzhen", name: "Shenzhen", icon: "🏭",
            pros: ["World's Factory"], cons: ["Pollution"],
            effect: { type: "production_mult", resource: "production", value: 1.5 }
        },
        {
            id: "nordic", name: "Nordic Model", icon: "❄️",
            pros: ["High Quality of Life"], cons: ["High Taxes"],
            effect: { type: "production_mult", resource: "culture", value: 1.5 }
        }
    ],
    "Future Age": [
        {
            id: "utopia", name: "Global Utopia", icon: "🌍",
            pros: ["Post-Scarcity"], cons: ["Stagnation"],
            effect: { type: "production_mult", resource: "food", value: 2.0 }
        },
        {
            id: "corp", name: "MegaCorp", icon: "🏢",
            pros: ["Infinite Profit"], cons: ["Dystopian Control"],
            effect: { type: "production_mult", resource: "money", value: 2.0 }
        },
        {
            id: "techno", name: "Technate", icon: "🤖",
            pros: ["Singularity"], cons: ["Loss of Humanity"],
            effect: { type: "production_mult", resource: "knowledge", value: 2.0 }
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
