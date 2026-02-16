// events.js

export const RANDOM_EVENTS = [
    {
        id: "wandering_merchant",
        title: "Wandering Merchant",
        text: "A merchant passes by, offering goods for a price.",
        trigger: (state) => state.resources.clicks >= 500 && Math.random() < 0.1,
        options: [
            {
                text: "Buy Supplies (100 Clicks)",
                check: (state) => state.resources.clicks >= 100,
                action: (state) => {
                    state.resources.clicks -= 100;
                    state.resources.food += 50;
                    return "You bought 50 Food.";
                }
            },
            {
                text: "Ignore",
                action: (state) => "You ignored the merchant."
            }
        ]
    },
    {
        id: "scientific_breakthrough",
        title: "Scientific Breakthrough!",
        text: "Your researchers have a moment of clarity.",
        trigger: (state) => state.buildings["Lab"].count > 0 && Math.random() < 0.05,
        options: [
            {
                text: "Focus on Knowledge",
                action: (state) => {
                    state.resources.knowledge += 500;
                    return "Gained 500 Knowledge.";
                }
            },
            {
                text: "Apply to Production",
                action: (state) => {
                    if (!state.tempMultiplier) state.tempMultiplier = 1;
                    state.tempMultiplier *= 2;
                    setTimeout(() => state.tempMultiplier /= 2, 60000);
                    return "Production doubled for 1 minute!";
                }
            }
        ]
    },
    {
        id: "cultural_festival",
        title: "Cultural Festival",
        text: "The people want to celebrate their heritage.",
        trigger: (state) => state.era !== "Stone Age" && Math.random() < 0.05,
        options: [
            {
                text: "Sponsor Festival (50 Food)",
                check: (state) => state.resources.food >= 50,
                action: (state) => {
                    state.resources.food -= 50;
                    state.resources.culture += 200;
                    return "People are happy! +200 Culture.";
                }
            },
            {
                text: "Decline",
                action: (state) => "The people are disappointed."
            }
        ]
    },
    {
        id: "strange_artifact",
        title: "Strange Artifact",
        text: "Explorers found something glowing in the dirt.",
        trigger: (state) => state.stats.expeditionsCompleted > 0 && Math.random() < 0.02,
        options: [
            {
                text: "Study it carefully",
                action: (state) => {
                    state.resources.knowledge += 1000;
                    return "It was an ancient data drive! +1000 Knowledge.";
                }
            },
            {
                text: "Sell it",
                action: (state) => {
                    state.resources.money += 100;
                    return "Sold to a collector for 100 Gold.";
                }
            }
        ]
    }
];

export class EventController {
    constructor(gameState) {
        this.gameState = gameState;
        this.activeEvent = null;
    }

    checkEvents() {
        if (this.activeEvent) return; // Wait for player

        // Try to trigger one
        // 1% chance per tick check (called e.g. every second)
        for (let event of RANDOM_EVENTS) {
            if (event.trigger(this.gameState)) {
                this.triggerEvent(event);
                break; // Only one at a time
            }
        }
    }

    triggerEvent(event) {
        this.activeEvent = event;
        this.renderEventModal(event);
        if (window.audioController) window.audioController.playEvent();
    }

    renderEventModal(event) {
        // Create modal DOM
        const modal = document.createElement("div");
        modal.id = "event-modal";
        modal.className = "modal-overlay";

        let optionsHtml = "";
        event.options.forEach((opt, idx) => {
            const disabled = opt.check && !opt.check(this.gameState);
            optionsHtml += `<button class="event-option-btn" ${disabled ? 'disabled' : ''} data-idx="${idx}">${opt.text}</button>`;
        });

        modal.innerHTML = `
            <div class="modal-content">
                <h2>${event.title}</h2>
                <p>${event.text}</p>
                <div class="event-options">
                    ${optionsHtml}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Bind clicks
        modal.querySelectorAll(".event-option-btn").forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.getAttribute("data-idx"));
                this.resolveEvent(event.options[idx]);
            };
        });
    }

    resolveEvent(option) {
        const resultText = option.action(this.gameState);
        alert(resultText); // Simple feedback for now

        // Cleanup
        const modal = document.getElementById("event-modal");
        if (modal) document.body.removeChild(modal);
        this.activeEvent = null;
    }
}
