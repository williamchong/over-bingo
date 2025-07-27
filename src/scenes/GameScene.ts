import Phaser from "phaser";

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private bingoBoard: Phaser.GameObjects.Rectangle[][] = [];
  private playerPosition = { x: 2, y: 2 }; // Start in center of 5x5 grid
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private calledNumberText!: Phaser.GameObjects.Text;
  private currentCalledNumber = 7; // Starting number for testing (3+4)
  private numberStations: {
    x: number;
    y: number;
    number: number;
    obj: Phaser.GameObjects.Container;
  }[] = [];
  private processingStation: {
    x: number;
    y: number;
    obj: Phaser.GameObjects.Container;
    heldNumber: number | null;
  } | null = null;
  private playerHeldNumber: number | null = null;
  private heldNumberText!: Phaser.GameObjects.Text;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private boardState: (number | null)[][] = [];
  private placedNumberTexts: (Phaser.GameObjects.Text | null)[][] = [];

  private readonly GRID_SIZE = 5;
  private readonly CELL_SIZE = 80;
  private readonly BOARD_START_X = 200;
  private readonly BOARD_START_Y = 100;

  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    this.createBingoBoard();
    this.createPlayer();
    this.createNumberStations();
    this.createProcessingStation();
    this.createUI();
    this.setupInput();
  }

  private createBingoBoard() {
    // Initialize board state arrays
    for (let row = 0; row < this.GRID_SIZE; row++) {
      this.bingoBoard[row] = [];
      this.boardState[row] = [];
      this.placedNumberTexts[row] = [];

      for (let col = 0; col < this.GRID_SIZE; col++) {
        const x = this.BOARD_START_X + col * this.CELL_SIZE;
        const y = this.BOARD_START_Y + row * this.CELL_SIZE;

        const cell = this.add
          .rectangle(x, y, this.CELL_SIZE - 2, this.CELL_SIZE - 2, 0x34495e)
          .setStrokeStyle(2, 0x2c3e50);

        this.bingoBoard[row][col] = cell;
        this.boardState[row][col] = null;
        this.placedNumberTexts[row][col] = null;

        // Mark center cell as "FREE" space
        if (row === 2 && col === 2) {
          this.boardState[row][col] = -1; // Special value for FREE space
          this.add
            .text(x, y, "FREE", {
              fontSize: "16px",
              color: "#ecf0f1",
            })
            .setOrigin(0.5);
        }
      }
    }
  }

  private createPlayer() {
    const startX = this.BOARD_START_X + this.playerPosition.x * this.CELL_SIZE;
    const startY = this.BOARD_START_Y + this.playerPosition.y * this.CELL_SIZE;

    this.player = this.add.rectangle(startX, startY, 20, 20, 0xe74c3c);
  }

  private createNumberStations() {
    // Create number stations around the board for digits 0-9
    const stationPositions = [
      { x: 50, y: 250, number: 1 },
      { x: 50, y: 300, number: 2 },
      { x: 50, y: 350, number: 3 },
      { x: 650, y: 250, number: 4 },
      { x: 650, y: 300, number: 5 },
      { x: 650, y: 350, number: 6 },
      { x: 200, y: 500, number: 7 },
      { x: 300, y: 500, number: 8 },
      { x: 400, y: 500, number: 9 },
    ];

    stationPositions.forEach((station) => {
      const container = this.add.container(station.x, station.y);

      // Station background
      const bg = this.add.rectangle(0, 0, 60, 40, 0x27ae60);

      // Number display
      const numberText = this.add
        .text(0, 0, station.number.toString(), {
          fontSize: "20px",
          color: "#ecf0f1",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      container.add([bg, numberText]);

      this.numberStations.push({
        x: station.x,
        y: station.y,
        number: station.number,
        obj: container,
      });
    });
  }

  private createProcessingStation() {
    const stationX = 500;
    const stationY = 500;

    const container = this.add.container(stationX, stationY);

    // Station background
    const bg = this.add.rectangle(0, 0, 80, 60, 0x9b59b6);

    // Plus symbol
    const plusText = this.add
      .text(0, 0, "+", {
        fontSize: "32px",
        color: "#ecf0f1",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    container.add([bg, plusText]);

    this.processingStation = {
      x: stationX,
      y: stationY,
      obj: container,
      heldNumber: null,
    };
  }

  private createUI() {
    // Called number display
    this.add.text(50, 50, "Called Number:", {
      fontSize: "24px",
      color: "#ecf0f1",
    });

    this.calledNumberText = this.add.text(
      50,
      80,
      this.currentCalledNumber.toString(),
      {
        fontSize: "32px",
        color: "#f39c12",
        fontStyle: "bold",
      }
    );

    // Held number display
    this.add.text(50, 120, "Held Number:", {
      fontSize: "18px",
      color: "#ecf0f1",
    });

    this.heldNumberText = this.add.text(170, 120, "None", {
      fontSize: "18px",
      color: "#95a5a6",
    });

    // Instructions
    this.add.text(50, 160, "Arrow keys: Move", {
      fontSize: "14px",
      color: "#bdc3c7",
    });

    this.add.text(50, 180, "Space: Pick up/Drop number", {
      fontSize: "14px",
      color: "#bdc3c7",
    });

    this.add.text(50, 200, "Green stations: Number sources", {
      fontSize: "14px",
      color: "#bdc3c7",
    });

    this.add.text(50, 220, "Purple station: Addition (+)", {
      fontSize: "14px",
      color: "#bdc3c7",
    });
  }

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
  }

  update() {
    this.handlePlayerMovement();
    this.handleNumberInteraction();
  }

  private handlePlayerMovement() {
    let moved = false;

    if (
      Phaser.Input.Keyboard.JustDown(this.cursors.left!) &&
      this.playerPosition.x > 0
    ) {
      this.playerPosition.x--;
      moved = true;
    } else if (
      Phaser.Input.Keyboard.JustDown(this.cursors.right!) &&
      this.playerPosition.x < this.GRID_SIZE - 1
    ) {
      this.playerPosition.x++;
      moved = true;
    } else if (
      Phaser.Input.Keyboard.JustDown(this.cursors.up!) &&
      this.playerPosition.y > 0
    ) {
      this.playerPosition.y--;
      moved = true;
    } else if (
      Phaser.Input.Keyboard.JustDown(this.cursors.down!) &&
      this.playerPosition.y < this.GRID_SIZE - 1
    ) {
      this.playerPosition.y++;
      moved = true;
    }

    if (moved) {
      const newX = this.BOARD_START_X + this.playerPosition.x * this.CELL_SIZE;
      const newY = this.BOARD_START_Y + this.playerPosition.y * this.CELL_SIZE;

      this.player.setPosition(newX, newY);
    }
  }

  private handleNumberInteraction() {
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      // Check if player is near a number station
      const playerWorldX =
        this.BOARD_START_X + this.playerPosition.x * this.CELL_SIZE;
      const playerWorldY =
        this.BOARD_START_Y + this.playerPosition.y * this.CELL_SIZE;

      // Check number stations first
      for (const station of this.numberStations) {
        const distance = Phaser.Math.Distance.Between(
          playerWorldX,
          playerWorldY,
          station.x,
          station.y
        );

        if (distance < 100) {
          // Within range of station
          if (this.playerHeldNumber === null) {
            // Pick up number
            this.playerHeldNumber = station.number;
            this.updateHeldNumberDisplay();
            // Visual feedback removed for now
          }
          return;
        }
      }

      // Check processing station
      if (this.processingStation) {
        const distance = Phaser.Math.Distance.Between(
          playerWorldX,
          playerWorldY,
          this.processingStation.x,
          this.processingStation.y
        );

        if (distance < 100) {
          this.handleProcessingStationInteraction();
          return;
        }
      }

      // If not near any station and holding a number, try to place it on the board
      if (this.playerHeldNumber !== null) {
        this.tryPlaceNumberOnBoard();
      }
    }
  }

  private updateHeldNumberDisplay() {
    if (this.playerHeldNumber !== null) {
      this.heldNumberText.setText(this.playerHeldNumber.toString());
      this.heldNumberText.setColor("#f39c12");
    } else {
      this.heldNumberText.setText("None");
      this.heldNumberText.setColor("#95a5a6");
    }
  }

  private tryPlaceNumberOnBoard() {
    const row = this.playerPosition.y;
    const col = this.playerPosition.x;

    // Check if cell is already occupied
    if (this.boardState[row][col] !== null) {
      // Cell already has a number
      const currentCell = this.bingoBoard[row][col];
      currentCell.setFillStyle(0xff6b6b);
      this.time.delayedCall(500, () => {
        currentCell.setFillStyle(0x34495e);
      });
      return;
    }

    const currentCell = this.bingoBoard[row][col];

    if (this.playerHeldNumber === this.currentCalledNumber) {
      // Correct number! Place it
      const numberText = this.add
        .text(
          this.BOARD_START_X + col * this.CELL_SIZE,
          this.BOARD_START_Y + row * this.CELL_SIZE,
          this.playerHeldNumber.toString(),
          {
            fontSize: "24px",
            color: "#2ecc71",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

      // Update board state
      this.boardState[row][col] = this.playerHeldNumber;
      this.placedNumberTexts[row][col] = numberText;

      currentCell.setFillStyle(0x27ae60); // Green for correct placement
      this.playerHeldNumber = null;
      this.updateHeldNumberDisplay();

      // Check for bingo
      if (this.checkForBingo()) {
        this.handleBingo();
      } else {
        // Call a new number after a short delay
        this.time.delayedCall(2000, () => {
          this.callNewNumber();
        });
      }
    } else {
      // Wrong number - visual feedback but don't place
      currentCell.setFillStyle(0xff6b6b);
      this.time.delayedCall(500, () => {
        currentCell.setFillStyle(0x34495e);
      });
    }
  }

  private callNewNumber() {
    // Simple demo: cycle through numbers that can be made with addition
    // 7 = 3+4, 15 = 7+8, 8 = 3+5, 12 = 4+8, 9 = 4+5
    const testNumbers = [7, 15, 8, 12, 9];
    const currentIndex = testNumbers.indexOf(this.currentCalledNumber);
    const nextIndex = (currentIndex + 1) % testNumbers.length;

    this.currentCalledNumber = testNumbers[nextIndex];
    this.calledNumberText.setText(this.currentCalledNumber.toString());
  }

  private handleProcessingStationInteraction() {
    if (!this.processingStation) return;

    if (this.playerHeldNumber !== null) {
      if (this.processingStation.heldNumber === null) {
        // Place first number at station
        this.processingStation.heldNumber = this.playerHeldNumber;
        this.playerHeldNumber = null;
        this.updateHeldNumberDisplay();

        // Visual feedback removed for now
        this.add
          .text(
            this.processingStation.x - 20,
            this.processingStation.y + 40,
            this.processingStation.heldNumber.toString(),
            {
              fontSize: "16px",
              color: "#f1c40f",
              fontStyle: "bold",
            }
          )
          .setOrigin(0.5);
      } else {
        // Perform addition with second number
        const result =
          this.processingStation.heldNumber + this.playerHeldNumber;

        // Clear the station
        this.processingStation.heldNumber = null;

        // Give player the result
        this.playerHeldNumber = result;
        this.updateHeldNumberDisplay();

        // Visual feedback removed for now

        // Clear any number displays at the station
        // (In a full implementation, we'd track these text objects)
      }
    } else {
      // Pick up number from station if there is one
      if (this.processingStation.heldNumber !== null) {
        this.playerHeldNumber = this.processingStation.heldNumber;
        this.processingStation.heldNumber = null;
        this.updateHeldNumberDisplay();
      }
    }
  }

  private checkForBingo(): boolean {
    // Check rows
    for (let row = 0; row < this.GRID_SIZE; row++) {
      let hasRow = true;
      for (let col = 0; col < this.GRID_SIZE; col++) {
        if (this.boardState[row][col] === null) {
          hasRow = false;
          break;
        }
      }
      if (hasRow) return true;
    }

    // Check columns
    for (let col = 0; col < this.GRID_SIZE; col++) {
      let hasCol = true;
      for (let row = 0; row < this.GRID_SIZE; row++) {
        if (this.boardState[row][col] === null) {
          hasCol = false;
          break;
        }
      }
      if (hasCol) return true;
    }

    // Check diagonal (top-left to bottom-right)
    let hasDiag1 = true;
    for (let i = 0; i < this.GRID_SIZE; i++) {
      if (this.boardState[i][i] === null) {
        hasDiag1 = false;
        break;
      }
    }
    if (hasDiag1) return true;

    // Check diagonal (top-right to bottom-left)
    let hasDiag2 = true;
    for (let i = 0; i < this.GRID_SIZE; i++) {
      if (this.boardState[i][this.GRID_SIZE - 1 - i] === null) {
        hasDiag2 = false;
        break;
      }
    }
    if (hasDiag2) return true;

    return false;
  }

  private handleBingo() {
    // Create celebratory message
    this.add
      .text(400, 300, "BINGO!", {
        fontSize: "64px",
        color: "#f1c40f",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(400, 370, "Congratulations! You completed the board!", {
        fontSize: "20px",
        color: "#ecf0f1",
      })
      .setOrigin(0.5);

    this.add
      .text(400, 400, "Refresh to play again", {
        fontSize: "16px",
        color: "#bdc3c7",
      })
      .setOrigin(0.5);

    // Disable further input
    this.input.keyboard!.enabled = false;
  }
}
