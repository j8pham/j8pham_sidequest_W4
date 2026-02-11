// Game state
let score = 0;
let depth = 0; // How far down in the dungeon
let floor = 0; // Current floor (1-based, increases every 25 depth)
let gameOver = false;
let gameOverReason = "";
let gameStarted = false;
let cameraY = 0; // Camera position for scrolling
let levelsData = null; // Loaded from levels.json
let currentLevel = 1; // Current level (1, 2, 3, or 4)
let levelConfig = null; // Current level configuration
let levelTransitionTimer = 0; // Timer for level transition message

// Player character - retro arcade blob
let blob = {
  x: 320,
  y: 30,
  w: 20,
  h: 20,
  vx: 0,
  vy: 0,
  speed: 2.5,
  gravity: 0.35,
  jumpPower: -8,
  onPlatform: false,
  excitedTimer: 0,
  anxietyTimer: 0,
  anxietyCount: 0,
  hasMischief: false,
  mischiefTimer: 0,
  colorDepth: 0,
};

// Collectible blobs
let collectibleBlobs = [];

// Spike traps
let spikes = [];

// Moving monsters (arcade style patrol)
let monsters = [];

// List of solid platforms
let platforms = [];

function preload() {
  levelsData = loadJSON("levels.json");
}

function setup() {
  createCanvas(640, 360);

  // Retro arcade style - pixelated
  pixelDensity(1);
  noStroke();
  textFont("monospace");
  textSize(12);

  // Load level 1 by default
  currentLevel = 1;
  loadLevel(true);
  // Start blob on the first platform
  blob.y = platforms[0].y - blob.h;
  blob.vy = 0;
  blob.onPlatform = true;
}

function loadLevel(isInit) {
  // Get current level data from JSON, clamping to last level if out of bounds
  let levelIndex = min(currentLevel - 1, levelsData.levels.length - 1);
  levelConfig = levelsData.levels[levelIndex];

  // If this is the initial load (setup), generate from scratch
  // If it's a mid-game level transition, keep existing platforms and just update the config
  if (isInit) {
    platforms = [];
    collectibleBlobs = [];
    spikes = [];
    monsters = [];

    let yPos = 80;
    let platformCount = 25;

    for (let i = 0; i < platformCount; i++) {
      if (random() < levelConfig.platformDensity) {
        let platformWidth = random(70, 130);
        let platformX = random(20, width - platformWidth - 20);

        platforms.push({
          x: platformX,
          y: yPos,
          w: platformWidth,
          h: 10,
          visited: false,
        });

        if (random() < levelConfig.spikeSpawnRate) {
          spikes.push({
            x: platformX + random(10, platformWidth - 10),
            y: yPos - 12,
            size: 5,
          });
        }

        if (random() < levelConfig.monsterSpawnRate) {
          monsters.push({
            x: platformX + platformWidth / 2,
            y: yPos - 14,
            w: 12,
            h: 12,
            vx: random([-1, 1]),
            platformY: yPos,
            platformX: platformX,
            platformW: platformWidth,
          });
        }

        if (random() < levelConfig.collectibleSpawnRate) {
          collectibleBlobs.push({
            x: platformX + random(10, platformWidth - 10),
            y: yPos - 12,
            vx: 0,
            vy: 0,
            w: 8,
            h: 8,
            isMischief: random() < 0.2,
            falling: false,
          });
        }

        yPos += random(55, 65);
      }
    }
  }
  // Mid-game transition: levelConfig is updated, new platforms generated
  // in draw() will use the new spawn rates, speeds, and colors automatically.
  // No need to wipe existing platforms - the game continues seamlessly.
}

