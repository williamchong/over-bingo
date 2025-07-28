import Phaser from "phaser";

export class GameScene extends Phaser.Scene {
  private player1!: Phaser.GameObjects.Container;
  private player1Rect!: Phaser.GameObjects.Rectangle;
  private player1NumberText!: Phaser.GameObjects.Text;
  private player2!: Phaser.GameObjects.Container;
  private player2Rect!: Phaser.GameObjects.Rectangle;
  private player2NumberText!: Phaser.GameObjects.Text;
  private bingoBoard: Phaser.GameObjects.Rectangle[][] = [];
  private player1Position = { x: 2, y: 2 };
  private player2Position = { x: 3, y: 3 };
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
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
  private player1HeldNumber: number | null = null;
  private player2HeldNumber: number | null = null;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private boardState: (number | "p1" | "p2" | null)[][] = [];
  private placedNumberTexts: (Phaser.GameObjects.Text | null)[][] = [];
  private gameMode: "single" | "vs" = "single";
  private isEndgameMode: boolean = false;

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

  create(data?: { gameMode?: string }) {
    // Set game mode from scene data
    this.gameMode = (data?.gameMode as "single" | "vs") || "single";
    this.isEndgameMode = false;

    // Start timer only for single player mode
    if (this.gameMode === "single") {
      this.gameStarted = true;
      this.startTime = this.time.now;
      this.currentTime = 0;
    } else {
      this.gameStarted = false;
    }

    // Initialize with first random number
    this.currentCalledNumber = this.generateRandomNumber();

    this.createBingoBoard();
    this.createNumberStations();
    this.createProcessingStations();
    this.createRubbishBin();
    this.createPlayers();
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

  private createPlayers() {
    if (this.gameMode === "single") {
      // Single player mode - only create player 1
      this.player1Position = { x: 3, y: 3 };
      const startX =
        this.EXTENDED_START_X + this.player1Position.x * this.CELL_SIZE;
      const startY =
        this.EXTENDED_START_Y + this.player1Position.y * this.CELL_SIZE;

      this.player1 = this.add.container(startX, startY);
      this.player1Rect = this.add.rectangle(0, 0, 20, 20, 0xe74c3c);
      this.player1Rect.setAlpha(0.7);

      this.player1NumberText = this.add
        .text(0, -15, "", {
          fontSize: "12px",
          color: "#f1c40f",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setVisible(false);

      this.player1.add([this.player1Rect, this.player1NumberText]);
    } else {
      // VS mode - create both players
      // Player 1 (red, WASD+Space)
      this.player1Position = { x: 2, y: 2 };
      const p1StartX =
        this.EXTENDED_START_X + this.player1Position.x * this.CELL_SIZE;
      const p1StartY =
        this.EXTENDED_START_Y + this.player1Position.y * this.CELL_SIZE;

      this.player1 = this.add.container(p1StartX, p1StartY);
      this.player1Rect = this.add.rectangle(0, 0, 18, 18, 0xe74c3c);
      this.player1Rect.setAlpha(0.8);

      this.player1NumberText = this.add
        .text(0, -15, "", {
          fontSize: "11px",
          color: "#f1c40f",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setVisible(false);

      this.player1.add([this.player1Rect, this.player1NumberText]);

      // Player 2 (blue, Arrow+Enter)
      this.player2Position = { x: 3, y: 3 };
      const p2StartX =
        this.EXTENDED_START_X + this.player2Position.x * this.CELL_SIZE;
      const p2StartY =
        this.EXTENDED_START_Y + this.player2Position.y * this.CELL_SIZE;

      this.player2 = this.add.container(p2StartX, p2StartY);
      this.player2Rect = this.add.rectangle(0, 0, 18, 18, 0x3498db);
      this.player2Rect.setAlpha(0.8);

      this.player2NumberText = this.add
        .text(0, -15, "", {
          fontSize: "11px",
          color: "#f39c12",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setVisible(false);

      this.player2.add([this.player2Rect, this.player2NumberText]);
    }
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

      // Station background with bounded green intensity range for better readability
      // Map numbers 1-9 to green range 80-200 (instead of 0-255) for better contrast
      const minGreen = 80;
      const maxGreen = 200;
      const greenRange = maxGreen - minGreen;
      const greenIntensity =
        minGreen + Math.floor(((10 - station.number) / 9) * greenRange);
      const greenColor = (greenIntensity << 8) | 0x001000; // Green channel + minimal base
      const bg = this.add.rectangle(0, 0, 60, 40, greenColor);

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

    if (this.gameMode === "single") {
      // Timer display (top right) - single player only
      this.timerText = this.add
        .text(this.cameras.main.width - 20, 20, "Time: 0:00", {
          fontSize: "18px",
          color: "#ecf0f1",
          fontStyle: "bold",
        })
        .setOrigin(1, 0);

      // Single player controls
      this.add
        .text(
          centerX,
          this.cameras.main.height - 30,
          "Arrow Keys/WASD: Move • Space/Enter: Interact",
          {
            fontSize: "14px",
            color: "#bdc3c7",
          },
        )
        .setOrigin(0.5);
    } else {
      // VS mode - show player indicators
      this.add
        .text(20, 20, "Player 1", {
          fontSize: "18px",
          color: "#e74c3c",
          fontStyle: "bold",
        })
        .setOrigin(0, 0);

      this.add
        .text(20, 40, "WASD + Space", {
          fontSize: "12px",
          color: "#bdc3c7",
        })
        .setOrigin(0, 0);

      this.add
        .text(this.cameras.main.width - 20, 20, "Player 2", {
          fontSize: "18px",
          color: "#3498db",
          fontStyle: "bold",
        })
        .setOrigin(1, 0);

      this.add
        .text(this.cameras.main.width - 20, 40, "Arrows + Enter", {
          fontSize: "12px",
          color: "#bdc3c7",
        })
        .setOrigin(1, 0);

      // VS mode controls reminder
      this.add
        .text(
          centerX,
          this.cameras.main.height - 30,
          "First to get BINGO wins! Block opponents by placing numbers.",
          {
            fontSize: "14px",
            color: "#bdc3c7",
          },
        )
        .setOrigin(0.5);
    }
  }

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = this.input.keyboard!.addKeys("W,S,A,D") as {
      W: Phaser.Input.Keyboard.Key;
      A: Phaser.Input.Keyboard.Key;
      S: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
    };
    this.spaceKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );
    this.enterKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER,
    );
  }

  update() {
    this.handlePlayerMovement();
    this.handleNumberInteraction();
    if (this.gameMode === "single") {
      this.updateTimer();
    }
  }

  private updateTimer() {
    if (!this.gameStarted) {
      this.timerText.setText("Time: 0:00");
      return;
    }

    // HACK: Not sure why this.time.now is 0 in create()
    if (!this.startTime) {
      this.startTime = this.time.now;
    }
    this.currentTime = this.time.now - this.startTime;
    const seconds = Math.floor(this.currentTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const displaySeconds = seconds % 60;

    const timeString = `Time: ${minutes}:${displaySeconds.toString().padStart(2, "0")}`;
    this.timerText.setText(timeString);
  }

  private handlePlayerMovement() {
    if (this.gameMode === "single") {
      // Single player movement (both WASD and Arrow keys)
      let moved = false;

      if (
        (Phaser.Input.Keyboard.JustDown(this.cursors.left!) ||
          Phaser.Input.Keyboard.JustDown(this.wasdKeys.A)) &&
        this.player1Position.x > 0
      ) {
        this.player1Position.x--;
        moved = true;
      } else if (
        (Phaser.Input.Keyboard.JustDown(this.cursors.right!) ||
          Phaser.Input.Keyboard.JustDown(this.wasdKeys.D)) &&
        this.player1Position.x < this.EXTENDED_GRID_SIZE - 1
      ) {
        this.player1Position.x++;
        moved = true;
      } else if (
        (Phaser.Input.Keyboard.JustDown(this.cursors.up!) ||
          Phaser.Input.Keyboard.JustDown(this.wasdKeys.W)) &&
        this.player1Position.y > 0
      ) {
        this.player1Position.y--;
        moved = true;
      } else if (
        (Phaser.Input.Keyboard.JustDown(this.cursors.down!) ||
          Phaser.Input.Keyboard.JustDown(this.wasdKeys.S)) &&
        this.player1Position.y < this.EXTENDED_GRID_SIZE - 1
      ) {
        this.player1Position.y++;
        moved = true;
      }

      if (moved) {
        const newX =
          this.EXTENDED_START_X + this.player1Position.x * this.CELL_SIZE;
        const newY =
          this.EXTENDED_START_Y + this.player1Position.y * this.CELL_SIZE;
        this.player1.setPosition(newX, newY);
      }
    } else {
      // VS mode - separate controls for each player
      let p1Moved = false;
      let p2Moved = false;

      // Player 1 movement (WASD)
      if (
        Phaser.Input.Keyboard.JustDown(this.wasdKeys.A) &&
        this.player1Position.x > 0
      ) {
        this.player1Position.x--;
        p1Moved = true;
      } else if (
        Phaser.Input.Keyboard.JustDown(this.wasdKeys.D) &&
        this.player1Position.x < this.EXTENDED_GRID_SIZE - 1
      ) {
        this.player1Position.x++;
        p1Moved = true;
      } else if (
        Phaser.Input.Keyboard.JustDown(this.wasdKeys.W) &&
        this.player1Position.y > 0
      ) {
        this.player1Position.y--;
        p1Moved = true;
      } else if (
        Phaser.Input.Keyboard.JustDown(this.wasdKeys.S) &&
        this.player1Position.y < this.EXTENDED_GRID_SIZE - 1
      ) {
        this.player1Position.y++;
        p1Moved = true;
      }

      // Player 2 movement (Arrow keys)
      if (
        Phaser.Input.Keyboard.JustDown(this.cursors.left!) &&
        this.player2Position.x > 0
      ) {
        this.player2Position.x--;
        p2Moved = true;
      } else if (
        Phaser.Input.Keyboard.JustDown(this.cursors.right!) &&
        this.player2Position.x < this.EXTENDED_GRID_SIZE - 1
      ) {
        this.player2Position.x++;
        p2Moved = true;
      } else if (
        Phaser.Input.Keyboard.JustDown(this.cursors.up!) &&
        this.player2Position.y > 0
      ) {
        this.player2Position.y--;
        p2Moved = true;
      } else if (
        Phaser.Input.Keyboard.JustDown(this.cursors.down!) &&
        this.player2Position.y < this.EXTENDED_GRID_SIZE - 1
      ) {
        this.player2Position.y++;
        p2Moved = true;
      }

      if (p1Moved) {
        const newX =
          this.EXTENDED_START_X + this.player1Position.x * this.CELL_SIZE;
        const newY =
          this.EXTENDED_START_Y + this.player1Position.y * this.CELL_SIZE;
        this.player1.setPosition(newX, newY);
      }

      if (p2Moved) {
        const newX =
          this.EXTENDED_START_X + this.player2Position.x * this.CELL_SIZE;
        const newY =
          this.EXTENDED_START_Y + this.player2Position.y * this.CELL_SIZE;
        this.player2.setPosition(newX, newY);
      }
    }
  }

  private handleNumberInteraction() {
    // Handle Player 1 interaction (Space key)
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.handlePlayerInteraction(1);
    }

    // Handle Player 2 interaction (Enter key) - only in VS mode
    if (
      this.gameMode === "vs" &&
      Phaser.Input.Keyboard.JustDown(this.enterKey)
    ) {
      this.handlePlayerInteraction(2);
    }

    // In single player mode, also allow Enter key for player 1
    if (
      this.gameMode === "single" &&
      Phaser.Input.Keyboard.JustDown(this.enterKey)
    ) {
      this.handlePlayerInteraction(1);
    }
  }

  private handlePlayerInteraction(playerNum: 1 | 2) {
    const playerPosition =
      playerNum === 1 ? this.player1Position : this.player2Position;
    const playerHeldNumber =
      playerNum === 1 ? this.player1HeldNumber : this.player2HeldNumber;

    const playerWorldX =
      this.EXTENDED_START_X + playerPosition.x * this.CELL_SIZE;
    const playerWorldY =
      this.EXTENDED_START_Y + playerPosition.y * this.CELL_SIZE;

    // Check if standing exactly on a number station
    for (const station of this.numberStations) {
      if (playerWorldX === station.x && playerWorldY === station.y) {
        if (playerHeldNumber === null) {
          // Pick up number
          if (playerNum === 1) {
            this.player1HeldNumber = station.number;
          } else {
            this.player2HeldNumber = station.number;
          }
          this.updateHeldNumberDisplay(playerNum);
        }
        return;
      }
    }

    // Check if standing exactly on a processing station
    for (const station of this.processingStations) {
      if (playerWorldX === station.x && playerWorldY === station.y) {
        this.handleProcessingStationInteraction(station, playerNum);
        return;
      }
    }

    // Check if standing exactly on rubbish bin
    if (
      this.rubbishBin &&
      playerWorldX === this.rubbishBin.x &&
      playerWorldY === this.rubbishBin.y
    ) {
      this.handleRubbishBinInteraction(playerNum);
      return;
    }

    // If standing on the bingo board and holding a number, try to place it
    if (playerHeldNumber !== null && this.isOnBingoBoard(playerPosition)) {
      this.tryPlaceNumberOnBoard(playerNum);
    }
  }

  private isOnBingoBoard(playerPosition: { x: number; y: number }): boolean {
    // Check if player is within the 5x5 bingo board area (positions 1-5 in extended grid)
    return (
      playerPosition.x >= 1 &&
      playerPosition.x <= 5 &&
      playerPosition.y >= 1 &&
      playerPosition.y <= 5
    );
  }

  private updateHeldNumberDisplay(playerNum: 1 | 2) {
    const playerHeldNumber =
      playerNum === 1 ? this.player1HeldNumber : this.player2HeldNumber;
    const playerNumberText =
      playerNum === 1 ? this.player1NumberText : this.player2NumberText;

    if (playerHeldNumber !== null) {
      playerNumberText.setText(playerHeldNumber.toString());
      playerNumberText.setVisible(true);
    } else {
      playerNumberText.setVisible(false);
    }
  }

  private tryPlaceNumberOnBoard(playerNum: 1 | 2) {
    const playerPosition =
      playerNum === 1 ? this.player1Position : this.player2Position;
    const playerHeldNumber =
      playerNum === 1 ? this.player1HeldNumber : this.player2HeldNumber;

    // Convert extended grid position to bingo board position
    const row = playerPosition.y - 1; // Extended grid is offset by 1
    const col = playerPosition.x - 1; // Extended grid is offset by 1

    const currentCell = this.bingoBoard[row][col];
    const currentState = this.boardState[row][col];

    // VS mode logic
    if (this.gameMode === "vs") {
      // Check if cell is already occupied by the other player
      if (currentState === "p1" || currentState === "p2") {
        // In endgame mode, allow placing on occupied cells
        if (!this.isEndgameMode && currentState !== `p${playerNum}`) {
          // Cell occupied by other player - show red feedback
          currentCell.setFillStyle(0xff6b6b);
          this.time.delayedCall(500, () => {
            const playerColor = currentState === "p1" ? 0xe74c3c : 0x3498db;
            currentCell.setFillStyle(playerColor);
          });
          return;
        }
      }
    } else {
      // Single player mode - check if cell has any number
      if (currentState !== null) {
        currentCell.setFillStyle(0xff6b6b);
        this.time.delayedCall(500, () => {
          currentCell.setFillStyle(0x34495e);
        });
        return;
      }
    }

    if (playerHeldNumber === this.currentCalledNumber) {
      // Correct number! Place it
      const numberText = this.add
        .text(
          this.BOARD_START_X + col * this.CELL_SIZE,
          this.BOARD_START_Y + row * this.CELL_SIZE,
          playerHeldNumber.toString(),
          {
            fontSize: "20px",
            color: "#ecf0f1",
            fontStyle: "bold",
          },
        )
        .setOrigin(0.5);

      // Update board state
      if (this.gameMode === "vs") {
        this.boardState[row][col] = `p${playerNum}` as "p1" | "p2";
        const cellColor = playerNum === 1 ? 0xe74c3c : 0x3498db;
        currentCell.setFillStyle(cellColor);
      } else {
        this.boardState[row][col] = playerHeldNumber;
        currentCell.setFillStyle(0x27ae60);
      }

      this.placedNumberTexts[row][col] = numberText;

      // Clear player's held number
      if (playerNum === 1) {
        this.player1HeldNumber = null;
      } else {
        this.player2HeldNumber = null;
      }
      this.updateHeldNumberDisplay(playerNum);

      // Check for bingo
      if (this.checkForBingo(playerNum)) {
        this.handleBingo(playerNum);
      } else {
        // Check if board is full in VS mode
        if (
          this.gameMode === "vs" &&
          this.isBoardFull() &&
          !this.isEndgameMode
        ) {
          this.enterEndgameMode();
        } else {
          // Call a new number immediately after successful placement
          this.callNewNumber();
        }
      }
    } else {
      // Wrong number - visual feedback but don't place
      currentCell.setFillStyle(0xff6b6b);
      this.time.delayedCall(500, () => {
        if (this.gameMode === "vs") {
          if (currentState === "p1") {
            currentCell.setFillStyle(0xe74c3c);
          } else if (currentState === "p2") {
            currentCell.setFillStyle(0x3498db);
          } else {
            currentCell.setFillStyle(0x34495e);
          }
        } else {
          currentCell.setFillStyle(0x34495e);
        }
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

  private isBoardFull(): boolean {
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        if (row === 2 && col === 2) continue; // Skip FREE space
        if (this.boardState[row][col] === null) {
          return false;
        }
      }
    }
    return true;
  }

  private enterEndgameMode() {
    this.isEndgameMode = true;
    // Add visual indicator for endgame mode
    const centerX = this.cameras.main.width / 2;
    const endgameText = this.add
      .text(centerX, 80, "ENDGAME MODE: SHARING ENABLED!", {
        fontSize: "18px",
        color: "#f39c12",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Make it flash
    this.tweens.add({
      targets: endgameText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  private handleProcessingStationInteraction(
    station: {
      x: number;
      y: number;
      obj: Phaser.GameObjects.Container;
      heldNumber: number | null;
      numberText: Phaser.GameObjects.Text | null;
      operation: string;
    },
    playerNum: 1 | 2,
  ) {
    const playerHeldNumber =
      playerNum === 1 ? this.player1HeldNumber : this.player2HeldNumber;

    if (playerHeldNumber !== null) {
      if (station.heldNumber === null) {
        // Place first number at station
        station.heldNumber = playerHeldNumber;
        if (playerNum === 1) {
          this.player1HeldNumber = null;
        } else {
          this.player2HeldNumber = null;
        }
        this.updateHeldNumberDisplay(playerNum);

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
            result = station.heldNumber + playerHeldNumber;
            break;
          case "-":
            result = station.heldNumber - playerHeldNumber;
            break;
          case "×":
            result = station.heldNumber * playerHeldNumber;
            break;
          case "÷":
            result = Math.floor(station.heldNumber / playerHeldNumber);
            break;
          default:
            result = station.heldNumber + playerHeldNumber;
        }

        // Clear the station number and display
        station.heldNumber = null;
        if (station.numberText) {
          station.numberText.destroy();
          station.numberText = null;
        }

        // Give player the result
        if (playerNum === 1) {
          this.player1HeldNumber = result;
        } else {
          this.player2HeldNumber = result;
        }
        this.updateHeldNumberDisplay(playerNum);
      }
    } else {
      // Pick up number from station if there is one
      if (station.heldNumber !== null) {
        if (playerNum === 1) {
          this.player1HeldNumber = station.heldNumber;
        } else {
          this.player2HeldNumber = station.heldNumber;
        }
        station.heldNumber = null;

        // Clear the number display
        if (station.numberText) {
          station.numberText.destroy();
          station.numberText = null;
        }

        this.updateHeldNumberDisplay(playerNum);
      }
    }
  }

  private handleRubbishBinInteraction(playerNum: 1 | 2) {
    if (!this.rubbishBin) return;

    const playerHeldNumber =
      playerNum === 1 ? this.player1HeldNumber : this.player2HeldNumber;

    // Only allow disposing if player is holding a number
    if (playerHeldNumber !== null) {
      // Visual feedback - flash the bin
      const binObj = this.rubbishBin.obj;
      binObj.setScale(1.1);

      // Create disposal effect
      const disposalText = this.add
        .text(
          this.rubbishBin.x,
          this.rubbishBin.y - 40,
          "-" + playerHeldNumber,
          {
            fontSize: "16px",
            color: "#e74c3c",
            fontStyle: "bold",
          },
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
      if (playerNum === 1) {
        this.player1HeldNumber = null;
      } else {
        this.player2HeldNumber = null;
      }
      this.updateHeldNumberDisplay(playerNum);
    }
  }

  private checkForBingo(playerNum?: 1 | 2): boolean {
    if (this.gameMode === "single") {
      // Single player mode - check if any line is complete
      return this.checkLineComplete();
    } else {
      // VS mode - check if specific player has a line
      return this.checkPlayerBingo(playerNum!);
    }
  }

  private checkLineComplete(): boolean {
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

  private checkPlayerBingo(playerNum: 1 | 2): boolean {
    const playerMarker = `p${playerNum}` as "p1" | "p2";

    // Check rows
    for (let row = 0; row < this.GRID_SIZE; row++) {
      let hasRow = true;
      for (let col = 0; col < this.GRID_SIZE; col++) {
        if (row === 2 && col === 2) continue; // Skip FREE space
        if (this.boardState[row][col] !== playerMarker) {
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
        if (row === 2 && col === 2) continue; // Skip FREE space
        if (this.boardState[row][col] !== playerMarker) {
          hasCol = false;
          break;
        }
      }
      if (hasCol) return true;
    }

    // Check diagonal (top-left to bottom-right)
    let hasDiag1 = true;
    for (let i = 0; i < this.GRID_SIZE; i++) {
      if (i === 2) continue; // Skip FREE space
      if (this.boardState[i][i] !== playerMarker) {
        hasDiag1 = false;
        break;
      }
    }
    if (hasDiag1) return true;

    // Check diagonal (top-right to bottom-left)
    let hasDiag2 = true;
    for (let i = 0; i < this.GRID_SIZE; i++) {
      if (i === 2) continue; // Skip FREE space
      if (this.boardState[i][this.GRID_SIZE - 1 - i] !== playerMarker) {
        hasDiag2 = false;
        break;
      }
    }
    if (hasDiag2) return true;

    return false;
  }

  private handleBingo(playerNum?: 1 | 2) {
    // Stop the timer (single player only)
    if (this.gameMode === "single") {
      this.gameStarted = false;
    }

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Create full-screen dark overlay
    this.add
      .rectangle(
        centerX,
        centerY,
        this.cameras.main.width,
        this.cameras.main.height,
        0x000000,
      )
      .setAlpha(0.7)
      .setOrigin(0.5);

    // Create modal dialog background
    const dialogHeight = this.gameMode === "single" ? 420 : 350;
    this.add
      .rectangle(centerX, centerY, 450, dialogHeight, 0x34495e)
      .setOrigin(0.5)
      .setStrokeStyle(4, 0x2c3e50);

    // Create celebratory message
    this.add
      .text(centerX, centerY - 80, "🎉 BINGO! 🎉", {
        fontSize: "48px",
        color: "#f1c40f",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    if (this.gameMode === "vs" && playerNum) {
      // VS mode - show winner
      const playerName = playerNum === 1 ? "Player 1" : "Player 2";
      const playerColor = playerNum === 1 ? "#e74c3c" : "#3498db";

      this.add
        .text(centerX, centerY - 20, `${playerName} Wins!`, {
          fontSize: "28px",
          color: playerColor,
          fontStyle: "bold",
        })
        .setOrigin(0.5);
    } else {
      // Single player mode
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
    }

    // Display completion time (single player only)
    let yOffset = 40;
    if (this.gameMode === "single") {
      const completionTime = this.currentTime;
      const seconds = Math.floor(completionTime / 1000);
      const minutes = Math.floor(seconds / 60);
      const displaySeconds = seconds % 60;
      const timeString = `${minutes}:${displaySeconds.toString().padStart(2, "0")}`;

      this.add
        .text(centerX, centerY + yOffset, `Completion Time: ${timeString}`, {
          fontSize: "20px",
          color: "#f39c12",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      yOffset += 60;
    }

    // Play again button
    const playAgainButton = this.add
      .rectangle(centerX, centerY + yOffset, 180, 50, 0x27ae60)
      .setInteractive()
      .setStrokeStyle(3, 0x2ecc71)
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + yOffset, "PLAY AGAIN", {
        fontSize: "18px",
        color: "#ecf0f1",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Menu button
    const menuButton = this.add
      .rectangle(centerX, centerY + yOffset + 60, 180, 50, 0xe74c3c)
      .setInteractive()
      .setStrokeStyle(3, 0xc0392b)
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + yOffset + 60, "MAIN MENU", {
        fontSize: "18px",
        color: "#ecf0f1",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Button interactions
    playAgainButton.on("pointerdown", () => {
      this.scene.restart({ gameMode: this.gameMode });
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
