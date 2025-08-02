import Phaser from "phaser";
import {
  Player,
  NumberStation,
  OperatorStation,
  BinStation,
} from "../entities";

export class GameScene extends Phaser.Scene {
  private player1!: Player;
  private player2!: Player;
  private bingoBoard: Phaser.GameObjects.Rectangle[][] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private numberStations: NumberStation[] = [];
  private processingStations: OperatorStation[] = [];
  private rubbishBin: BinStation | null = null;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private boardNumbers: number[][] = []; // Pre-filled board numbers
  private boardState: ("p1" | "p2" | "claimed" | null)[][] = []; // Claim states
  private numberTexts: Phaser.GameObjects.Text[][] = []; // Number display texts
  private boardRevealed: boolean[][] = []; // Which numbers are revealed
  private gameMode: "single" | "vs" = "single";
  private isEndgameMode: boolean = false;

  // Timer system
  private startTime: number = 0;
  private currentTime: number = 0;
  private timerText!: Phaser.GameObjects.Text;
  private gameStarted: boolean = false;
  private instructionText!: Phaser.GameObjects.Text;
  private hasPlayerMoved: boolean = false;

  private readonly GRID_SIZE = 5;
  private readonly CELL_SIZE = 80;
  private readonly BOARD_START_X = (800 - 4 * 80) / 2; // Center the 5x5 board horizontally
  private readonly BOARD_START_Y = (600 - 5 * 80) / 2; // Center the 5x5 board vertically

  constructor() {
    super({ key: "GameScene" });
  }

  create(data?: { gameMode?: string }) {
    // Set game mode from scene data
    this.gameMode = (data?.gameMode as "single" | "vs") || "single";
    this.isEndgameMode = false;

    // Reset instruction text state
    this.hasPlayerMoved = false;

    // Start timer only for single player mode
    if (this.gameMode === "single") {
      this.gameStarted = true;
      this.startTime = this.time.now;
      this.currentTime = 0;
    } else {
      this.gameStarted = false;
    }

    // Reset station arrays to ensure clean state
    this.numberStations = [];
    this.processingStations = [];
    this.rubbishBin = null;

    this.createBingoBoard();
    this.createNumberStations();
    this.createProcessingStations();
    this.createRubbishBin();
    this.createPlayers();
    this.createUI();
    this.setupInput();

    // Shuffle station positions at game start
  }

  private createBingoBoard() {
    // Generate unique random numbers for the board (excluding center which is FREE)
    const availableNumbers = [];
    for (let i = 1; i <= 100; i++) {
      availableNumbers.push(i);
    }

    // Shuffle the numbers
    for (let i = availableNumbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableNumbers[i], availableNumbers[j]] = [
        availableNumbers[j],
        availableNumbers[i],
      ];
    }

    let numberIndex = 0;

    // Initialize board arrays
    for (let row = 0; row < this.GRID_SIZE; row++) {
      this.bingoBoard[row] = [];
      this.boardNumbers[row] = [];
      this.boardState[row] = [];
      this.numberTexts[row] = [];
      this.boardRevealed[row] = [];

      for (let col = 0; col < this.GRID_SIZE; col++) {
        const x = this.BOARD_START_X + col * this.CELL_SIZE;
        const y = this.BOARD_START_Y + row * this.CELL_SIZE;

        // Create cell background (darker for hidden initially)
        const cell = this.add
          .rectangle(x, y, this.CELL_SIZE - 2, this.CELL_SIZE - 2, 0x2c3e50)
          .setStrokeStyle(2, 0x34495e);

        this.bingoBoard[row][col] = cell;
        this.boardState[row][col] = null;

        // Handle center cell as FREE space
        if (row === 2 && col === 2) {
          this.boardNumbers[row][col] = 0; // Special value for FREE
          this.boardState[row][col] =
            this.gameMode === "single" ? "claimed" : null;
          this.boardRevealed[row][col] = true; // FREE space is always revealed

          const freeText = this.add
            .text(x, y, "FREE", {
              fontSize: "16px",
              color: "#ecf0f1",
              fontStyle: "bold",
            })
            .setOrigin(0.5);

          this.numberTexts[row][col] = freeText;

          if (this.gameMode === "single") {
            cell.setFillStyle(0x27ae60); // Green for claimed in single player
          }
        } else {
          // Assign random number to cell
          this.boardNumbers[row][col] = availableNumbers[numberIndex++];
          this.boardRevealed[row][col] = false; // Initially hidden

          // Create placeholder text for hidden cell
          const numberText = this.add
            .text(x, y, "?", {
              fontSize: "20px",
              color: "#34495e", // Dark grey for hidden
              fontStyle: "bold",
            })
            .setOrigin(0.5);

          this.numberTexts[row][col] = numberText;
        }
      }
    }

