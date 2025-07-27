import Phaser from "phaser";

export class StartScene extends Phaser.Scene {
  constructor() {
    super({ key: "StartScene" });
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Title
    this.add
      .text(centerX, centerY - 150, "OVER-BINGO", {
        fontSize: "48px",
        color: "#f39c12",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(centerX, centerY - 100, "Chaotic Math Bingo Action", {
        fontSize: "20px",
        color: "#ecf0f1",
      })
      .setOrigin(0.5);

    // Start button
    const startButton = this.add
      .rectangle(centerX, centerY, 200, 50, 0x27ae60)
      .setInteractive()
      .setStrokeStyle(2, 0x2ecc71);

    this.add
      .text(centerX, centerY, "START GAME", {
        fontSize: "18px",
        color: "#ecf0f1",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Tutorial button
    const tutorialButton = this.add
      .rectangle(centerX, centerY + 70, 200, 50, 0x3498db)
      .setInteractive()
      .setStrokeStyle(2, 0x5dade2);

    this.add
      .text(centerX, centerY + 70, "HOW TO PLAY", {
        fontSize: "18px",
        color: "#ecf0f1",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Button interactions
    startButton.on("pointerdown", () => {
      this.scene.start("GameScene");
    });

    startButton.on("pointerover", () => {
      startButton.setFillStyle(0x2ecc71);
    });

    startButton.on("pointerout", () => {
      startButton.setFillStyle(0x27ae60);
    });

    tutorialButton.on("pointerdown", () => {
      this.scene.start("TutorialScene");
    });

    tutorialButton.on("pointerover", () => {
      tutorialButton.setFillStyle(0x5dade2);
    });

    tutorialButton.on("pointerout", () => {
      tutorialButton.setFillStyle(0x3498db);
    });

    // Version/credit text
    this.add
      .text(centerX, this.cameras.main.height - 30, "Milestone 1 MVP", {
        fontSize: "12px",
        color: "#95a5a6",
      })
      .setOrigin(0.5);
  }
}