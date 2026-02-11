// Game state
let score = 0;
let depth = 0; // How far down in the dungeon
let gameOver = false;
let gameOverReason = "";
let gameStarted = false;
let cameraY = 0; // Camera position for scrolling

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

function setup() {
  createCanvas(640, 360);

  // Retro arcade style - pixelated
  pixelDensity(1);
  noStroke();
  textFont("monospace");
  textSize(12);

  generateLevel();
  // Start blob on the first platform
  blob.y = platforms[0].y - blob.h;
  blob.vy = 0;
  blob.onPlatform = true;
}

function generateLevel() {
  platforms = [];
  collectibleBlobs = [];
  spikes = [];
  monsters = [];

  let yPos = 80; // Start first platform near top so blob can stand on it

  // Generate initial set of platforms with consistent spacing
  for (let i = 0; i < 25; i++) {
    let platformWidth = random(70, 130);
    let platformX = random(20, width - platformWidth - 20); // Keep centered

    platforms.push({
      x: platformX,
      y: yPos,
      w: platformWidth,
      h: 10,
      visited: false,
    });

    // Random hazards (spikes or monsters) - lower frequency for reachability
    // Don't spawn spikes in first 3 depth levels
    if (depth >= 3) {
      if (random() < 0.18) {
        spikes.push({
          x: platformX + random(10, platformWidth - 10),
          y: yPos - 12,
          size: 5,
        });
      }
    }

    // Monsters spawn from beginning
    if (random() < 0.12) {
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

    // Add collectible blob
    if (random() < 0.3) {
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

    yPos += random(55, 65); // Consistent spacing for jumpable distances
  }
}

function draw() {
  // Retro arcade background - changes with depth and mischief mode
  if (blob.hasMischief) {
    // Mischief mode - purple/magenta background
    background(60, 10, 50);
  } else if (depth >= 30) {
    // Deep dungeon - dark red
    background(40, 10, 15);
  } else if (depth >= 20) {
    // Deeper dungeon - dark purple
    background(25, 10, 35);
  } else if (depth >= 10) {
    // Deeper - darker blue
    background(10, 10, 50);
  } else {
    // Normal dungeon start
    background(10, 15, 40);
  }

  // Start screen
  if (!gameStarted) {
    fill(100, 255, 100);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("DUNGEON DROP", width / 2, height / 2 - 100);

    fill(200);
    textSize(16);
    text("Press SPACE to start", width / 2, height / 2 - 30);

    // Hazards and collectibles in bottom left with even spacing
    fill(200, 200, 200);
    textSize(12);
    textAlign(LEFT);

    // Draw spike icon
    fill(255, 100, 100);
    triangle(15, height - 76, 25, height - 76, 20, height - 86);
    fill(200, 200, 200);
    text("Spikes", 28, height - 81);

    // Draw monster icon
    fill(200, 50, 100);
    rect(15, height - 65, 10, 10);
    fill(200, 200, 200);
    text("Monsters", 28, height - 60);

    // Draw golden blob
    fill(255, 255, 50);
    rect(15, height - 45, 8, 8);
    fill(200, 200, 200);
    text("Golden +10", 26, height - 40);

    // Draw mischief blob (brighter magenta)
    fill(255, 100, 200);
    rect(15, height - 25, 8, 8);
    fill(200, 200, 200);
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
    fill(200);
    text("Score: " + score, width / 2, height / 2);
    text("Depth: " + depth, width / 2, height / 2 + 20);
    text("Press R to restart", width / 2, height / 2 + 50);
    return;
  }

  // --- Player input ---
  blob.vx = 0;
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) blob.vx = -blob.speed;
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) blob.vx = blob.speed;

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

    // Add hazards to new platform
    // Don't spawn spikes in first 3 depth levels
    if (depth >= 3) {
      if (random() < 0.18) {
        spikes.push({
          x: platformX + random(10, platformWidth - 10),
          y: newY - 12,
          size: 5,
        });
      }
    }

    // Monsters spawn from beginning
    if (random() < 0.12) {
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

    if (random() < 0.3) {
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

  // --- Update monsters ---
  for (let i = monsters.length - 1; i >= 0; i--) {
    const m = monsters[i];
    
    // Simple side-to-side movement
    m.x += m.vx * 0.8;
    
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

  fill(50, 200, 100);
  for (const p of platforms) {
    rect(p.x, p.y, p.w, p.h);
    fill(100, 255, 150);
    rect(p.x, p.y, p.w, 2);
    fill(50, 200, 100);
  }

  // --- Draw spikes ---
  fill(255, 100, 100);
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
  fill(200, 50, 100);
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
      fill(255, 255, 50);
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
  text("DEPTH: " + depth, 10, 35);
  if (blob.excitedTimer > 0) {
    fill(255, 255, 50);
    text("^ JUMP! ^", 10, 50);
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
      gameOver = false;
      gameStarted = false;
      gameOverReason = "";
      setup();
    }
  }
}
