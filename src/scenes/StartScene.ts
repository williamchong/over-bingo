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

    // VS Mode button
    const vsButton = this.add
      .rectangle(centerX, centerY - 30, 200, 50, 0x27ae60)
      .setInteractive()
      .setStrokeStyle(2, 0x2ecc71);

    this.add
      .text(centerX, centerY - 30, "VS MODE", {
        fontSize: "18px",
        color: "#ecf0f1",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Single Player button
    const singleButton = this.add
      .rectangle(centerX, centerY + 40, 200, 50, 0xe67e22)
      .setInteractive()
      .setStrokeStyle(2, 0xf39c12);

    this.add
      .text(centerX, centerY + 40, "SINGLE PLAYER", {
        fontSize: "18px",
        color: "#ecf0f1",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Tutorial button
    const tutorialButton = this.add
      .rectangle(centerX, centerY + 110, 200, 50, 0x3498db)
      .setInteractive()
      .setStrokeStyle(2, 0x5dade2);

    this.add
      .text(centerX, centerY + 110, "HOW TO PLAY", {
        fontSize: "18px",
        color: "#ecf0f1",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Button interactions
    vsButton.on("pointerdown", () => {
      this.scene.start("GameScene", { gameMode: "vs" });
    });

    vsButton.on("pointerover", () => {
      vsButton.setFillStyle(0x2ecc71);
    });

    vsButton.on("pointerout", () => {
      vsButton.setFillStyle(0x27ae60);
    });

    singleButton.on("pointerdown", () => {
      this.scene.start("GameScene", { gameMode: "single" });
    });

    singleButton.on("pointerover", () => {
      singleButton.setFillStyle(0xf39c12);
    });

    singleButton.on("pointerout", () => {
      singleButton.setFillStyle(0xe67e22);
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

    // Version/credit text (clickable)
    const versionText = this.add
      .text(centerX, this.cameras.main.height - 30, "Full Release v1.0", {
        fontSize: "12px",
        color: "#95a5a6",
      })
      .setOrigin(0.5)
      .setInteractive();

    // Add hover effects for the version text
    versionText.on("pointerover", () => {
      versionText.setStyle({ color: "#3498db" });
      this.input.setDefaultCursor("pointer");
    });

    versionText.on("pointerout", () => {
      versionText.setStyle({ color: "#95a5a6" });
      this.input.setDefaultCursor("default");
    });

    // Open GitHub repo when clicked
    versionText.on("pointerdown", () => {
      window.open("https://github.com/williamchong/over-bingo", "_blank");
    });
  }
}
