import Phaser from "phaser";

export abstract class Station {
  public x: number;
  public y: number;
  public obj: Phaser.GameObjects.Container;

  constructor(x: number, y: number, obj: Phaser.GameObjects.Container) {
    this.x = x;
    this.y = y;
    this.obj = obj;
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.obj.setPosition(x, y);
  }

  public abstract interact(player: any): void;
}
