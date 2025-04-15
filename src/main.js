/* 
<-Goals of the game->
- home page for starting the game
- have a hockey puck that needs to be shot into the net 
- have obstacles that the puck needs to do through
- Aiming arrow for shooting accuracy 
- Score tracker
<-IF I HAVE TIME->
- Maybe a goalie in the net to be an addisional blocker?
- Power bar for faster shots 
*/

import './style.css';
import Phaser from 'phaser';

const sizes = {
  width: 1000,
  height: 500
};

class GameScene extends Phaser.Scene {
  constructor() {
    super("scene-game");
    this.player;
    this.target;
    this.angle = 0;
    this.speed = 400;
  }
  //Add all images into the game
  preload() {
    this.load.image("bg", "assets/bg.png");
    this.load.image("puck", "assets/puck.png");
    this.load.image("net", "assets/net.png");
  }

  create() {
    const bg = this.add.image(0, 0, "bg").setOrigin(0, 0);
    bg.setDisplaySize(sizes.width, sizes.height);

    // Move the puck usig physics 
    this.player = this.physics.add.image(200, sizes.height - 100, "puck").setOrigin(0.5, 0.5).setScale(0.5);
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0);
    this.player.setDrag(0.99);
    this.player.setDamping(true);

    // Add the net
    this.target = this.physics.add.staticImage(sizes.width - 80, 50, "net").setOrigin(0.8, 0.3).setScale(1.5);

    // Add the aiming line
    this.aimLine = this.add.graphics({ lineStyle: { width: 4, color: 0xff0000 } });

    // Use they Keyboard to move and aim the puck
    this.cursors = this.input.keyboard.createCursorKeys(); // Arrow keys
    this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE); // Space bar for shooting
  }

  update() {

    if (this.cursors.left.isDown) {
      this.angle -= 2; // Rotate counterclockwise
    }
    if (this.cursors.right.isDown) {
      this.angle += 2; // Rotate clockwise
    }

    // Visualize the aiming line based on the current angle
    let aimX = this.player.x + Math.cos(Phaser.Math.DegToRad(this.angle)) * 50;
    let aimY = this.player.y + Math.sin(Phaser.Math.DegToRad(this.angle)) * 50;

    this.aimLine.clear();
    this.aimLine.lineStyle(4, 0xff0000);
    this.aimLine.beginPath();
    this.aimLine.moveTo(this.player.x, this.player.y);
    this.aimLine.lineTo(aimX, aimY);
    this.aimLine.strokePath();

    // Shoot the puck when space bar is pressed
    if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {
      let forceX = Math.cos(Phaser.Math.DegToRad(this.angle)) * this.speed;
      let forceY = Math.sin(Phaser.Math.DegToRad(this.angle)) * this.speed;

      this.player.body.setVelocity(forceX, forceY);
      console.log("Puck shot!");
    }

    // Check for scoring (goal detection)
    if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), this.target.getBounds())) {
      console.log('Goal scored!');
      this.time.delayedCall(1000, () => {
        this.player.setVelocity(0, 0);
        this.player.setPosition(200, sizes.height - 100);
      });
    }
  }
}

const config = {
  type: Phaser.WEBGL,
  width: sizes.width,
  height: sizes.height,
  canvas: gameCanvas,
  physics: {
    default: "arcade",
    arcade: {
      debug: true,
    },
  },
  scene: [GameScene],
};

const game = new Phaser.Game(config);           