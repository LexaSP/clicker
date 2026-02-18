// map_engine.js

export class MapEngine {
    constructor() {
        this.canvas = document.getElementById('game-background');
        // If not exists, create it (legacy support, though visuals.js did it)
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'game-background';
            this.canvas.style.position = 'fixed';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.zIndex = '-1';
            this.canvas.style.pointerEvents = 'auto'; // Enable clicks
            document.body.prepend(this.canvas);
        } else {
             this.canvas.style.pointerEvents = 'auto';
        }

        this.ctx = this.canvas.getContext('2d');
        this.buildings = []; // { x, y, type, icon, scale, targetScale }
        this.citizens = []; // { x, y, targetX, targetY, speed, color }
        this.particles = []; // { x, y, text, life, vy }

        this.era = "Stone Age";
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('click', (e) => this.handleClick(e));

        // Ground level definition (horizon)
        this.horizonY = this.height * 0.7;

        this.animate();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.horizonY = this.height * 0.7;
    }

    setEra(era) {
        this.era = era;
    }

    handleClick(e) {
        const x = e.clientX;
        const y = e.clientY;

        // Check if clicked below horizon (ground)
        if (y > this.horizonY) {
            this.gatherResource(x, y);
        }

        // Interactive Buildings?
        // Check collisions later if needed.
    }

    gatherResource(x, y) {
        const state = window.gameState;
        if (!state) return;

        let res = "food";
        let amount = 1;

        // Era dependent
        if (this.era === "Stone Age") { res = Math.random() > 0.5 ? "stone" : "food"; amount = 1; }
        else if (this.era === "Bronze Age") { res = Math.random() > 0.5 ? "copper" : "food"; amount = 2; } // Copper maps to stone logic in script?
        else if (this.era === "Iron Age") { res = "iron"; amount = 1; }
        else if (this.era === "Industrial Age") { res = "coal"; amount = 5; } // Coal maps to? Let's say money or energy
        else if (this.era === "Modern Age") { res = "oil"; amount = 2; }
        else if (this.era === "Future Age") { res = "titanium"; amount = 1; }

        // Map to actual resources in state
        // We have: wood, stone, food, iron, steel, oil, uranium, energy.
        // Fallback mapping
        if (res === "copper") res = "stone";
        if (res === "coal") res = "energy";
        if (res === "titanium") res = "steel";

        if (state.resources[res] !== undefined) {
            state.resources[res] += amount;
            this.spawnFloatingText(x, y, `+${amount} ${res}`, "#2ecc71");

            // Spawn particle effect
            for(let i=0; i<5; i++) {
                this.spawnParticle(x, y);
            }
        }
    }

    spawnFloatingText(x, y, text, color) {
        this.particles.push({
            x, y,
            text,
            color,
            life: 60, // frames
            vy: -1
        });
    }

    spawnParticle(x, y) {
        // Simple pixel debris
        this.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 1) * 5,
            life: 30,
            color: "#fff",
            isDebris: true
        });
    }

    addBuilding(type, icon) {
        const x = Math.random() * this.width;
        const depth = Math.random() * (this.height - this.horizonY - 50);
        const y = this.horizonY + depth;

        this.buildings.push({
            x, y, type, icon,
            scale: 0,
            targetScale: 1
        });

        for(let i=0; i<3; i++) this.spawnCitizen(x, y);
    }

    spawnCitizen(x, y) {
        this.citizens.push({
            x: x, y: y,
            targetX: Math.random() * this.width,
            targetY: this.horizonY + Math.random() * (this.height - this.horizonY - 20),
            speed: 0.5 + Math.random() * 0.5,
            color: this.getCitizenColor()
        });
        if (this.citizens.length > 100) this.citizens.shift();
    }

    getCitizenColor() {
        if (this.era === "Stone Age") return "#8d6e63";
        if (this.era === "Bronze Age") return "#d35400";
        if (this.era === "Iron Age") return "#95a5a6";
        if (this.era === "Future Age") return "#00ffff";
        return "#ecf0f1";
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.drawSky();
        this.drawGround();

        // Draw Particles (Background layer?) No, usually foreground.

        // Sort entities
        const entities = [...this.buildings, ...this.citizens].sort((a, b) => a.y - b.y);

        entities.forEach(e => {
            if (e.type) { // Building
                if (e.scale < e.targetScale) e.scale += 0.05;
                this.ctx.font = `${30 * e.scale}px Arial`;
                this.ctx.textAlign = "center";
                this.ctx.fillStyle = "white"; // Default text color if fillText uses it? No, emoji.
                this.ctx.shadowColor = "black";
                this.ctx.shadowBlur = 5;
                this.ctx.fillText(e.icon, e.x, e.y);
                this.ctx.shadowBlur = 0;
            } else { // Citizen
                const dx = e.targetX - e.x;
                const dy = e.targetY - e.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if (dist < 5) {
                    e.targetX = Math.random() * this.width;
                    e.targetY = this.horizonY + Math.random() * (this.height - this.horizonY - 20);
                } else {
                    e.x += (dx / dist) * e.speed;
                    e.y += (dy / dist) * e.speed;
                }

                this.ctx.fillStyle = e.color;
                this.ctx.beginPath();
                this.ctx.arc(e.x, e.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        // Draw Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life--;

            if (p.isDebris) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.2; // Gravity
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(p.x, p.y, 2, 2);
            } else { // Text
                p.y += p.vy;
                this.ctx.font = "20px Arial";
                this.ctx.fillStyle = p.color;
                this.ctx.textAlign = "center";
                this.ctx.fillText(p.text, p.x, p.y);
            }

            if (p.life <= 0) this.particles.splice(i, 1);
        }

        requestAnimationFrame(() => this.animate());
    }

    drawSky() {
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.horizonY);
        switch(this.era) {
            case "Stone Age": grad.addColorStop(0, "#87CEEB"); grad.addColorStop(1, "#f1c40f"); break;
            case "Industrial Age": grad.addColorStop(0, "#2c3e50"); grad.addColorStop(1, "#e74c3c"); break;
            case "Future Age": grad.addColorStop(0, "#000000"); grad.addColorStop(1, "#4b0082"); break;
            default: grad.addColorStop(0, "#3498db"); grad.addColorStop(1, "#ecf0f1"); break;
        }
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.horizonY);

        this.ctx.fillStyle = this.era === "Future Age" ? "#bdc3c7" : "#f39c12";
        this.ctx.beginPath();
        this.ctx.arc(100, 100, 40, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = this.ctx.fillStyle;
        this.ctx.shadowBlur = 0;
    }

    drawGround() {
        const grad = this.ctx.createLinearGradient(0, this.horizonY, 0, this.height);
        switch(this.era) {
            case "Stone Age": grad.addColorStop(0, "#2ecc71"); grad.addColorStop(1, "#27ae60"); break;
            case "Bronze Age": grad.addColorStop(0, "#e67e22"); grad.addColorStop(1, "#d35400"); break;
            case "Future Age": grad.addColorStop(0, "#34495e"); grad.addColorStop(1, "#2c3e50"); break;
            default: grad.addColorStop(0, "#7f8c8d"); grad.addColorStop(1, "#95a5a6"); break;
        }
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, this.horizonY, this.width, this.height - this.horizonY);
    }
}
