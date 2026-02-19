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

    // Update every 5 seconds
    const market = state.stockMarket;
    const now = Date.now();
    if (now - market.lastUpdate < 5000) return;

    market.lastUpdate = now;

    COMPANIES.forEach(c => {
        const stock = market.stocks[c.id];
        if (!stock) return;

        // Mean Reversion (Ornstein-Uhlenbeck)
        const meanReversionSpeed = 0.05; // Force pulling back to base price
        const drift = meanReversionSpeed * (c.basePrice - stock.currentPrice);
        const shock = (Math.random() - 0.5) * 2 * c.volatility * stock.currentPrice;

        // Update momentum
        stock.momentum = (stock.momentum * 0.8) + drift + shock;

        // Apply momentum to price
        let newPrice = stock.currentPrice + stock.momentum;

        // Hard clamps to prevent negative prices
        if (newPrice < 1) newPrice = 1;

        stock.currentPrice = newPrice;
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

export function applyWarEconomy(active) {
    COMPANIES.forEach(c => {
        if (c.industry === "Military") {
            c.basePrice = active ? c.originalBasePrice * 1.5 : c.originalBasePrice;
        }
        if (c.industry === "Trade") {
            c.basePrice = active ? c.originalBasePrice * 0.8 : c.originalBasePrice;
        }
    });
}
