// audio.js

export class AudioController {
    constructor() {
        this.enabled = true;
        this.ctx = null;
        this.bgmOscs = [];
        this.isPlaying = false;

        // simple synths
        this.scales = {
            "Stone Age": [261.63, 293.66, 329.63, 392.00, 440.00], // C Pentatonic
            "Bronze Age": [261.63, 277.18, 311.13, 349.23, 392.00], // C Phrygian Dominant ish
            "Future Age": [261.63, 311.13, 329.63, 369.99, 415.30, 440.00] // Whole tone / Augmented
        };

        this.sequencerTimer = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            this.init();
            if (this.ctx.state === 'suspended') this.ctx.resume();
            this.startMusic();
        } else {
            this.stopMusic();
        }
        return this.enabled;
    }

    playClick() {
        if (!this.enabled || !this.ctx) return;
        this.playTone(440 + Math.random()*100, "square", 0.1);
    }

    playBuy() {
        if (!this.enabled || !this.ctx) return;
        this.playTone(600, "sine", 0.1);
        setTimeout(() => this.playTone(800, "sine", 0.1), 100);
    }

    playUnlock() {
        if (!this.enabled || !this.ctx) return;
        this.playTone(400, "triangle", 0.2);
        setTimeout(() => this.playTone(500, "triangle", 0.2), 100);
        setTimeout(() => this.playTone(600, "triangle", 0.4), 200);
    }

    playEvent() {
        if (!this.enabled || !this.ctx) return;
        this.playTone(200, "sawtooth", 0.5);
    }

    playError() {
        if (!this.enabled || !this.ctx) return;
        this.playTone(100, "sawtooth", 0.3);
        setTimeout(() => this.playTone(80, "sawtooth", 0.3), 100);
    }

    playTone(freq, type, duration) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // Procedural Music
    startMusic() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.scheduleNextNote();
    }

    stopMusic() {
        this.isPlaying = false;
        if (this.sequencerTimer) clearTimeout(this.sequencerTimer);
    }

    scheduleNextNote() {
        if (!this.enabled || !this.isPlaying) return;

        const state = window.gameState;
        const era = state ? state.era : "Stone Age";
        const scale = this.scales[era] || this.scales["Stone Age"];

        // Random note from scale
        const note = scale[Math.floor(Math.random() * scale.length)];
        // Random octave
        const oct = Math.pow(2, Math.floor(Math.random() * 3) - 1); // 0.5, 1, 2

        const freq = note * oct;

        // Play soft ambient note
        this.playTone(freq, "sine", 2.0); // Long duration

        // Next note delay (tempo)
        const delay = 1000 + Math.random() * 2000;
        this.sequencerTimer = setTimeout(() => this.scheduleNextNote(), delay);
    }
}
