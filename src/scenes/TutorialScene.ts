import Phaser from "phaser";

export class TutorialScene extends Phaser.Scene {
  private currentPage = 0;
  private readonly totalPages = 5;
  private pageContent: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: "TutorialScene" });
  }

  create() {
    this.createTutorialPages();
    this.createNavigation();
    this.showPage(0);
  }

  private createTutorialPages() {
    const centerX = this.cameras.main.width / 2;

    // Page 1: Basic Movement
    const page1 = this.add.container(0, 0);
    page1.add([
      this.add
        .text(centerX, 80, "HOW TO PLAY", {
          fontSize: "32px",
          color: "#f39c12",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
      this.add
        .text(centerX, 140, "Page 1: Movement & Goal", {
          fontSize: "20px",
          color: "#ecf0f1",
        })
        .setOrigin(0.5),
      this.add
        .text(
          centerX,
          200,
          "• Use ARROW KEYS or WASD to move around the 5x5 bingo board",
          {
            fontSize: "16px",
            color: "#bdc3c7",
          },
        )
        .setOrigin(0.5),
      this.add
        .text(
          centerX,
          230,
          "• Your goal is to complete a row, column, or diagonal",
          {
            fontSize: "16px",
            color: "#bdc3c7",
          },
        )
        .setOrigin(0.5),
      this.add
        .text(
          centerX,
          260,
          "• Board has numbers but most are hidden ('?' symbols)",
          {
            fontSize: "16px",
            color: "#bdc3c7",
          },
        )
        .setOrigin(0.5),
      this.add
        .text(
          centerX,
          290,
          "• Only 1-2 smallest numbers are visible at start",
          {
            fontSize: "16px",
            color: "#bdc3c7",
          },
        )
        .setOrigin(0.5),
      this.add
        .text(
          centerX,
          320,
          "• Claiming a cell reveals 1-5 random cells (count increases)",
          {
            fontSize: "16px",
            color: "#bdc3c7",
          },
        )
        .setOrigin(0.5),
    ]);
    this.pageContent.push(page1);

    // Page 2: Number Sources and Processing
    const page2 = this.add.container(0, 0);
    page2.add([
      this.add
        .text(centerX, 80, "HOW TO PLAY", {
          fontSize: "32px",
          color: "#f39c12",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
      this.add
        .text(centerX, 140, "Page 2: Number Sources & Processing", {
          fontSize: "20px",
          color: "#ecf0f1",
        })
        .setOrigin(0.5),
      this.add
        .text(centerX, 190, "GREEN STATIONS:", {
          fontSize: "18px",
          color: "#27ae60",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
      this.add
        .text(centerX, 220, "• Provide raw numbers (1-9)", {
          fontSize: "16px",
          color: "#bdc3c7",
        })
        .setOrigin(0.5),
      this.add
        .text(
          centerX,
          250,
          "• Stand near one and press SPACE or ENTER to pick up a number",
          {
            fontSize: "16px",
            color: "#bdc3c7",
          },
        )
        .setOrigin(0.5),
      this.add
        .text(centerX, 290, "PURPLE STATION:", {
          fontSize: "18px",
          color: "#9b59b6",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
      this.add
        .text(centerX, 320, "• Performs addition (+)", {
          fontSize: "16px",
          color: "#bdc3c7",
        })
        .setOrigin(0.5),
      this.add
        .text(
          centerX,
          350,
          "• Drop one number, then drop another to add them",
          {
            fontSize: "16px",
            color: "#bdc3c7",
          },
        )
        .setOrigin(0.5),
    ]);
    this.pageContent.push(page2);

    // Page 3: Gameplay Example
    const page3 = this.add.container(0, 0);
    page3.add([
      this.add
        .text(centerX, 80, "HOW TO PLAY", {
          fontSize: "32px",
          color: "#f39c12",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
      this.add
        .text(centerX, 140, "Page 3: Example", {
          fontSize: "20px",
          color: "#ecf0f1",
        })
        .setOrigin(0.5),
      this.add
        .text(centerX, 190, "Example: Early Game Strategy", {
          fontSize: "18px",
          color: "#f39c12",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
      this.add
        .text(
          centerX,
          230,
          "1. Look for revealed numbers (only 1-2 visible at start)",
          {
            fontSize: "16px",
            color: "#bdc3c7",
          },
        )
        .setOrigin(0.5),
      this.add
        .text(centerX, 260, "2. Say smallest revealed number is '7'", {
          fontSize: "16px",
          color: "#bdc3c7",
        })
        .setOrigin(0.5),
      this.add
        .text(centerX, 290, "3. Create the number 7 using math stations", {
          fontSize: "16px",
          color: "#bdc3c7",
        })
        .setOrigin(0.5),
      this.add
        .text(centerX, 320, "4. Stand on the '7' cell and claim it", {
          fontSize: "16px",
          color: "#bdc3c7",
        })
        .setOrigin(0.5),
      this.add
        .text(centerX, 350, "5. Random cells across the board are revealed!", {
          fontSize: "16px",
          color: "#bdc3c7",
        })
        .setOrigin(0.5),
      this.add
        .text(
          centerX,
          380,
          "6. Choose next target from newly revealed numbers",
          {
            fontSize: "16px",
            color: "#bdc3c7",
          },
        )
        .setOrigin(0.5),
    ]);
    this.pageContent.push(page3);

    // Page 4: Progressive Reveal System
    const page4 = this.add.container(0, 0);
    page4.add([
      this.add
        .text(centerX, 80, "HOW TO PLAY", {
          fontSize: "32px",
          color: "#f39c12",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
      this.add
        .text(centerX, 140, "Page 4: Discovery Mechanics", {
          fontSize: "20px",
          color: "#ecf0f1",
        })
        .setOrigin(0.5),
      this.add
        .text(centerX, 190, "HIDDEN vs REVEALED CELLS:", {
          fontSize: "18px",
          color: "#f39c12",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
      this.add
        .text(
          centerX,
          220,
          "• Hidden cells show '?' - you cannot claim these",
          {
            fontSize: "16px",
            color: "#bdc3c7",
          },
        )
        .setOrigin(0.5),
      this.add
        .text(
          centerX,
          250,
          "• Revealed cells show actual numbers - claimable",
          {
            fontSize: "16px",
            color: "#bdc3c7",
          },
        )
        .setOrigin(0.5),
      this.add
        .text(centerX, 290, "EXPANSION STRATEGY:", {
          fontSize: "18px",
          color: "#27ae60",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
      this.add
        .text(centerX, 320, "• Each claim reveals 1-5 random cells", {
          fontSize: "16px",
          color: "#bdc3c7",
        })
        .setOrigin(0.5),
      this.add
        .text(
          centerX,
          350,
          "• Plan claims to reveal areas with bingo potential",
          {
            fontSize: "16px",
            color: "#bdc3c7",
          },
        )
        .setOrigin(0.5),
      this.add
        .text(centerX, 380, "• Early game: focus on small, easy numbers", {
          fontSize: "16px",
          color: "#bdc3c7",
        })
        .setOrigin(0.5),
    ]);
    this.pageContent.push(page4);

    // Page 5: VS Mode
    const page5 = this.add.container(0, 0);
    page5.add([
      this.add
        .text(centerX, 80, "HOW TO PLAY", {
          fontSize: "32px",
          color: "#f39c12",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
      this.add
        .text(centerX, 140, "Page 5: VS Mode", {
          fontSize: "20px",
          color: "#ecf0f1",
        })
        .setOrigin(0.5),
      this.add
        .text(centerX, 190, "PLAYER 1 (RED):", {
          fontSize: "18px",
          color: "#e74c3c",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
      this.add
        .text(centerX, 220, "• WASD keys to move + SPACE to interact", {
          fontSize: "16px",
          color: "#bdc3c7",
        })
        .setOrigin(0.5),
      this.add
        .text(centerX, 250, "PLAYER 2 (BLUE):", {
          fontSize: "18px",
          color: "#3498db",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
      this.add
        .text(centerX, 280, "• Arrow Keys to move + ENTER to interact", {
          fontSize: "16px",
          color: "#bdc3c7",
        })
        .setOrigin(0.5),
      this.add
        .text(centerX, 320, "VS MODE RULES:", {
          fontSize: "18px",
          color: "#f39c12",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
      this.add
        .text(centerX, 350, "• First player to get BINGO wins!", {
          fontSize: "16px",
          color: "#bdc3c7",
        })
        .setOrigin(0.5),
      this.add
        .text(
          centerX,
          380,
          "• Each player's claims reveal random areas to explore",
          {
            fontSize: "16px",
            color: "#bdc3c7",
          },
        )
        .setOrigin(0.5),
      this.add
        .text(
          centerX,
          410,
          "• Random reveals create unpredictable opportunities",
          {
            fontSize: "16px",
            color: "#bdc3c7",
          },
        )
        .setOrigin(0.5),
    ]);
    this.pageContent.push(page5);
  }

  private createNavigation() {
    const centerX = this.cameras.main.width / 2;
    const bottomY = this.cameras.main.height - 80;

    // Previous button
    const prevButton = this.add
      .rectangle(centerX - 120, bottomY, 100, 40, 0x95a5a6)
      .setInteractive()
      .setStrokeStyle(2, 0xbdc3c7);

    this.add
      .text(centerX - 120, bottomY, "PREVIOUS", {
        fontSize: "14px",
        color: "#ecf0f1",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Next button
    const nextButton = this.add
      .rectangle(centerX + 120, bottomY, 100, 40, 0x3498db)
      .setInteractive()
      .setStrokeStyle(2, 0x5dade2);

    this.add
      .text(centerX + 120, bottomY, "NEXT", {
        fontSize: "14px",
        color: "#ecf0f1",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Start Game button (appears on last page)
    const startButton = this.add
      .rectangle(centerX, bottomY + 50, 150, 40, 0x27ae60)
      .setInteractive()
      .setStrokeStyle(2, 0x2ecc71)
      .setVisible(false);

    this.add
      .text(centerX, bottomY + 50, "CHOOSE MODE", {
        fontSize: "14px",
        color: "#ecf0f1",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Back to Menu button
    const menuButton = this.add
      .rectangle(centerX, bottomY + 50, 150, 40, 0xe74c3c)
      .setInteractive()
      .setStrokeStyle(2, 0xc0392b);

    this.add
      .text(centerX, bottomY + 50, "BACK TO MENU", {
        fontSize: "14px",
        color: "#ecf0f1",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Page indicator
    const pageIndicator = this.add
      .text(centerX, bottomY - 40, `1 / ${this.totalPages}`, {
        fontSize: "16px",
        color: "#95a5a6",
      })
      .setOrigin(0.5);

    // Button interactions
    prevButton.on("pointerdown", () => {
      if (this.currentPage > 0) {
        this.currentPage--;
        this.showPage(this.currentPage);
        pageIndicator.setText(`${this.currentPage + 1} / ${this.totalPages}`);
        startButton.setVisible(this.currentPage === this.totalPages - 1);
      }
    });

    nextButton.on("pointerdown", () => {
      if (this.currentPage < this.totalPages - 1) {
        this.currentPage++;
        this.showPage(this.currentPage);
        pageIndicator.setText(`${this.currentPage + 1} / ${this.totalPages}`);
        startButton.setVisible(this.currentPage === this.totalPages - 1);
      }
    });

    startButton.on("pointerdown", () => {
      this.scene.start("StartScene");
    });

    menuButton.on("pointerdown", () => {
      this.scene.start("StartScene");
    });

    // Hover effects
    [prevButton, nextButton, startButton, menuButton].forEach((button) => {
      button.on("pointerover", () => {
        button.setScale(1.05);
      });
      button.on("pointerout", () => {
        button.setScale(1);
      });
    });
  }

  private showPage(pageIndex: number) {
    this.pageContent.forEach((page, index) => {
      page.setVisible(index === pageIndex);
    });
  }
}
