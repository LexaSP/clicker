// firebase-stub.js

export class FirebaseStub {
    static async saveGame(saveData) {
        console.log("[Firebase Stub] Saving to cloud...");
        await new Promise(r => setTimeout(r, 500)); // Simulate delay
        localStorage.setItem("hc_cloud_save", JSON.stringify(saveData));
        return { success: true };
    }

    static async loadGame() {
        console.log("[Firebase Stub] Loading from cloud...");
        await new Promise(r => setTimeout(r, 500));
        const data = localStorage.getItem("hc_cloud_save");
        return data ? JSON.parse(data) : null;
    }

    static async getLeaderboard() {
        // Mock data
        return [
            { name: "Player1", score: 1000000 },
            { name: "Player2", score: 500000 },
            { name: "You", score: 100 }
        ];
    }
}
