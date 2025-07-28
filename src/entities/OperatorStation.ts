import { Station } from "./Station";
import Phaser from "phaser";

export class OperatorStation extends Station {
  public operation: string;
  public heldNumber: number | null;
  public numberText: Phaser.GameObjects.Text | null;

  constructor(
    x: number,
    y: number,
    obj: Phaser.GameObjects.Container,
    operation: string,
  ) {
    super(x, y, obj);
    this.operation = operation;
    this.heldNumber = null;
    this.numberText = null;
  }

  public interact(player: any): void {
    if (player.heldNumber !== null) {
      if (this.heldNumber === null) {
        this.placeFirstNumber(player);
      } else {
        this.performOperation(player);
      }
    } else {
      this.pickupNumber(player);
    }
  }

  private placeFirstNumber(player: any): void {
    this.heldNumber = player.heldNumber;
    player.heldNumber = null;
    player.updateHeldNumberDisplay();

    this.numberText = player.scene.add
      .text(this.x - 20, this.y + 35, this.heldNumber!.toString(), {
        fontSize: "14px",
        color: "#f1c40f",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
  }

  private performOperation(player: any): void {
    let result: number;

    switch (this.operation) {
      case "+":
        result = this.heldNumber! + player.heldNumber;
        break;
      case "-":
        result = this.heldNumber! - player.heldNumber;
        break;
      case "×":
        result = this.heldNumber! * player.heldNumber;
        break;
      case "÷":
        result = Math.floor(this.heldNumber! / player.heldNumber);
        break;
      default:
        result = this.heldNumber! + player.heldNumber;
    }

    this.clearStation();
    player.heldNumber = result;
    player.updateHeldNumberDisplay();
  }

  private pickupNumber(player: any): void {
    if (this.heldNumber !== null) {
      player.heldNumber = this.heldNumber;
      this.clearStation();
      player.updateHeldNumberDisplay();
    }
  }

  private clearStation(): void {
    this.heldNumber = null;
    if (this.numberText) {
      this.numberText.destroy();
      this.numberText = null;
    }
  }

  public setPosition(x: number, y: number): void {
    super.setPosition(x, y);
    if (this.numberText) {
      this.numberText.setPosition(x - 20, y + 35);
    }
  }
}
