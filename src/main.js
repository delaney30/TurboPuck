import './style.css';
import Phaser from 'phaser';

// Set game screen dimensions
const sizes = {
  width: 1000,
  height: 500
};

// Create a start screen (main menu) scene
class MainMenu extends Phaser.Scene {
  constructor() {
    super("scene-mainmenu");
  }

  preload() {
    // Load background image for start screen
    this.load.image("bg", "assets/bg.png");
  }

  create() {
    // Add background image and scale it to fit the screen
    const bg = this.add.image(0, 0, "bg").setOrigin(0, 0);
    bg.setDisplaySize(sizes.width, sizes.height);

    // Add title text
    this.add.text(sizes.width / 2, 100, "Turbo Puck", {
      fontSize: "48px",
      fill: "black"
    }).setOrigin(0.5);

    // Add start game button
    const startButton = this.add.text(sizes.width / 2, 250, "Start Game", {
      fontSize: "32px",
      fill: "#00ff00",
      backgroundColor: "#000000",
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();

    startButton.on("pointerdown", () => {
      this.scene.start("scene-game");
    });

    startButton.on("pointerover", () => {
      startButton.setStyle({ fill: "#ffff00" });
    });

    startButton.on("pointerout", () => {
      startButton.setStyle({ fill: "#00ff00" });
    });
  }
}

// Define the main game scene
class GameScene extends Phaser.Scene {
  constructor() {
    super("scene-game");

    // Declare game objects and variables
    this.player;
    this.target;
    this.obstacles;
    this.angle = 0;
    this.speed = 400;
    this.shots = 0;
  }

  preload() {
    // Load all assets
    this.load.image("bg", "assets/bg.png");
    this.load.image("puck", "assets/puck.png");
    this.load.image("net", "assets/net.png");
    this.load.image("hockeyPlayer", "assets/player.png");
    this.load.image("player1", "assets/anderson.png");
    this.load.image("player2", "assets/kadri.png");
    this.load.image("player3", "assets/weegar.png");
    this.load.image("player4", "assets/kuzzy.png");
    this.load.image("player5", "assets/mullen.png");
  }

  create() {
    // Add background image and scale it to fit the screen
    const bg = this.add.image(0, 0, "bg").setOrigin(0, 0);
    bg.setDisplaySize(sizes.width, sizes.height);

    // Create the puck (player)
    this.player = this.physics.add.image(200, sizes.height - 100, "puck")
      .setOrigin(0.5)
      .setScale(0.5);
    this.player.setCollideWorldBounds(true); // keep it within the screen
    this.player.setBounce(0);                // make sure the puck doesn't bounce off the wall
    this.player.setDrag(0.99);               // add friction

    // Stop the puck if it hits a wall by setting the velocity to 0
    this.player.body.onWorldBounds = true;
    this.physics.world.on("worldbounds", (body, up, down, left, right) => {
      if (body.gameObject === this.player) {
        this.player.setVelocity(0, 0);
      }
    });

    // Create the goal net
    this.target = this.physics.add.staticImage(sizes.width - 80, 240, "net") 
      .setOrigin(0.5) 
      .setScale(1.0, 1.2) 
      .setAngle(90); 

    // Add the aiming arrow 
    this.aimLine = this.add.graphics({ lineStyle: { width: 4, color: 0xff0000 } });

    // Add a shot counter
    this.shotText = this.add.text(20, 20, "Shots: 0", {
      fontSize: "24px",
      fontFamily: "'orbitron', sans-serif", 
      color: "#00ff00"
    });

    // Add goal popup text (initially hidden)
    this.goalText = this.add.text(sizes.width / 2, sizes.height / 2, "GOAL!", {
      fontSize: "64px",
      fontFamily: "'orbitron', sans-serif",
      color: "#00ff00",
      backgroundColor: "#000000",
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setVisible(false).setDepth(1000); 

    // Add the players and set their positions 
    this.obstacles = this.physics.add.staticGroup();
    const playerData = [
      { x: 300, y: 100, key: "player1" },
      { x: 700, y: 100, key: "player2" },
      { x: 700, y: 400, key: "player3" },
      { x: 500, y: 300, key: "player4" },
      { x: 100, y: 350, key: "player5" },
    ];

    playerData.forEach(data => {
      const obstacle = this.obstacles.create(data.x, data.y, data.key)
        .setOrigin(0.5)
        .setScale(0.05);
      obstacle.refreshBody();
    });

    // Detect overlaps between the puck and the obstacles 
    this.physics.add.overlap(this.player, this.obstacles, this.handleObstacleCollision, null, this);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  // Use the left/right arrow keys to rotate the aiming angle back and forth
  update() {
    if (this.cursors.left.isDown) {
      this.angle -= 2;
    }
    if (this.cursors.right.isDown) {
      this.angle += 2;
    }

    // Calculate the direction of the aiming line
    const aimX = this.player.x + Math.cos(Phaser.Math.DegToRad(this.angle)) * 50;
    const aimY = this.player.y + Math.sin(Phaser.Math.DegToRad(this.angle)) * 50;

    // Draw the red aiming line
    this.aimLine.clear();
    this.aimLine.lineStyle(4, 0xff0000);
    this.aimLine.beginPath();
    this.aimLine.moveTo(this.player.x, this.player.y);
    this.aimLine.lineTo(aimX, aimY);
    this.aimLine.strokePath();

    // Shoot the puck when the space bar is pressed
    if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {
      const forceX = Math.cos(Phaser.Math.DegToRad(this.angle)) * this.speed;
      const forceY = Math.sin(Phaser.Math.DegToRad(this.angle)) * this.speed;

      this.player.body.setVelocity(forceX, forceY);
      this.shots++;
      this.shotText.setText("Shots: " + this.shots);
    }

    // Check to see if the puck has went into the net 
    if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), this.target.getBounds())) {
      console.log('Goal scored!');

      // Show goal text
      this.goalText.setVisible(true);

      // Reset puck after the puck goes into the net 
      this.time.delayedCall(1000, () => {
        this.goalText.setVisible(false); // Hide the goal text when the puck isnt in the net
        this.player.setPosition(200, sizes.height - 100);
      });
    }
  }

  // When the puck hits a player, stop it by setting the velocity to 0
  handleObstacleCollision = (puck, obstacle) => {
    if (puck.body.speed > 0) {
      console.log("Oh no, you hit a hockey player!");
      this.player.setVelocity(0, 0);
    }
  };
}

// Configure the Phaser game
const config = {
  type: Phaser.WEBGL,
  width: sizes.width,
  height: sizes.height,
  canvas: gameCanvas,
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  scene: [MainMenu, GameScene],
};

const game = new Phaser.Game(config);
