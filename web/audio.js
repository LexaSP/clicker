export class AudioController {
    constructor() {
        this.enabled = true;
        this.ctx = null;
        this.init();
    }

    init() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        } catch (e) {
            console.warn("Web Audio API not supported", e);
            this.enabled = false;
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    playTone(freq, type, duration, volume = 0.1) {
        if (!this.enabled || !this.ctx) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playClick() {
        // High pitch short blip
        this.playTone(800, 'sine', 0.1, 0.05);
    }

    playBuy() {
        // Ascending chime
        if (!this.enabled || !this.ctx) return;
        this.resume();

        const now = this.ctx.currentTime;
        this.scheduleTone(440, 'sine', now, 0.1);
        this.scheduleTone(554, 'sine', now + 0.1, 0.1); // C#
        this.scheduleTone(659, 'sine', now + 0.2, 0.2); // E
    }

    playUnlock() {
        // Fanfare chord
        if (!this.enabled || !this.ctx) return;
        this.resume();

        const now = this.ctx.currentTime;
        this.scheduleTone(523.25, 'triangle', now, 0.3); // C
        this.scheduleTone(659.25, 'triangle', now, 0.3); // E
        this.scheduleTone(783.99, 'triangle', now, 0.3); // G
        this.scheduleTone(1046.50, 'triangle', now + 0.1, 0.5); // High C
    }

    playEvent() {
        // Positive notification
        if (!this.enabled || !this.ctx) return;
        this.resume();

        const now = this.ctx.currentTime;
        this.scheduleTone(880, 'sine', now, 0.15);
        this.scheduleTone(1760, 'sine', now + 0.1, 0.3);
    }

    playError() {
        // Low buzz
        this.playTone(150, 'sawtooth', 0.2, 0.05);
    }

    scheduleTone(freq, type, startTime, duration, volume = 0.1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
    }
}
