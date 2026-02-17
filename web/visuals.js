// visuals.js

export class VisualController {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'game-background';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.pointerEvents = 'none';
        document.body.prepend(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.entities = []; // { x, y, icon, size, type, floatOffset }
        this.clouds = [];
        this.era = "Stone Age";

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Start loop
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setEra(era) {
        this.era = era;
    }

    addEntity(icon, type) {
        // Determine placement based on type
        // Space/Air units go in sky, Buildings on ground
        const isAir = ["🛰️", "🚀", "🛸", "🌑", "🌞", "☁️"].includes(icon) || type === "space";

        const size = 30 + Math.random() * 20;
        let y = 0;

        if (isAir) {
            y = Math.random() * (this.canvas.height * 0.4);
        } else {
            // Ground level varies but generally bottom 30%
            y = this.canvas.height - (50 + Math.random() * 100);
        }

        const x = Math.random() * this.canvas.width;

        this.entities.push({
            x, y, icon, size,
            floatOffset: Math.random() * 100,
            speed: (Math.random() - 0.5) * 0.2 // Slow drift
        });

        // Cap entities
        if (this.entities.length > 50) this.entities.shift();
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Sky/Background Gradient based on Era
        this.drawBackground();

        // Draw Terrain
        this.drawTerrain();

        // Draw Entities
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        this.entities.forEach(e => {
            e.x += e.speed;
            if (e.x > this.canvas.width + 50) e.x = -50;
            if (e.x < -50) e.x = this.canvas.width + 50;

            // Float effect
            const floatY = Math.sin((Date.now() / 1000) + e.floatOffset) * 5;

            this.ctx.font = `${e.size}px Arial`;
            this.ctx.fillText(e.icon, e.x, e.y + floatY);
        });

        requestAnimationFrame(() => this.animate());
    }

    drawBackground() {
        const h = this.canvas.height;
        const w = this.canvas.width;
        const grad = this.ctx.createLinearGradient(0, 0, 0, h);

        // Simple Era themes
        switch(this.era) {
            case "Stone Age": grad.addColorStop(0, "#87CEEB"); grad.addColorStop(1, "#8B4513"); break; // Blue to Brown
            case "Bronze Age": grad.addColorStop(0, "#87CEEB"); grad.addColorStop(1, "#CD853F"); break;
            case "Industrial Age": grad.addColorStop(0, "#778899"); grad.addColorStop(1, "#2F4F4F"); break; // Smoggy
            case "Modern Age": grad.addColorStop(0, "#4682B4"); grad.addColorStop(1, "#A9A9A9"); break;
            case "Future Age": grad.addColorStop(0, "#000033"); grad.addColorStop(1, "#4B0082"); break; // Space
            default: grad.addColorStop(0, "#87CEEB"); grad.addColorStop(1, "#228B22"); break;
        }

        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, w, h);
    }

    drawTerrain() {
        // Simple horizon
        const h = this.canvas.height;
        const w = this.canvas.width;

        this.ctx.fillStyle = "rgba(0,0,0,0.3)";
        this.ctx.beginPath();
        this.ctx.moveTo(0, h);
        this.ctx.lineTo(0, h - 100);

        // Jagged line
        for (let i = 0; i <= w; i += 50) {
            this.ctx.lineTo(i, h - 100 - Math.random() * 20);
        }

        this.ctx.lineTo(w, h);
        this.ctx.fill();
    }
}
