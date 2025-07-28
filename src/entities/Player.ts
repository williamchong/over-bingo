import Phaser from "phaser";

export class Player {
  public id: number;
  public position: { x: number; y: number };
  public container: Phaser.GameObjects.Container;
  public rect: Phaser.GameObjects.Rectangle;
  public numberText: Phaser.GameObjects.Text;
  public heldNumber: number | null;
  public scene: Phaser.Scene;
  public gameMode: "single" | "vs";

  constructor(
    id: number,
    scene: Phaser.Scene,
    startPosition: { x: number; y: number },
    color: number,
    gameMode: "single" | "vs" = "single",
  ) {
    this.id = id;
    this.scene = scene;
    this.position = startPosition;
    this.heldNumber = null;
    this.gameMode = gameMode;

    const EXTENDED_START_X = (800 - 4 * 80) / 2 - 80; // From GameScene
    const EXTENDED_START_Y = (600 - 5 * 80) / 2 - 80; // From GameScene
    const CELL_SIZE = 80; // From GameScene

    const startX = EXTENDED_START_X + startPosition.x * CELL_SIZE;
    const startY = EXTENDED_START_Y + startPosition.y * CELL_SIZE;

    this.container = scene.add.container(startX, startY);

    const rectSize = gameMode === "vs" ? 18 : 20;
    this.rect = scene.add.rectangle(0, 0, rectSize, rectSize, color);
    this.rect.setAlpha(gameMode === "vs" ? 0.8 : 0.7);

    const fontSize = gameMode === "vs" ? "11px" : "12px";
    this.numberText = scene.add
      .text(0, -15, "", {
        fontSize: fontSize,
        color: this.id === 1 ? "#f1c40f" : "#f39c12",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.container.add([this.rect, this.numberText]);
  }

  public move(direction: "up" | "down" | "left" | "right"): boolean {
    const EXTENDED_GRID_SIZE = 7;
    const CELL_SIZE = 80;
    const EXTENDED_START_X = (800 - 4 * 80) / 2 - 80;
    const EXTENDED_START_Y = (600 - 5 * 80) / 2 - 80;

    let moved = false;
    const newPosition = { ...this.position };

    switch (direction) {
      case "left":
        if (newPosition.x > 0) {
          newPosition.x--;
          moved = true;
        }
        break;
      case "right":
        if (newPosition.x < EXTENDED_GRID_SIZE - 1) {
          newPosition.x++;
          moved = true;
        }
        break;
      case "up":
        if (newPosition.y > 0) {
          newPosition.y--;
          moved = true;
        }
        break;
      case "down":
        if (newPosition.y < EXTENDED_GRID_SIZE - 1) {
          newPosition.y++;
          moved = true;
        }
        break;
    }

    if (moved) {
      this.position = newPosition;
      const newX = EXTENDED_START_X + this.position.x * CELL_SIZE;
      const newY = EXTENDED_START_Y + this.position.y * CELL_SIZE;
      this.container.setPosition(newX, newY);
    }

    return moved;
  }

  public updateHeldNumberDisplay(): void {
    if (this.heldNumber !== null) {
      this.numberText.setText(this.heldNumber.toString());
      this.numberText.setVisible(true);
    } else {
      this.numberText.setVisible(false);
    }
  }

  public isOnBingoBoard(): boolean {
    return (
      this.position.x >= 1 &&
      this.position.x <= 5 &&
      this.position.y >= 1 &&
      this.position.y <= 5
    );
  }

  public getWorldPosition(): { x: number; y: number } {
    const EXTENDED_START_X = (800 - 4 * 80) / 2 - 80;
    const EXTENDED_START_Y = (600 - 5 * 80) / 2 - 80;
    const CELL_SIZE = 80;

    return {
      x: EXTENDED_START_X + this.position.x * CELL_SIZE,
      y: EXTENDED_START_Y + this.position.y * CELL_SIZE,
    };
  }
}
