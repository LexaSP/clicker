// trade.js

export const TRADE_RATES = {
    // Base Rates relative to Money/Gold
    // Buying: Cost in Money
    // Selling: Gain in Money (usually lower, buy/sell spread)
    wood: { buy: 10, sell: 5 },
    stone: { buy: 20, sell: 10 },
    food: { buy: 5, sell: 2 },
    iron: { buy: 50, sell: 25 },
    steel: { buy: 100, sell: 50 },
    oil: { buy: 200, sell: 100 },
    uranium: { buy: 500, sell: 250 },
    energy: { buy: 1000, sell: 500 },
    knowledge: { buy: 10, sell: 0 } // Cannot sell knowledge, only buy (maybe?)
};

export function tradeResource(gameState, action, resource, amount) {
    const rate = TRADE_RATES[resource];
    if (!rate) return { success: false, msg: "Resource not tradeable." };

    if (action === "buy") {
        const cost = rate.buy * amount;
        if (gameState.resources.money >= cost) {
            gameState.resources.money -= cost;
            gameState.resources[resource] = (gameState.resources[resource] || 0) + amount;
            return { success: true, msg: `Bought ${amount} ${resource} for ${cost} Money.` };
        } else {
            return { success: false, msg: `Not enough Money (Need ${cost}).` };
        }
    } else if (action === "sell") {
        if ((gameState.resources[resource] || 0) >= amount) {
            const gain = rate.sell * amount;
            gameState.resources[resource] -= amount;
            gameState.resources.money += gain;
            return { success: true, msg: `Sold ${amount} ${resource} for ${gain} Money.` };
        } else {
            return { success: false, msg: `Not enough ${resource}.` };
        }
    }

    return { success: false, msg: "Invalid action." };
}