    // Reveal initial numbers - smallest ones based on game mode
    this.revealInitialNumbers();
  }

  private revealInitialNumbers() {
    const numbersToReveal = this.gameMode === "single" ? 1 : 2;

    // Find all unrevealed cells with their numbers
    const unrevealedCells: { row: number; col: number; number: number }[] = [];
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        if (
          !this.boardRevealed[row][col] &&
          this.boardNumbers[row][col] !== 0
        ) {
          unrevealedCells.push({
            row,
            col,
            number: this.boardNumbers[row][col],
          });
        }
      }
    }

    // Sort by number value (smallest first)
    unrevealedCells.sort((a, b) => a.number - b.number);

    // Reveal the smallest numbers
    for (
      let i = 0;
      i < Math.min(numbersToReveal, unrevealedCells.length);
      i++
    ) {
      const cell = unrevealedCells[i];
      this.revealCell(cell.row, cell.col);
    }
  }

  private revealCell(row: number, col: number) {
    if (this.boardRevealed[row][col] || this.boardNumbers[row][col] === 0) {
      return; // Already revealed or FREE space
    }

    this.boardRevealed[row][col] = true;

    // Update the text to show the actual number
    const numberText = this.numberTexts[row][col];
    numberText.setText(this.boardNumbers[row][col].toString());

    // Color based on claim state
    if (this.boardState[row][col] === "claimed") {
      numberText.setColor("#ecf0f1"); // White for claimed in single player
    } else if (this.boardState[row][col] === "p1") {
      numberText.setColor("#ecf0f1"); // White for claimed by player 1
    } else if (this.boardState[row][col] === "p2") {
      numberText.setColor("#ecf0f1"); // White for claimed by player 2
    } else {
      numberText.setColor("#95a5a6"); // Grey for unclaimed but revealed
    }
  }

  private revealRandomNumbers() {
    // Get all unrevealed cells (excluding FREE space)
    const unrevealedCells: { row: number; col: number }[] = [];
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        if (
          !this.boardRevealed[row][col] &&
          this.boardNumbers[row][col] !== 0 // Skip FREE space
        ) {
          unrevealedCells.push({ row, col });
        }
      }
    }

    if (unrevealedCells.length === 0) return;

    // Calculate total claims made to determine reveal count
    let totalClaims = 0;
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        if (this.boardState[row][col] !== null) {
          totalClaims++;
        }
      }
    }
    // Subtract 1 for the FREE space which is always claimed
    totalClaims = Math.max(0, totalClaims - 1);

    // Progressive reveal count: start with 1, increase by 1 every 3 claims, max 5
    const revealCount = Math.min(
      5,
      Math.max(1, 1 + Math.floor(totalClaims / 3)),
    );

    // Shuffle unrevealed cells and reveal random ones
    for (let i = unrevealedCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unrevealedCells[i], unrevealedCells[j]] = [
        unrevealedCells[j],
        unrevealedCells[i],
      ];
    }

    // Reveal up to revealCount cells
    const cellsToReveal = Math.min(revealCount, unrevealedCells.length);
    for (let i = 0; i < cellsToReveal; i++) {
      const cell = unrevealedCells[i];
      this.revealCell(cell.row, cell.col);
    }
  }

  private createPlayers() {
    if (this.gameMode === "single") {
      // Single player mode - only create player 1
      this.player1 = new Player(
        1,
        this,
        { x: 3, y: 3 },
        0xe74c3c,
        this.gameMode,
      );
    } else {
      // VS mode - create both players
      this.player1 = new Player(
        1,
        this,
        { x: 2, y: 2 },
        0xe74c3c,
        this.gameMode,
      );
      this.player2 = new Player(
        2,
        this,
        { x: 4, y: 4 },
        0x3498db,
        this.gameMode,
      );
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

      this.numberStations.push(
        new NumberStation(station.x, station.y, container, station.number),
      );
    });
  }

  private createProcessingStations() {
    const stations = [
      // Operation stations on left and right sides only, relative to centered board
      {
        x: this.BOARD_START_X - this.CELL_SIZE,
        y: this.BOARD_START_Y + 0 * this.CELL_SIZE,
        operation: "+",
        color: 0xe91e63,
      }, // Left side, top position - Pink
      {
        x: this.BOARD_START_X - this.CELL_SIZE,
        y: this.BOARD_START_Y + 4 * this.CELL_SIZE,
        operation: "-",
        color: 0xe67e22,
      }, // Left side, bottom position - Orange
      {
        x: this.BOARD_START_X + 5 * this.CELL_SIZE,
        y: this.BOARD_START_Y + 0 * this.CELL_SIZE,
        operation: "×",
        color: 0x2980b9,
      }, // Right side, top position - Blue
      {
        x: this.BOARD_START_X + 5 * this.CELL_SIZE,
        y: this.BOARD_START_Y + 4 * this.CELL_SIZE,
        operation: "÷",
        color: 0x9b59b6,
      }, // Right side, bottom position - Purple
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

      this.processingStations.push(
        new OperatorStation(
          stationData.x,
          stationData.y,
          container,
          stationData.operation,
        ),
      );
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

    this.rubbishBin = new BinStation(binX, binY, container);
  }

  private createUI() {
    const centerX = this.cameras.main.width / 2;

    // Add instruction text at top center for both modes
    this.instructionText = this.add
      .text(
        centerX,
        30,
        "Get numbers from stations, match them to board for bingo!",
        {
          fontSize: "16px",
          color: "#f39c12",
          fontStyle: "bold",
        },
      )
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
          "First to get BINGO wins! Collect numbers and place them on matching cells.",
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
      if (
        Phaser.Input.Keyboard.JustDown(this.cursors.left!) ||
        Phaser.Input.Keyboard.JustDown(this.wasdKeys.A)
      ) {
        this.player1.move("left");
        this.hideInstructionOnFirstMove();
      } else if (
        Phaser.Input.Keyboard.JustDown(this.cursors.right!) ||
        Phaser.Input.Keyboard.JustDown(this.wasdKeys.D)
      ) {
        this.player1.move("right");
        this.hideInstructionOnFirstMove();
      } else if (
        Phaser.Input.Keyboard.JustDown(this.cursors.up!) ||
        Phaser.Input.Keyboard.JustDown(this.wasdKeys.W)
      ) {
        this.player1.move("up");
        this.hideInstructionOnFirstMove();
      } else if (
        Phaser.Input.Keyboard.JustDown(this.cursors.down!) ||
        Phaser.Input.Keyboard.JustDown(this.wasdKeys.S)
      ) {
        this.player1.move("down");
        this.hideInstructionOnFirstMove();
      }
    } else {
      // VS mode - separate controls for each player
      // Player 1 movement (WASD)
      if (Phaser.Input.Keyboard.JustDown(this.wasdKeys.A)) {
        this.player1.move("left");
        this.hideInstructionOnFirstMove();
      } else if (Phaser.Input.Keyboard.JustDown(this.wasdKeys.D)) {
        this.player1.move("right");
        this.hideInstructionOnFirstMove();
      } else if (Phaser.Input.Keyboard.JustDown(this.wasdKeys.W)) {
        this.player1.move("up");
        this.hideInstructionOnFirstMove();
      } else if (Phaser.Input.Keyboard.JustDown(this.wasdKeys.S)) {
        this.player1.move("down");
        this.hideInstructionOnFirstMove();
      }

      // Player 2 movement (Arrow keys)
      if (Phaser.Input.Keyboard.JustDown(this.cursors.left!)) {
        this.player2.move("left");
        this.hideInstructionOnFirstMove();
      } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right!)) {
        this.player2.move("right");
        this.hideInstructionOnFirstMove();
      } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
        this.player2.move("up");
        this.hideInstructionOnFirstMove();
      } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down!)) {
        this.player2.move("down");
        this.hideInstructionOnFirstMove();
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
    const player = playerNum === 1 ? this.player1 : this.player2;
    const playerWorldPos = player.getWorldPosition();

    // Check if standing exactly on a number station
    for (const station of this.numberStations) {
      if (playerWorldPos.x === station.x && playerWorldPos.y === station.y) {
        station.interact(player);
        return;
      }
    }

    // Check if standing exactly on a processing station
    for (const station of this.processingStations) {
      if (playerWorldPos.x === station.x && playerWorldPos.y === station.y) {
        station.interact(player);
        return;
      }
    }

    // Check if standing exactly on rubbish bin
    if (
      this.rubbishBin &&
      playerWorldPos.x === this.rubbishBin.x &&
      playerWorldPos.y === this.rubbishBin.y
    ) {
      this.rubbishBin.interact(player);
      return;
    }

    // If standing on the bingo board and holding a number, try to claim it
    if (player.heldNumber !== null && player.isOnBingoBoard()) {
      this.tryClaimCell(playerNum);
    }
  }

  private tryClaimCell(playerNum: 1 | 2) {
    const player = playerNum === 1 ? this.player1 : this.player2;
    const playerHeldNumber = player.heldNumber;

    // Convert extended grid position to bingo board position
    const row = player.position.y - 1; // Extended grid is offset by 1
    const col = player.position.x - 1; // Extended grid is offset by 1

    const currentCell = this.bingoBoard[row][col];
    const currentState = this.boardState[row][col];
    const cellNumber = this.boardNumbers[row][col];
    const numberText = this.numberTexts[row][col];

    // Skip FREE space
    if (cellNumber === 0) {
      return;
    }

    // Check if the cell is revealed
    if (!this.boardRevealed[row][col]) {
      // Cell not revealed - show red feedback
      currentCell.setFillStyle(0xff6b6b);
      this.time.delayedCall(500, () => {
        this.restoreCellColor(row, col);
      });
      return;
    }

    // Check if the player is holding the number that matches the board cell
    if (playerHeldNumber !== cellNumber) {
      // Wrong number for this cell - show red feedback
      currentCell.setFillStyle(0xff6b6b);
      this.time.delayedCall(500, () => {
        this.restoreCellColor(row, col);
      });
      return;
    }

    // VS mode logic
    if (this.gameMode === "vs") {
      // Check if cell is already claimed by the other player
      if (currentState === "p1" || currentState === "p2") {
        if (currentState !== `p${playerNum}`) {
          // Cell claimed by other player - show red feedback
          currentCell.setFillStyle(0xff6b6b);
          this.time.delayedCall(500, () => {
            this.restoreCellColor(row, col);
          });
          return;
        } else {
          // Already claimed by this player
          return;
        }
      }
    } else {
      // Single player mode - check if cell is already claimed
      if (currentState === "claimed") {
        return;
      }
    }

    // Claim the cell!
    if (this.gameMode === "vs") {
      this.boardState[row][col] = `p${playerNum}` as "p1" | "p2";
      const cellColor = playerNum === 1 ? 0xe74c3c : 0x3498db;
      currentCell.setFillStyle(cellColor);
    } else {
      this.boardState[row][col] = "claimed";
      currentCell.setFillStyle(0x27ae60); // Green for claimed
    }

    // Update number text to be white and bold
    numberText.setColor("#ecf0f1");
    numberText.setFontStyle("bold");

    // Clear player's held number
    player.heldNumber = null;
    player.updateHeldNumberDisplay();

    // Reveal random numbers
    this.revealRandomNumbers();

    // Check for bingo
    if (this.checkForBingo(playerNum)) {
      this.handleBingo(playerNum);
    } else {
      // Check if board is full in VS mode
      if (this.gameMode === "vs" && this.isBoardFull() && !this.isEndgameMode) {
        this.enterEndgameMode();
      }
    }
  }

  private restoreCellColor(row: number, col: number) {
    const currentState = this.boardState[row][col];
    const currentCell = this.bingoBoard[row][col];

    if (this.gameMode === "vs") {
      if (currentState === "p1") {
        currentCell.setFillStyle(0xe74c3c);
      } else if (currentState === "p2") {
        currentCell.setFillStyle(0x3498db);
      } else {
        currentCell.setFillStyle(0x2c3e50);
      }
    } else {
      if (currentState === "claimed") {
        currentCell.setFillStyle(0x27ae60); // Green for claimed
      } else {
        currentCell.setFillStyle(0x2c3e50);
      }
    }
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
        if (this.boardState[row][col] !== "claimed") {
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
        if (this.boardState[row][col] !== "claimed") {
          hasCol = false;
          break;
        }
      }
      if (hasCol) return true;
    }

    // Check diagonal (top-left to bottom-right)
    let hasDiag1 = true;
    for (let i = 0; i < this.GRID_SIZE; i++) {
      if (this.boardState[i][i] !== "claimed") {
        hasDiag1 = false;
        break;
      }
    }
    if (hasDiag1) return true;

    // Check diagonal (top-right to bottom-left)
    let hasDiag2 = true;
    for (let i = 0; i < this.GRID_SIZE; i++) {
      if (this.boardState[i][this.GRID_SIZE - 1 - i] !== "claimed") {
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

  private hideInstructionOnFirstMove() {
    if (!this.hasPlayerMoved && this.instructionText) {
      this.hasPlayerMoved = true;
      this.instructionText.setVisible(false);
    }
  }
}