function draw() {
  // Background changes with level theme and mischief mode
  if (blob.hasMischief) {
    background(60, 10, 50);
  } else {
    background(levelConfig.colorTheme.background);
  }

  // Start screen
  if (!gameStarted) {
    fill(100, 255, 100);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("DUNGEON DROP", width / 2, height / 2 - 100);

    fill(255);
    textSize(16);
    text("Press SPACE to start", width / 2, height / 2 - 30);

    // Hazards and collectibles in bottom left with even spacing
    fill(200, 200, 200);
    textSize(12);
    textAlign(LEFT);

    // Draw spike icon
    fill(255, 100, 100);
    triangle(15, height - 76, 25, height - 76, 20, height - 86);
    fill(255);
    text("Spikes", 28, height - 81);

    // Draw monster icon
    fill(200, 50, 100);
    rect(15, height - 65, 10, 10);
    fill(255);
    text("Monsters", 28, height - 60);

    // Draw golden blob
    fill(255, 255, 50);
    rect(15, height - 45, 8, 8);
    fill(255);
    text("Golden +10", 26, height - 40);

    // Draw mischief blob (brighter magenta)
    fill(255, 100, 200);
    rect(15, height - 25, 8, 8);
    fill(255);
    text("Dark +50!", 26, height - 20);

    // Controls in bottom right
    fill(150, 255, 100);
    textSize(12);
    textAlign(RIGHT);
    text("A / LEFT - Move Left", width - 20, height - 80);
    text("D / RIGHT - Move Right", width - 20, height - 60);
    text("SPACE / W / UP - Jump", width - 20, height - 40);
    text("R - Restart", width - 20, height - 20);
    return;
  }

  if (gameOver) {
    fill(255, 50, 50);
    textAlign(CENTER, CENTER);
    textSize(24);
    text("GAME OVER", width / 2, height / 2 - 40);
    textSize(14);
    fill(255);
    text("Score: " + score, width / 2, height / 2);
    let finalFloorPosition = (depth % 25) + 1;
    text("Level: " + currentLevel + " | Floor: " + finalFloorPosition + "/25", width / 2, height / 2 + 20);
    text("Press R to restart", width / 2, height / 2 + 50);
    return;
  }

  // --- Player input (use level config movement speed) ---
  blob.vx = 0;
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW))
    blob.vx = -levelConfig.blobMovementSpeed;
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW))
    blob.vx = levelConfig.blobMovementSpeed;

  blob.x += blob.vx;
  blob.x = constrain(blob.x, 0, width - blob.w);

  // --- Update camera to follow blob ---
  cameraY = blob.y - height * 0.3; // Keep blob at upper third of screen

  // --- Apply gravity (increases with depth for difficulty scaling) ---
  let currentGravity = blob.gravity + depth * 0.01;
  blob.vy += currentGravity;

  // --- Platform collision ---
  blob.onPlatform = false;
  for (const p of platforms) {
    if (
      blob.y + blob.h <= p.y + 5 &&
      blob.y + blob.h + blob.vy >= p.y &&
      blob.x < p.x + p.w &&
      blob.x + blob.w > p.x
    ) {
      blob.y = p.y - blob.h;
      blob.vy = 0;
      blob.onPlatform = true;
      blob.excitedTimer = 0; // End excited state on landing

      if (!p.visited) {
        p.visited = true;
        depth++;
        blob.colorDepth = depth;
        blob.anxietyTimer = 120;

        // Calculate current floor (every 25 depth = 1 floor)
        let newFloor = Math.floor(depth / 25) + 1;
        if (newFloor !== floor) {
          floor = newFloor;
          // Trigger level changes at specific floors
          if (floor === 2 && currentLevel === 1) {
            currentLevel = 2;
            levelTransitionTimer = 180;
            loadLevel(false);
          } else if (floor === 3 && currentLevel === 2) {
            currentLevel = 3;
            levelTransitionTimer = 180;
            loadLevel(false);
          } else if (floor === 4 && currentLevel === 3) {
            currentLevel = 4;
            levelTransitionTimer = 180;
            loadLevel(false);
          }
        }
      }
      break;
    }
  }

  // --- Apply velocity ---
  blob.y += blob.vy;

  // --- Generate new platforms at bottom when needed ---
  // Check if there's enough platforms visible on screen
  const platformsInView = platforms.filter(
    (p) => p.y > cameraY - 50 && p.y < cameraY + height + 100,
  );
  const bottomMostPlatform = platforms.reduce((lowest, p) =>
    p.y > lowest.y ? p : lowest,
  );

  if (platformsInView.length < 6 || bottomMostPlatform.y < cameraY + height) {
    let newY = bottomMostPlatform.y + random(55, 65); // Consistent platform spacing
    let platformWidth = random(70, 130);
    let platformX = random(20, width - platformWidth - 20); // Keep platforms centered

    platforms.push({
      x: platformX,
      y: newY,
      w: platformWidth,
      h: 10,
      visited: false,
    });

    // Add hazards to new platform using level config spawn rates
    if (random() < levelConfig.spikeSpawnRate) {
      spikes.push({
        x: platformX + random(10, platformWidth - 10),
        y: newY - 12,
        size: 5,
      });
    }

    // Monsters spawn based on level config
    if (random() < levelConfig.monsterSpawnRate) {
      monsters.push({
        x: platformX + platformWidth / 2,
        y: newY - 14,
        w: 12,
        h: 12,
        vx: random([-1, 1]),
        platformY: newY,
        platformX: platformX,
        platformW: platformWidth,
      });
    }

    // Collectibles spawn based on level config
    if (random() < levelConfig.collectibleSpawnRate) {
      collectibleBlobs.push({
        x: platformX + random(10, platformWidth - 10),
        y: newY - 12,
        vx: 0,
        vy: 0,
        w: 8,
        h: 8,
        isMischief: random() < 0.2,
        falling: false,
      });
    }
  }

  // --- Remove platforms that are far above camera ---
  platforms = platforms.filter((p) => p.y > cameraY - 100);
  spikes = spikes.filter((s) => s.y > cameraY - 100);
  monsters = monsters.filter((m) => m.y > cameraY - 100);
  collectibleBlobs = collectibleBlobs.filter((c) => c.y > cameraY - 100);

  // --- Check if fell off bottom ---
  if (blob.y > cameraY + height + 100) {
    gameOver = true;
    gameOverReason = "Fell into the abyss!";
  }

  // --- Update collectible blobs ---
  for (let i = collectibleBlobs.length - 1; i >= 0; i--) {
    const c = collectibleBlobs[i];

    // Check collision with player
    if (
      blob.x < c.x + c.w &&
      blob.x + blob.w > c.x &&
      blob.y < c.y + c.h &&
      blob.y + blob.h > c.y
    ) {
      if (c.isMischief) {
        blob.hasMischief = true;
        blob.mischiefTimer = 300;
        score += 50;
      } else {
        score += 10;
      }
      collectibleBlobs.splice(i, 1);
      continue;
    }

    // Remove if off-screen
    if (c.y > cameraY + height + 100) {
      collectibleBlobs.splice(i, 1);
    }
  }

  // --- Update mischief mode ---
  if (blob.hasMischief) {
    blob.mischiefTimer--;
    if (blob.mischiefTimer <= 0) {
      blob.hasMischief = false;
    }

    for (let i = spikes.length - 1; i >= 0; i--) {
      if (
        blob.x < spikes[i].x + 14 &&
        blob.x + blob.w > spikes[i].x - 14 &&
        blob.y < spikes[i].y + 14 &&
        blob.y + blob.h > spikes[i].y - 14
      ) {
        spikes.splice(i, 1);
      }
    }
  }

  // --- Update monsters (use level config platform speed) ---
  for (let i = monsters.length - 1; i >= 0; i--) {
    const m = monsters[i];

    // Side-to-side movement uses platform speed from level config
    m.x += m.vx * (levelConfig.platformSpeed * 0.4);

    // Turn around at platform edges
    if (m.x < m.platformX + 10 || m.x > m.platformX + m.platformW - 10) {
      m.vx *= -1;
    }

    // Check collision with blob
    if (
      blob.x < m.x + m.w &&
      blob.x + blob.w > m.x &&
      blob.y < m.y + m.h &&
      blob.y + blob.h > m.y
    ) {
      if (blob.hasMischief) {
        // In mischief mode, knock monster away
        m.vx *= -2;
      } else {
        // Normal collision = game over
        gameOver = true;
        gameOverReason = "Hit by monster!";
      }
    }

    // Remove if too far above
    if (m.platformY < cameraY - 200) {
      monsters.splice(i, 1);
    }
  }

  // --- Check spike collision ---
  for (const s of spikes) {
    if (
      !blob.hasMischief &&
      blob.x < s.x + 12 &&
      blob.x + blob.w > s.x - 12 &&
      blob.y < s.y + 12 &&
      blob.y + blob.h > s.y - 12
    ) {
      gameOver = true;
      gameOverReason = "Hit a spike!";
    }
  }

  // --- Draw platforms ---
  push();
  translate(0, -cameraY);

  fill(levelConfig.colorTheme.platforms);
  for (const p of platforms) {
    rect(p.x, p.y, p.w, p.h);
    // Highlight top edge
    fill(255, 255, 255, 60);
    rect(p.x, p.y, p.w, 2);
    fill(levelConfig.colorTheme.platforms);
  }

  // --- Draw spikes ---
  fill(levelConfig.colorTheme.spikes);
  for (const s of spikes) {
    triangle(
      s.x - s.size,
      s.y + s.size,
      s.x + s.size,
      s.y + s.size,
      s.x,
      s.y - s.size,
    );
  }

  // --- Draw monsters ---
  fill(levelConfig.colorTheme.monsters);
  for (const m of monsters) {
    rect(m.x - m.w / 2, m.y - m.h / 2, m.w, m.h);
    // Eyes
    fill(255);
    rect(m.x - 4, m.y - 3, 2, 2);
    rect(m.x + 2, m.y - 3, 2, 2);
    // Mouth
    fill(0);
    rect(m.x - 3, m.y + 2, 6, 1);
  }

  // --- Draw collectible blobs ---
  for (const c of collectibleBlobs) {
    if (c.isMischief) {
      fill(255, 100, 200);
    } else {
      fill(levelConfig.colorTheme.collectibles);
    }
    rect(c.x - c.w / 2, c.y - c.h / 2, c.w, c.h);
  }

  // --- Draw player blob ---
  drawArcadeBlob(blob);

  pop();

  // --- Update anxiety animation ---
  if (blob.anxietyTimer > 0) {
    blob.anxietyTimer--;
  }

  // --- HUD ---
  fill(100, 255, 100);
  textAlign(LEFT);
  textSize(12);
  text("SCORE: " + score, 10, 20);
  // Calculate floor position within current level (1-25)
  let floorPosition = (depth % 25) + 1;
  text("FLOOR: " + floorPosition + "/25", 10, 35);
  fill(200, 150, 255);
  text("LEVEL: " + currentLevel, 10, 50);
  if (blob.excitedTimer > 0) {
    fill(255, 255, 50);
    text("^ JUMP! ^", 10, 65);
  }

  // Mischief mode HUD
  if (blob.hasMischief) {
    fill(255, 100, 200);
    textAlign(RIGHT);
    textSize(12);
    text(">> MISCHIEF <<", width - 10, 20);
    fill(200, 200, 200);
    textSize(10);
    text("BREAK SPIKES", width - 10, 33);
    text("KNOCK MONSTERS", width - 10, 45);

    // Calculate remaining time in seconds
    let timeRemaining = ceil(blob.mischiefTimer / 60);
    fill(255, 100, 200);
    textSize(12);
    text("TIME: " + timeRemaining + "s", width - 10, 60);
    textAlign(LEFT);
  }

  // Level transition banner with fade
  if (levelTransitionTimer > 0) {
    // Calculate fade opacity (full at start, fades as timer counts down)
    let fadeOpacity = map(levelTransitionTimer, 0, 180, 0, 255);

    // Draw semi-transparent background banner
    fill(0, 0, 0, fadeOpacity * 0.6);
    rect(width / 2 - 200, height / 2 - 80, 400, 160);

    // Draw border
    stroke(255, 200, 0, fadeOpacity);
    strokeWeight(3);
    noFill();
    rect(width / 2 - 200, height / 2 - 80, 400, 160);
    noStroke();

    // Draw level number and name
    fill(255, 200, 0, fadeOpacity);
    textAlign(CENTER, CENTER);
    textSize(48);
    text("LEVEL " + currentLevel, width / 2, height / 2 - 30);

    fill(200, 200, 200, fadeOpacity);
    textSize(20);
    text(levelConfig.name, width / 2, height / 2 + 20);

    // Draw progression text
    fill(150, 255, 150, fadeOpacity);
    textSize(14);
    text("Floor " + floor, width / 2, height / 2 + 50);

    levelTransitionTimer--;
  }
}

