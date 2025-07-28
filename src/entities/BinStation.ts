import { Station } from "./Station";
import Phaser from "phaser";

export class BinStation extends Station {
  constructor(x: number, y: number, obj: Phaser.GameObjects.Container) {
    super(x, y, obj);
  }

  public interact(player: any): void {
    if (player.heldNumber !== null) {
      this.createDisposalEffect(player);
      player.heldNumber = null;
      player.updateHeldNumberDisplay();
    }
  }

  private createDisposalEffect(player: any): void {
    const binObj = this.obj;
    binObj.setScale(1.1);

    const disposalText = player.scene.add
      .text(this.x, this.y - 40, "-" + player.heldNumber, {
        fontSize: "16px",
        color: "#e74c3c",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    player.scene.tweens.add({
      targets: disposalText,
      y: this.y - 80,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        disposalText.destroy();
      },
    });

    player.scene.time.delayedCall(200, () => {
      binObj.setScale(1);
    });
  }
}
