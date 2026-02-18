// stock_market.js
// Buy and sell shares of companies

export const COMPANIES = [
    { id: "acme", name: "Acme Corp", industry: "Food", basePrice: 100, volatility: 0.05, momentum: 0 },
    { id: "eic", name: "East India Co.", industry: "Trade", basePrice: 200, volatility: 0.10, momentum: 0 },
    { id: "oil", name: "Standard Oil", industry: "Energy", basePrice: 500, volatility: 0.15, momentum: 0 },
    { id: "tech", name: "Cyberdyne", industry: "Tech", basePrice: 1000, volatility: 0.20, momentum: 0 },
    { id: "arms", name: "Stark Ind.", industry: "Military", basePrice: 1500, volatility: 0.25, momentum: 0 }
];

export function initStockMarket(state) {
    if (!state.stockMarket) {
        state.stockMarket = {
            stocks: {}, // { "acme": { owned: 0, currentPrice: 100, history: [] } }
            lastUpdate: Date.now(),
            events: [] // Active market events
        };
    }

    // Ensure all companies exist in state (for updates/migrations)
    if (!state.stockMarket.events) state.stockMarket.events = [];

    COMPANIES.forEach(c => {
        if (!state.stockMarket.stocks[c.id]) {
            state.stockMarket.stocks[c.id] = {
                owned: 0,
                currentPrice: c.basePrice,
                history: [c.basePrice],
                momentum: 0
            };
        }
        // Patch missing fields
        if (state.stockMarket.stocks[c.id].momentum === undefined) {
             state.stockMarket.stocks[c.id].momentum = 0;
        }
    });
}

export function triggerMarketEvent(state, type, duration) {
    if (!state.stockMarket) initStockMarket(state);
    state.stockMarket.events.push({ type, duration });
}

export function updateStockMarket(state, dt) {
    initStockMarket(state);

    const market = state.stockMarket;

    // Manage Events
    for (let i = market.events.length - 1; i >= 0; i--) {
        market.events[i].duration -= dt;
        if (market.events[i].duration <= 0) {
            market.events.splice(i, 1);
        }
    }

    // History Throttle (every 1s)
    const now = Date.now();
    const shouldUpdateHistory = now - market.lastUpdate >= 1000;
    if (shouldUpdateHistory) {
        market.lastUpdate = now;
    }

    COMPANIES.forEach(c => {
        const stock = market.stocks[c.id];

        // Calculate Effective Base Price
        let effectiveBase = c.basePrice;

        market.events.forEach(evt => {
            if (evt.type === "Economic Crisis") {
                effectiveBase *= 0.7; // -30%
            }
            if (evt.type === "War Declared") {
                if (c.industry === "Military") effectiveBase *= 1.5;
                if (c.industry === "Food") effectiveBase *= 0.5;
            }
        });

        // O-U Process: Mean Reversion
        // Force = (BasePrice - CurrentPrice) * 0.05
        const force = (effectiveBase - stock.currentPrice) * 0.05;

        // Noise = (Random - 0.5) * Volatility
        // Scaling volatility by effectiveBase to keep it relative and visible
        const noise = (Math.random() - 0.5) * (c.volatility * effectiveBase);

        // Update Price
        const delta = (force + noise) * dt;
        stock.currentPrice += delta;

        // Soft boundaries (0.1 min)
        if (stock.currentPrice < 0.1) stock.currentPrice = 0.1;

        // Update Momentum
        stock.momentum = delta;

        // Update History
        if (shouldUpdateHistory) {
            stock.history.push(stock.currentPrice);
            if (stock.history.length > 20) stock.history.shift();
        }
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