// Draw arcade-style pixelated blob
function drawArcadeBlob(b) {
  // Determine color based on depth and excitement
  if (b.hasMischief) {
    fill(255, 100, 200); // Bright magenta when in mischief state
  } else if (b.excitedTimer > 0) {
    fill(255, 255, 100); // Bright yellow when excited
  } else if (b.anxietyTimer > 0) {
    // Darker as you go deeper
    let colorShift = min(depth / 50, 1);
    fill(150 - colorShift * 100, 200 - colorShift * 50, 100 + colorShift * 100);
  } else {
    // Base color shifts from cyan to purple
    let colorShift = min(depth / 50, 1);
    fill(100 - colorShift * 50, 200 - colorShift * 100, 200 + colorShift * 55);
  }

  // Draw main blob body (simple square for retro)
  rect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);

  // Draw eyes
  fill(255);
  rect(b.x - 6, b.y - 6, 4, 4);
  rect(b.x + 2, b.y - 6, 4, 4);

  fill(0);
  if (b.vx > 0) {
    rect(b.x - 4, b.y - 4, 2, 2);
    rect(b.x + 4, b.y - 4, 2, 2);
  } else if (b.vx < 0) {
    rect(b.x - 6, b.y - 4, 2, 2);
    rect(b.x + 2, b.y - 4, 2, 2);
  } else {
    rect(b.x - 5, b.y - 4, 2, 2);
    rect(b.x + 3, b.y - 4, 2, 2);
  }

  // Draw smile on jump excitement
  if (b.excitedTimer > 0) {
    fill(255);
    arc(b.x, b.y + 4, 6, 4, 0, PI);
  }

  // Draw evil smile in mischief state
  if (b.hasMischief) {
    fill(255);
    arc(b.x, b.y + 4, 6, 4, PI, 0); // Upside down smile (evil)
  }

  // Draw anxiety jitter lines (but not in mischief state)
  if (b.anxietyTimer > 0 && b.anxietyTimer % 10 < 5 && !b.hasMischief) {
    stroke(255, 100, 100);
    strokeWeight(1);
    line(
      b.x - b.w / 2 - 2,
      b.y - b.h / 2,
      b.x - b.w / 2 - 5,
      b.y - b.h / 2 - 3,
    );
    line(
      b.x + b.w / 2 + 2,
      b.y - b.h / 2,
      b.x + b.w / 2 + 5,
      b.y - b.h / 2 - 3,
    );
    noStroke();
  }
}

// Jump input
function keyPressed() {
  // Start game with SPACE
  if (!gameStarted && key === " ") {
    gameStarted = true;
    return;
  }

  if (
    (key === " " || key === "W" || key === "w" || keyCode === UP_ARROW) &&
    blob.vy === 0
  ) {
    blob.vy = -7;
    blob.jumping = true;
    blob.excitedTimer = 20; // Excitement lasts 20 frames
  }

  // Restart with R
  if (key === "R" || key === "r") {
    if (gameOver) {
      score = 0;
      depth = 0;
      floor = 0;
      currentLevel = 1; // Reset to level 1
      gameOver = false;
      gameStarted = false;
      gameOverReason = "";
      setup();
    }
  }
}
