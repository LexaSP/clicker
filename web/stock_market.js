
// stock_market.js
// Buy and sell shares of companies

export const COMPANIES = [
    { id: "acme", name: "Acme Corp", industry: "General", basePrice: 100, volatility: 0.05, momentum: 0, originalBasePrice: 100 },
    { id: "eic", name: "East India Co.", industry: "Trade", basePrice: 200, volatility: 0.10, momentum: 0, originalBasePrice: 200 },
    { id: "oil", name: "Standard Oil", industry: "Energy", basePrice: 500, volatility: 0.15, momentum: 0, originalBasePrice: 500 },
    { id: "tech", name: "Cyberdyne", industry: "Tech", basePrice: 1000, volatility: 0.20, momentum: 0, originalBasePrice: 1000 },
    { id: "arms", name: "Stark Ind.", industry: "Military", basePrice: 1500, volatility: 0.25, momentum: 0, originalBasePrice: 1500 }
];

export function initStockMarket(state) {
    if (!state.stockMarket) {
        state.stockMarket = {
            stocks: {}, // { "acme": { owned: 0, currentPrice: 100, history: [], momentum: 0 } }
            lastUpdate: Date.now()
        };

        COMPANIES.forEach(c => {
            state.stockMarket.stocks[c.id] = {
                owned: 0,
                currentPrice: c.basePrice,
                history: [c.basePrice],
                momentum: 0
            };
        });
    } else {
        // Migration: Ensure momentum exists
        COMPANIES.forEach(c => {
            if (state.stockMarket.stocks[c.id] && state.stockMarket.stocks[c.id].momentum === undefined) {
                state.stockMarket.stocks[c.id].momentum = 0;
            }
        });
    }
}

export function updateStockMarket(state, dt) {
    initStockMarket(state);

    const market = state.stockMarket;

    COMPANIES.forEach(c => {
        const stock = market.stocks[c.id];
        if (!stock) return;

        // 1. Calculate how far the current price is from the base price (Reversion force)
        const meanReversionSpeed = 0.05;
        const drift = meanReversionSpeed * (c.basePrice - stock.currentPrice);

        // 2. Add market noise (randomness)
        const shock = (Math.random() - 0.5) * 2 * c.volatility * stock.currentPrice;

        // 3. Update momentum with inertia
        stock.momentum = (stock.momentum * 0.8) + drift + shock;

        // 4. Apply to price
        let newPrice = stock.currentPrice + stock.momentum;

        // 5. Prevent negative or zero prices (Hard clamp)
        if (newPrice < c.basePrice * 0.1) newPrice = c.basePrice * 0.1;
        // Soft cap on the top end
        if (newPrice > c.basePrice * 5.0) newPrice = c.basePrice * 5.0;

        stock.currentPrice = newPrice;

        // History limit check (every tick? assuming visualizer handles high frequency or we sample)
        // Original code didn't throttle, so let's keep it simple.
        stock.history.push(newPrice);
        if (stock.history.length > 20) stock.history.shift();
    });
}

export function buyStock(state, companyId, amount) {
    const market = state.stockMarket;
    const stock = market.stocks[companyId];
    if (!stock) return { success: false, msg: "Invalid Company" };

    const cost = stock.currentPrice * amount;
    if (state.resources.money < cost) return { success: false, msg: `Need ${Math.floor(cost)} Money.` };

    state.resources.money -= cost;
    stock.owned += amount;

    return { success: true, msg: `Bought ${amount} shares of ${COMPANIES.find(c => c.id === companyId).name}` };
}

export function sellStock(state, companyId, amount) {
    const market = state.stockMarket;
    const stock = market.stocks[companyId];
    if (!stock) return { success: false, msg: "Invalid Company" };

    if (stock.owned < amount) return { success: false, msg: "Not enough shares." };

    const value = stock.currentPrice * amount;
    stock.owned -= amount;
    state.resources.money += value;

    return { success: true, msg: `Sold ${amount} shares for ${Math.floor(value)} Money.` };
}

export function applyWarEconomy(isWar) {
    COMPANIES.forEach(c => {
        if (isWar) {
            if (c.industry === "Military") {
                c.basePrice = c.originalBasePrice * 1.5;
            } else if (c.industry === "Trade") {
                c.basePrice = c.originalBasePrice * 0.7;
            }
        } else {
            c.basePrice = c.originalBasePrice;
        }
    });
}
