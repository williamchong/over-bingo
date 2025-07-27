import Phaser from "phaser";

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerRect!: Phaser.GameObjects.Rectangle;
  private playerNumberText!: Phaser.GameObjects.Text;
  private bingoBoard: Phaser.GameObjects.Rectangle[][] = [];
  private playerPosition = { x: 2, y: 2 }; // Start in center of 5x5 grid
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private calledNumberText!: Phaser.GameObjects.Text;
  private currentCalledNumber: number = 0;
  private numberStations: {
    x: number;
    y: number;
    number: number;
    obj: Phaser.GameObjects.Container;
  }[] = [];
  private processingStations: {
    x: number;
    y: number;
    obj: Phaser.GameObjects.Container;
    heldNumber: number | null;
    numberText: Phaser.GameObjects.Text | null;
    operation: string;
  }[] = [];
  private rubbishBin: {
    x: number;
    y: number;
    obj: Phaser.GameObjects.Container;
  } | null = null;
  private playerHeldNumber: number | null = null;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private boardState: (number | null)[][] = [];
  private placedNumberTexts: (Phaser.GameObjects.Text | null)[][] = [];

  // Timer system
  private startTime: number = 0;
  private currentTime: number = 0;
  private timerText!: Phaser.GameObjects.Text;
  private gameStarted: boolean = false;

  private readonly GRID_SIZE = 5;
  private readonly CELL_SIZE = 80;
  private readonly EXTENDED_GRID_SIZE = 7; // 5x5 board + 1 cell on each side for stations
  private readonly BOARD_START_X = (800 - 4 * 80) / 2; // Center the 5x5 board horizontally
  private readonly BOARD_START_Y = (600 - 5 * 80) / 2; // Center the 5x5 board vertically
  private readonly EXTENDED_START_X = this.BOARD_START_X - this.CELL_SIZE; // Extended grid starts 1 cell to the left
  private readonly EXTENDED_START_Y = this.BOARD_START_Y - this.CELL_SIZE; // Extended grid starts 1 cell above

  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    // Start timer immediately when scene loads
    this.gameStarted = true;
    this.startTime = this.time.now;
    this.currentTime = 0;

    // Initialize with first random number
    this.currentCalledNumber = this.generateRandomNumber();

    this.createBingoBoard();
    this.createNumberStations();
    this.createProcessingStations();
    this.createRubbishBin();
    this.createPlayer(); // Create player last so it renders on top
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
    // Start player in center of the bingo board (position 3,3 in extended grid)
    this.playerPosition = { x: 3, y: 3 };
    const startX =
      this.EXTENDED_START_X + this.playerPosition.x * this.CELL_SIZE;
    const startY =
      this.EXTENDED_START_Y + this.playerPosition.y * this.CELL_SIZE;

    // Create player container
    this.player = this.add.container(startX, startY);

    // Player rectangle (semi-transparent)
    this.playerRect = this.add.rectangle(0, 0, 20, 20, 0xe74c3c);
    this.playerRect.setAlpha(0.7); // Make player semi-transparent

    // Number text (initially hidden)
    this.playerNumberText = this.add
      .text(0, -15, "", {
        fontSize: "12px",
        color: "#f1c40f",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setVisible(false);

    // Add components to container
    this.player.add([this.playerRect, this.playerNumberText]);
  }

  private createNumberStations() {
    // Create number stations evenly distributed: 3 numbers per side (avoiding operation station positions)
    const stationPositions = [
      // Left side - 3 numbers (avoiding rows 0 and 4 where operation stations are)
      {
        x: this.BOARD_START_X - this.CELL_SIZE,
        y: this.BOARD_START_Y + 1 * this.CELL_SIZE,
        number: 1,
      },
      {
        x: this.BOARD_START_X - this.CELL_SIZE,
        y: this.BOARD_START_Y + 2 * this.CELL_SIZE,
        number: 2,
      },
      {
        x: this.BOARD_START_X - this.CELL_SIZE,
        y: this.BOARD_START_Y + 3 * this.CELL_SIZE,
        number: 3,
      },

      // Right side - 3 numbers (avoiding rows 0 and 4 where operation stations are)
      {
        x: this.BOARD_START_X + 5 * this.CELL_SIZE,
        y: this.BOARD_START_Y + 1 * this.CELL_SIZE,
        number: 4,
      },
      {
        x: this.BOARD_START_X + 5 * this.CELL_SIZE,
        y: this.BOARD_START_Y + 2 * this.CELL_SIZE,
        number: 5,
      },
      {
        x: this.BOARD_START_X + 5 * this.CELL_SIZE,
        y: this.BOARD_START_Y + 3 * this.CELL_SIZE,
        number: 6,
      },

      // Bottom side - 3 numbers (no operation stations on bottom side)
      {
        x: this.BOARD_START_X + 1 * this.CELL_SIZE,
        y: this.BOARD_START_Y + 5 * this.CELL_SIZE,
        number: 7,
      },
      {
        x: this.BOARD_START_X + 2 * this.CELL_SIZE,
        y: this.BOARD_START_Y + 5 * this.CELL_SIZE,
        number: 8,
      },
      {
        x: this.BOARD_START_X + 3 * this.CELL_SIZE,
        y: this.BOARD_START_Y + 5 * this.CELL_SIZE,
        number: 9,
      },
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

  private createProcessingStations() {
    const stations = [
      // Operation stations on left and right sides only, relative to centered board
      {
        x: this.BOARD_START_X - this.CELL_SIZE,
        y: this.BOARD_START_Y + 0 * this.CELL_SIZE,
        operation: "+",
        color: 0x9b59b6,
      }, // Left side, top position
      {
        x: this.BOARD_START_X - this.CELL_SIZE,
        y: this.BOARD_START_Y + 4 * this.CELL_SIZE,
        operation: "-",
        color: 0xe67e22,
      }, // Left side, bottom position
      {
        x: this.BOARD_START_X + 5 * this.CELL_SIZE,
        y: this.BOARD_START_Y + 0 * this.CELL_SIZE,
        operation: "×",
        color: 0x2980b9,
      }, // Right side, top position
      {
        x: this.BOARD_START_X + 5 * this.CELL_SIZE,
        y: this.BOARD_START_Y + 4 * this.CELL_SIZE,
        operation: "÷",
        color: 0x8e44ad,
      }, // Right side, bottom position - Purple (different shade)
    ];

    stations.forEach((stationData) => {
      const container = this.add.container(stationData.x, stationData.y);

      // Station background
      const bg = this.add.rectangle(0, 0, 60, 50, stationData.color);

      // Operation symbol
      const operationText = this.add
        .text(0, 0, stationData.operation, {
          fontSize: "24px",
          color: "#ecf0f1",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      container.add([bg, operationText]);

      this.processingStations.push({
        x: stationData.x,
        y: stationData.y,
        obj: container,
        heldNumber: null,
        numberText: null,
        operation: stationData.operation,
      });
    });
  }

  private createRubbishBin() {
    // Position rubbish bin relative to centered board
    const binX = this.BOARD_START_X + 4 * this.CELL_SIZE;
    const binY = this.BOARD_START_Y + 5 * this.CELL_SIZE;

    const container = this.add.container(binX, binY);

    // Bin background (dark gray)
    const bg = this.add.rectangle(0, 0, 70, 70, 0x34495e);

    // Bin lid (slightly lighter)
    const lid = this.add.rectangle(0, -25, 80, 15, 0x5d6d7e);

    // Trash symbol
    const trashText = this.add
      .text(0, 5, "🗑", {
        fontSize: "24px",
      })
      .setOrigin(0.5);

    container.add([bg, lid, trashText]);

    this.rubbishBin = {
      x: binX,
      y: binY,
      obj: container,
    };
  }

  private createUI() {
    // Called number display - centered at top, well above the board
    const centerX = this.cameras.main.width / 2;

    this.add
      .text(centerX, 20, "Called Number:", {
        fontSize: "18px",
        color: "#ecf0f1",
      })
      .setOrigin(0.5);

    this.calledNumberText = this.add
      .text(centerX, 45, this.currentCalledNumber.toString(), {
        fontSize: "32px",
        color: "#f39c12",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Timer display (top right)
    this.timerText = this.add
      .text(this.cameras.main.width - 20, 20, "Time: 0:00", {
        fontSize: "18px",
        color: "#ecf0f1",
        fontStyle: "bold",
      })
      .setOrigin(1, 0);

    // Game controls reminder at bottom
    this.add
      .text(centerX, this.cameras.main.height - 30, "Space: Interact", {
        fontSize: "14px",
        color: "#bdc3c7",
      })
      .setOrigin(0.5);
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
    this.updateTimer();
  }

  private updateTimer() {
    if (!this.gameStarted) {
      this.timerText.setText("Time: 0:00");
      return;
    }

    this.currentTime = this.time.now - this.startTime;
    const seconds = Math.floor(this.currentTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const displaySeconds = seconds % 60;

    const timeString = `Time: ${minutes}:${displaySeconds.toString().padStart(2, "0")}`;
    this.timerText.setText(timeString);
  }

  private startTimer() {
    if (!this.gameStarted) {
      this.gameStarted = true;
      this.startTime = this.time.now;
    }
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
      this.playerPosition.x < this.EXTENDED_GRID_SIZE - 1
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
      this.playerPosition.y < this.EXTENDED_GRID_SIZE - 1
    ) {
      this.playerPosition.y++;
      moved = true;
    }

    if (moved) {
      const newX =
        this.EXTENDED_START_X + this.playerPosition.x * this.CELL_SIZE;
      const newY =
        this.EXTENDED_START_Y + this.playerPosition.y * this.CELL_SIZE;

      this.player.setPosition(newX, newY);
    }
  }

  private handleNumberInteraction() {
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      const playerWorldX =
        this.EXTENDED_START_X + this.playerPosition.x * this.CELL_SIZE;
      const playerWorldY =
        this.EXTENDED_START_Y + this.playerPosition.y * this.CELL_SIZE;

      // Check if standing exactly on a number station
      for (const station of this.numberStations) {
        if (playerWorldX === station.x && playerWorldY === station.y) {
          if (this.playerHeldNumber === null) {
            // Pick up number
            this.playerHeldNumber = station.number;
            this.updateHeldNumberDisplay();
          }
          return;
        }
      }

      // Check if standing exactly on a processing station
      for (const station of this.processingStations) {
        if (playerWorldX === station.x && playerWorldY === station.y) {
          this.handleProcessingStationInteraction(station);
          return;
        }
      }

      // Check if standing exactly on rubbish bin
      if (
        this.rubbishBin &&
        playerWorldX === this.rubbishBin.x &&
        playerWorldY === this.rubbishBin.y
      ) {
        this.handleRubbishBinInteraction();
        return;
      }

      // If standing on the bingo board and holding a number, try to place it
      if (this.playerHeldNumber !== null && this.isOnBingoBoard()) {
        this.tryPlaceNumberOnBoard();
      }
    }
  }

  private isOnBingoBoard(): boolean {
    // Check if player is within the 5x5 bingo board area (positions 1-5 in extended grid)
    return (
      this.playerPosition.x >= 1 &&
      this.playerPosition.x <= 5 &&
      this.playerPosition.y >= 1 &&
      this.playerPosition.y <= 5
    );
  }

  private updateHeldNumberDisplay() {
    if (this.playerHeldNumber !== null) {
      this.playerNumberText.setText(this.playerHeldNumber.toString());
      this.playerNumberText.setVisible(true);
    } else {
      this.playerNumberText.setVisible(false);
    }
  }

  private tryPlaceNumberOnBoard() {
    // Convert extended grid position to bingo board position
    const row = this.playerPosition.y - 1; // Extended grid is offset by 1
    const col = this.playerPosition.x - 1; // Extended grid is offset by 1

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
        // Call a new number immediately after successful placement
        this.callNewNumber();
      }
    } else {
      // Wrong number - visual feedback but don't place
      currentCell.setFillStyle(0xff6b6b);
      this.time.delayedCall(500, () => {
        currentCell.setFillStyle(0x34495e);
      });
    }
  }

  private generateRandomNumber(): number {
    // Generate random number between 1 and 25 (reasonable range for bingo)
    return Math.floor(Math.random() * 25) + 1;
  }

  private callNewNumber() {
    this.currentCalledNumber = this.generateRandomNumber();
    this.calledNumberText.setText(this.currentCalledNumber.toString());

    // Shuffle station positions when new number is called
    this.shuffleNumberStations();
    this.shuffleOperationStations();
  }

  private shuffleNumberStations() {
    // Get all number station positions
    const positions = [
      // Left side positions
      {
        x: this.BOARD_START_X - this.CELL_SIZE,
        y: this.BOARD_START_Y + 1 * this.CELL_SIZE,
      },
      {
        x: this.BOARD_START_X - this.CELL_SIZE,
        y: this.BOARD_START_Y + 2 * this.CELL_SIZE,
      },
      {
        x: this.BOARD_START_X - this.CELL_SIZE,
        y: this.BOARD_START_Y + 3 * this.CELL_SIZE,
      },

      // Right side positions
      {
        x: this.BOARD_START_X + 5 * this.CELL_SIZE,
        y: this.BOARD_START_Y + 1 * this.CELL_SIZE,
      },
      {
        x: this.BOARD_START_X + 5 * this.CELL_SIZE,
        y: this.BOARD_START_Y + 2 * this.CELL_SIZE,
      },
      {
        x: this.BOARD_START_X + 5 * this.CELL_SIZE,
        y: this.BOARD_START_Y + 3 * this.CELL_SIZE,
      },

      // Bottom side positions
      {
        x: this.BOARD_START_X + 1 * this.CELL_SIZE,
        y: this.BOARD_START_Y + 5 * this.CELL_SIZE,
      },
      {
        x: this.BOARD_START_X + 2 * this.CELL_SIZE,
        y: this.BOARD_START_Y + 5 * this.CELL_SIZE,
      },
      {
        x: this.BOARD_START_X + 3 * this.CELL_SIZE,
        y: this.BOARD_START_Y + 5 * this.CELL_SIZE,
      },
    ];

    // Shuffle the positions array
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // Update station positions
    this.numberStations.forEach((station, index) => {
      station.x = positions[index].x;
      station.y = positions[index].y;
      station.obj.setPosition(station.x, station.y);
    });
  }

  private shuffleOperationStations() {
    // Get all operation station positions
    const positions = [
      {
        x: this.BOARD_START_X - this.CELL_SIZE,
        y: this.BOARD_START_Y + 0 * this.CELL_SIZE,
      }, // Left top
      {
        x: this.BOARD_START_X - this.CELL_SIZE,
        y: this.BOARD_START_Y + 4 * this.CELL_SIZE,
      }, // Left bottom
      {
        x: this.BOARD_START_X + 5 * this.CELL_SIZE,
        y: this.BOARD_START_Y + 0 * this.CELL_SIZE,
      }, // Right top
      {
        x: this.BOARD_START_X + 5 * this.CELL_SIZE,
        y: this.BOARD_START_Y + 4 * this.CELL_SIZE,
      }, // Right bottom
    ];

    // Shuffle the positions array
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // Update operation station positions
    this.processingStations.forEach((station, index) => {
      station.x = positions[index].x;
      station.y = positions[index].y;
      station.obj.setPosition(station.x, station.y);

      // If station has a number display, update its position too
      if (station.numberText) {
        station.numberText.setPosition(station.x - 20, station.y + 35);
      }
    });
  }

  private handleProcessingStationInteraction(station: {
    x: number;
    y: number;
    obj: Phaser.GameObjects.Container;
    heldNumber: number | null;
    numberText: Phaser.GameObjects.Text | null;
    operation: string;
  }) {
    if (this.playerHeldNumber !== null) {
      if (station.heldNumber === null) {
        // Place first number at station
        station.heldNumber = this.playerHeldNumber;
        this.playerHeldNumber = null;
        this.updateHeldNumberDisplay();

        // Create and store the number display text
        station.numberText = this.add
          .text(station.x - 20, station.y + 35, station.heldNumber.toString(), {
            fontSize: "14px",
            color: "#f1c40f",
            fontStyle: "bold",
          })
          .setOrigin(0.5);
      } else {
        // Perform operation with second number
        let result: number;

        switch (station.operation) {
          case "+":
            result = station.heldNumber + this.playerHeldNumber;
            break;
          case "-":
            result = station.heldNumber - this.playerHeldNumber;
            break;
          case "×":
            result = station.heldNumber * this.playerHeldNumber;
            break;
          case "÷":
            result = Math.floor(station.heldNumber / this.playerHeldNumber);
            break;
          default:
            result = station.heldNumber + this.playerHeldNumber;
        }

        // Clear the station number and display
        station.heldNumber = null;
        if (station.numberText) {
          station.numberText.destroy();
          station.numberText = null;
        }

        // Give player the result
        this.playerHeldNumber = result;
        this.updateHeldNumberDisplay();
      }
    } else {
      // Pick up number from station if there is one
      if (station.heldNumber !== null) {
        this.playerHeldNumber = station.heldNumber;
        station.heldNumber = null;

        // Clear the number display
        if (station.numberText) {
          station.numberText.destroy();
          station.numberText = null;
        }

        this.updateHeldNumberDisplay();
      }
    }
  }

  private handleRubbishBinInteraction() {
    if (!this.rubbishBin) return;

    // Only allow disposing if player is holding a number
    if (this.playerHeldNumber !== null) {
      // Visual feedback - flash the bin
      const binObj = this.rubbishBin.obj;
      binObj.setScale(1.1);

      // Create disposal effect
      const disposalText = this.add
        .text(
          this.rubbishBin.x,
          this.rubbishBin.y - 40,
          "-" + this.playerHeldNumber,
          {
            fontSize: "16px",
            color: "#e74c3c",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);

      // Animate disposal text
      this.tweens.add({
        targets: disposalText,
        y: this.rubbishBin.y - 80,
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          disposalText.destroy();
        },
      });

      // Reset bin scale
      this.time.delayedCall(200, () => {
        binObj.setScale(1);
      });

      // Destroy the held number
      this.playerHeldNumber = null;
      this.updateHeldNumberDisplay();
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
    // Stop the timer
    this.gameStarted = false;

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Create full-screen dark overlay
    const fullOverlay = this.add
      .rectangle(
        centerX,
        centerY,
        this.cameras.main.width,
        this.cameras.main.height,
        0x000000
      )
      .setAlpha(0.7)
      .setOrigin(0.5);

    // Create modal dialog background (increased height for completion time)
    const modalBg = this.add
      .rectangle(centerX, centerY, 450, 420, 0x34495e)
      .setOrigin(0.5)
      .setStrokeStyle(4, 0x2c3e50);

    // Create celebratory message with better spacing
    this.add
      .text(centerX, centerY - 80, "🎉 BINGO! 🎉", {
        fontSize: "48px",
        color: "#f1c40f",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY - 20, "Congratulations!", {
        fontSize: "24px",
        color: "#ecf0f1",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 10, "You completed the board!", {
        fontSize: "18px",
        color: "#bdc3c7",
      })
      .setOrigin(0.5);

    // Display completion time
    const completionTime = this.currentTime;
    const seconds = Math.floor(completionTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const displaySeconds = seconds % 60;
    const timeString = `${minutes}:${displaySeconds.toString().padStart(2, "0")}`;

    this.add
      .text(centerX, centerY + 40, `Completion Time: ${timeString}`, {
        fontSize: "20px",
        color: "#f39c12",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Play again button with better positioning (adjusted for completion time)
    const playAgainButton = this.add
      .rectangle(centerX, centerY + 100, 180, 50, 0x27ae60)
      .setInteractive()
      .setStrokeStyle(3, 0x2ecc71)
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 100, "PLAY AGAIN", {
        fontSize: "18px",
        color: "#ecf0f1",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Menu button with better positioning (adjusted for completion time)
    const menuButton = this.add
      .rectangle(centerX, centerY + 160, 180, 50, 0xe74c3c)
      .setInteractive()
      .setStrokeStyle(3, 0xc0392b)
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 160, "MAIN MENU", {
        fontSize: "18px",
        color: "#ecf0f1",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Button interactions
    playAgainButton.on("pointerdown", () => {
      this.scene.restart();
    });

    menuButton.on("pointerdown", () => {
      this.scene.start("StartScene");
    });

    // Hover effects
    [playAgainButton, menuButton].forEach((button) => {
      button.on("pointerover", () => {
        button.setScale(1.05);
      });
      button.on("pointerout", () => {
        button.setScale(1);
      });
    });

    // Disable movement input only
    this.cursors.left!.enabled = false;
    this.cursors.right!.enabled = false;
    this.cursors.up!.enabled = false;
    this.cursors.down!.enabled = false;
  }
}
