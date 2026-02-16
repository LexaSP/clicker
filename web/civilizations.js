// civilizations.js

export const CIVILIZATIONS = {
    "Bronze Age": [
        { id: "egypt", name: "Egypt", icon: "🇪🇬", desc: "Master Builders", effect: { type: "production_mult", resource: "stone", value: 1.5 } },
        { id: "sumer", name: "Sumeria", icon: "🇮🇶", desc: "Cradle of Civ", effect: { type: "production_mult", resource: "knowledge", value: 1.2 } },
        { id: "indus", name: "Indus Valley", icon: "🇮🇳", desc: "Urban Planning", effect: { type: "production_mult", resource: "food", value: 1.3 } }
    ],
    "Iron Age": [
        { id: "rome", name: "Rome", icon: "🇮🇹", desc: "Legions", effect: { type: "army_power", value: 1.3 } },
        { id: "greece", name: "Greece", icon: "🇬🇷", desc: "Philosophy", effect: { type: "production_mult", resource: "culture", value: 1.3 } },
        { id: "persia", name: "Persia", icon: "🇮🇷", desc: "Trade Routes", effect: { type: "production_mult", resource: "money", value: 1.3 } }
    ],
    "Middle Ages": [
        { id: "england", name: "England", icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", desc: "Longbows", effect: { type: "production_mult", resource: "wood", value: 1.4 } },
        { id: "arabia", name: "Caliphate", icon: "🇸🇦", desc: "Golden Age", effect: { type: "production_mult", resource: "knowledge", value: 1.4 } },
        { id: "mongol", name: "Mongols", icon: "🇲🇳", desc: "Horde", effect: { type: "army_power", value: 1.5 } }
    ],
    "Renaissance": [
        { id: "florence", name: "Florence", icon: "⚜️", desc: "Patronage", effect: { type: "production_mult", resource: "culture", value: 1.5 } },
        { id: "spain", name: "Spain", icon: "🇪🇸", desc: "Conquistadors", effect: { type: "production_mult", resource: "money", value: 1.5 } },
        { id: "china", name: "Ming Dynasty", icon: "🇨🇳", desc: "Great Wall", effect: { type: "production_mult", resource: "stone", value: 1.5 } }
    ],
    "Industrial Age": [
        { id: "uk", name: "British Empire", icon: "🇬🇧", desc: "Industry", effect: { type: "production_mult", resource: "money", value: 1.5 } },
        { id: "germany", name: "Germany", icon: "🇩🇪", desc: "Engineering", effect: { type: "production_mult", resource: "production", value: 1.2 } },
        { id: "russia", name: "Russia", icon: "🇷🇺", desc: "Vast Forests", effect: { type: "production_mult", resource: "wood", value: 2.0 } }
    ],
    "Modern Age": [
        { id: "usa", name: "USA", icon: "🇺🇸", desc: "Capitalism", effect: { type: "production_mult", resource: "money", value: 1.5 } },
        { id: "ussr", name: "USSR", icon: "☭", desc: "Heavy Industry", effect: { type: "production_mult", resource: "production", value: 1.3 } },
        { id: "japan", name: "Japan", icon: "🇯🇵", desc: "Electronics", effect: { type: "production_mult", resource: "knowledge", value: 1.5 } }
    ],
    "Information Age": [
        { id: "silicon", name: "Silicon Valley", icon: "💻", desc: "Tech Giants", effect: { type: "production_mult", resource: "clicks", value: 1.5 } },
        { id: "shenzhen", name: "Shenzhen", icon: "🏭", desc: "Manufacturing", effect: { type: "production_mult", resource: "production", value: 1.5 } },
        { id: "nordic", name: "Nordic Model", icon: "❄️", desc: "Social Welfare", effect: { type: "production_mult", resource: "culture", value: 1.5 } }
    ],
    "Future Age": [
        { id: "utopia", name: "Global Utopia", icon: "🌍", desc: "Peace", effect: { type: "production_mult", resource: "food", value: 2.0 } },
        { id: "corp", name: "MegaCorp", icon: "🏢", desc: "Profit", effect: { type: "production_mult", resource: "money", value: 2.0 } },
        { id: "techno", name: "Technate", icon: "🤖", desc: "Efficiency", effect: { type: "production_mult", resource: "knowledge", value: 2.0 } }
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

        // Specific case: 'production' resource applies to everything usually, or just buildings?
        // Let's assume 'production' effect applies to 'clicks' too if not specified?
        // Or if resource is 'production', it applies to the base building output multiplier.
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
