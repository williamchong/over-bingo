import { Station } from "./Station";
import Phaser from "phaser";

export class NumberStation extends Station {
  public number: number;

  constructor(
    x: number,
    y: number,
    obj: Phaser.GameObjects.Container,
    number: number,
  ) {
    super(x, y, obj);
    this.number = number;
  }

  public interact(player: any): void {
    if (player.heldNumber === null) {
      player.heldNumber = this.number;
      player.updateHeldNumberDisplay();
    }
  }
}
