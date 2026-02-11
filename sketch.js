// A STRANGER IN TOWN - Interactive Story
// Track stats and uncover your true identity through choices

let gameState = {
  currentScene: "homeScreen",
  memory: 0, // How much you remember (0-100)
  trust: 50, // How much townspeople trust you (0-100)
  suspicion: 30, // How suspicious people are of you (0-100)
  inventory: [],
  history: [], // Track choices made
  showStatsModal: false,
  showPauseMenu: false,
  canOpenMenu: true,
  statsFlashCounter: 0, // Counts down from 300 frames for auto-close
};

let scenes = {
  homeScreen: {
    title: "A STRANGER IN TOWN",
    text: "You wake up with no memory, in a small town called Pine Falls.\n\nWhat you do next could change everything.",
    choices: [{ text: "Begin Your Journey", next: "intro", effects: {} }],
  },

  intro: {
    title: "Awakening",
    text: "You wake up at the train station with no memory. Your pockets are empty except for a worn photograph of this town: Pine Falls. Where are you? Who are you?",
    choices: [
      {
        text: "Head to the nearest building—a small diner",
        next: "diner",
        effects: { memory: 5 },
      },
      {
        text: "Explore the empty platform first",
        next: "platform",
        effects: { memory: 10 },
      },
    ],
  },

  diner: {
    title: "The Diner",
    text: "A warm diner greets you. Behind the counter is MAYA, a kind-looking woman in her 40s. She gasps when she sees you.\n\n'My God... I thought you were... Are you alright?'",
    choices: [
      {
        text: "'Do I know you?' (Honest)",
        next: "diner_honest",
        effects: { memory: 5, trust: 10, suspicion: 5 },
      },
      {
        text: "'I'm just passing through.' (Evasive)",
        next: "diner_evasive",
        effects: { trust: -10, suspicion: 20 },
      },
      {
        text: "'Tell me everything you know.' (Demanding)",
        next: "diner_demand",
        effects: { trust: -20, suspicion: 30 },
      },
    ],
  },

  platform: {
    title: "The Platform",
    text: "You search the platform. Under a bench, you find a train ticket stub with 'PINE FALLS' printed on it and a date from 3 months ago. There's also a locker key (#247). Your hands trembled—you've been here before.",
    choices: [
      {
        text: "Go to the diner for help",
        next: "diner",
        effects: { memory: 15, inventory: ["ticket_stub", "locker_key"] },
      },
      {
        text: "Search for locker #247",
        next: "locker_room",
        effects: { memory: 20, inventory: ["ticket_stub", "locker_key"] },
      },
    ],
  },

  diner_honest: {
    title: "Maya's Story",
    text: "Maya sits you down with coffee. 'You disappeared three months ago. You were investigating something in this town... something dangerous. Then you vanished without a trace. Everyone thought you were dead.'\n\nShe slides you an old newspaper. The headline: 'LOCAL JOURNALIST GOES MISSING'",
    choices: [
      {
        text: "Ask about the investigation",
        next: "investigation_path",
        effects: { memory: 25 },
      },
      {
        text: "Ask about your life before",
        next: "life_before",
        effects: { memory: 20 },
      },
    ],
  },

  diner_evasive: {
    title: "Suspicious Reactions",
    text: "Maya's expression darkens. 'Of course you don't remember me. Or you're lying.' She crosses her arms. 'We heard rumors about you snooping around town three months ago. Then you disappeared. Some people think you ran off. Others think you found something and got silenced.'",
    choices: [
      {
        text: "Apologize and ask for the truth",
        next: "diner_honest",
        effects: { memory: 5, trust: 5 },
      },
      {
        text: "Leave the diner and investigate alone",
        next: "town_square",
        effects: { trust: -15 },
      },
    ],
  },

  diner_demand: {
    title: "Doors Slammed Shut",
    text: "Maya's face hardens. She stands up abruptly. 'I don't know who you are anymore, but you're not the person I knew.' She walks to the back and locks the door. You're alone in the diner. A hand-written note sits on the counter:\n\n'STOP ASKING QUESTIONS. OR ELSE. - THE COUNCIL'",
    choices: [
      {
        text: "Pocket the note and leave",
        next: "town_square",
        effects: { suspicion: 40, memory: 10, inventory: ["threatening_note"] },
      },
      {
        text: "Try to follow Maya",
        next: "diner_confrontation",
        effects: { suspicion: 50 },
      },
    ],
  },

  locker_room: {
    title: "Locker #247",
    text: "You find the locker room at the train station. Locker #247 opens to reveal: an old journal, a stack of newspaper clippings about 'PINE FALLS COUNCIL CORRUPTION', and a photograph of you with someone labeled 'DO NOT TRUST - THE MAYOR'",
    choices: [
      {
        text: "Take everything and head to the diner",
        next: "diner",
        effects: {
          memory: 35,
          inventory: ["journal", "clippings", "mayors_photo"],
        },
      },
      {
        text: "Go directly to confront the mayor",
        next: "mayor_office",
        effects: {
          memory: 35,
          inventory: ["journal", "clippings", "mayors_photo"],
          suspicion: 40,
        },
      },
    ],
  },

  investigation_path: {
    title: "The Corruption Runs Deep",
    text: "'You were investigating the Pine Falls Council,' Maya explains. 'You found evidence of embezzlement, illegal land deals, and worse. You said someone on the council was dangerous. Then... you were gone. Your apartment was ransacked.'",
    choices: [
      {
        text: "Ask for access to your old apartment",
        next: "apartment",
        effects: { memory: 30 },
      },
      {
        text: "Ask which council member is the most dangerous",
        next: "council_suspicion",
        effects: { memory: 25 },
      },
    ],
  },

  life_before: {
    title: "A Life Forgotten",
    text: "'You were a journalist, freelance. You came here to work on a story. You rented a small apartment above the library. You were charming, curious, always asking questions.' Maya's voice grows sad. 'Then something changed. You seemed afraid. You stopped coming by. Then you were gone.'",
    choices: [
      {
        text: "Go to the library and apartment",
        next: "apartment",
        effects: { memory: 20 },
      },
      {
        text: "Ask to see your old notes",
        next: "investigation_path",
        effects: { memory: 15 },
      },
    ],
  },

  town_square: {
    title: "The Watching Eyes",
    text: "You walk through the quiet town square. Shops are closed. People stop and stare at you. One old man whispers to another, then hurries away. There's a police station, town hall, and the library. You feel like you're being watched.",
    choices: [
      {
        text: "Visit the police station",
        next: "police_station",
        effects: { suspicion: 10 },
      },
      {
        text: "Visit the library",
        next: "apartment",
        effects: { suspicion: 5 },
      },
      {
        text: "Confront someone and ask directly what happened",
        next: "confrontation_scene",
        effects: { suspicion: 30 },
      },
    ],
  },

  apartment: {
    title: "Your Old Apartment",
    text: "You find the apartment above the library. The door is slightly ajar. Inside, it's been ransacked, but you find a hidden safe behind a loose wall panel. On the wall, written in red pen: 'YOU KNOW TOO MUCH'",
    choices: [
      {
        text: "Try to open the safe (need a code)",
        next: "safe_puzzle",
        effects: { memory: 25 },
      },
      {
        text: "Leave and take your findings to Maya",
        next: "endgame_good",
        effects: { memory: 20, trust: 30 },
      },
    ],
  },

  safe_puzzle: {
    title: "The Safe",
    text: "The safe has a number lock. You notice scratches around numbers: 4, 7, 1. Your birthday? A date? You try different combinations...",
    choices: [
      {
        text: "4-7-1 (Try in order)",
        next: "safe_open_truth",
        effects: { memory: 40 },
      },
      {
        text: "1-4-7 (Different order)",
        next: "safe_open_partial",
        effects: { memory: 30 },
      },
      {
        text: "Give up and leave",
        next: "town_square",
        effects: { memory: 10 },
      },
    ],
  },

  safe_open_truth: {
    title: "The Whole Truth",
    text: "The safe opens. Inside: evidence of a massive conspiracy. Photos of council members meeting with criminals. Coded messages. A letter addressed to you: 'If you're reading this, you uncovered the truth. The Mayor has ordered your elimination. Trust only Maya. —Your Editor'",
    choices: [
      {
        text: "Go to Maya with proof",
        next: "endgame_good",
        effects: { memory: 50, trust: 50 },
      },
      {
        text: "Go directly to confront the Mayor",
        next: "mayor_confrontation",
        effects: { memory: 50, suspicion: 40 },
      },
    ],
  },

  safe_open_partial: {
    title: "Fragments",
    text: "You open the safe and find documents, but they're partially burned. You can make out mentions of 'illegal operations' and names you can't quite remember. The evidence is incomplete.",
    choices: [
      {
        text: "Find Maya and piece this together",
        next: "investigation_path",
        effects: { memory: 25 },
      },
      {
        text: "Confront the Mayor directly",
        next: "mayor_office",
        effects: { memory: 25, suspicion: 50 },
      },
    ],
  },

  police_station: {
    title: "The Police Station",
    text: "You enter. The officer at the desk—SHERIFF COLE—looks shocked. 'You're alive. Didn't expect that.' His hand moves toward his belt. 'You disappeared three months ago. Left a lot of people wondering. Some thought you were dead. Others thought you found your answers.'",
    choices: [
      {
        text: "Ask what he knows about your disappearance",
        next: "sheriff_interrogation",
        effects: { suspicion: 20 },
      },
      {
        text: "Leave immediately",
        next: "town_square",
        effects: { suspicion: 30 },
      },
    ],
  },

  sheriff_interrogation: {
    title: "The Sheriff's Story",
    text: "Sheriff Cole leans back. 'Look, I'm not involved in whatever you uncovered. But people in this town have secrets. Dark ones. You were asking the wrong questions to the wrong people. My advice? Leave and never come back.'",
    choices: [
      {
        text: "Ask who specifically threatened you",
        next: "council_suspicion",
        effects: { memory: 20, trust: 5 },
      },
      {
        text: "Leave and investigate on your own",
        next: "investigation_path",
        effects: { memory: 15 },
      },
    ],
  },

  council_suspicion: {
    title: "The Council Members",
    text: "Maya gives you names: Mayor RICHARD STONE (ambitious, ruthless), Councilwoman HELEN GREY (quiet, manipulative), and Councilman THOMAS WRIGHT (has connections). 'Richard was most interested in silencing you,' Maya says quietly. 'But Helen... Helen scares me more.'",
    choices: [
      {
        text: "Investigate the Mayor's office",
        next: "mayor_office",
        effects: { suspicion: 30 },
      },
      {
        text: "Investigate Helen quietly",
        next: "helen_investigation",
        effects: { memory: 15, suspicion: 20 },
      },
    ],
  },

  mayor_office: {
    title: "The Mayor's Office",
    text: "You break into the town hall. The Mayor's office is pristine—too pristine. There's a safe in the wall, papers on the desk about 'Project Silence', and photographs of people with their faces scratched out. Footsteps approach from the hallway...",
    choices: [
      {
        text: "Hide and wait",
        next: "mayor_confrontation",
        effects: { suspicion: 40 },
      },
      {
        text: "Grab what you can and run",
        next: "escape_scene",
        effects: {
          suspicion: 50,
          memory: 20,
          inventory: ["project_silence_docs"],
        },
      },
    ],
  },

  helen_investigation: {
    title: "Helen's Secret",
    text: "You follow Helen to an old warehouse on the edge of town. Through a window, you see her meeting with someone—a man with a scar. They're discussing 'the journalist problem' and '3 months ago.' You realize Helen might be the real architect of everything.",
    choices: [
      {
        text: "Confront Helen with what you know",
        next: "helen_confrontation",
        effects: { suspicion: 60, memory: 30 },
      },
      {
        text: "Gather more evidence before acting",
        next: "apartment",
        effects: { memory: 25, suspicion: 40 },
      },
    ],
  },

  mayor_confrontation: {
    title: "Face to Face",
    text: "Mayor Stone enters his office and sees you. His expression changes to fury. 'You. I had you taken care of three months ago. How did you—' He reaches for a phone. 'You won't leave this office alive.'",
    choices: [
      {
        text: "Fight and escape",
        next: "escape_scene",
        effects: { suspicion: 80, memory: 40 },
      },
      {
        text: "Try to negotiate",
        next: "mayor_revelation",
        effects: { memory: 35 },
      },
    ],
  },

  mayor_revelation: {
    title: "The Mayor's Confession",
    text: "'Why?' you demand. Stone laughs bitterly. 'You were going to expose everything. But you're the least of my worries. You think this is about money? It's about power. Helen Greene—the councilwoman—she's the real boss. I'm just cleanup.'",
    choices: [
      {
        text: "Leave and confront Helen",
        next: "helen_final_confrontation",
        effects: { memory: 50, trust: 10 },
      },
      {
        text: "Arrest the Mayor yourself (with evidence)",
        next: "endgame_justice",
        effects: { memory: 50, trust: 40 },
      },
    ],
  },

  escape_scene: {
    title: "Running Through the Night",
    text: "You flee into the darkness with the evidence. The town's secrets are in your hands. You can go to the state police, the news, or... you could use this information differently. Power corrupts. What will you do?",
    choices: [
      {
        text: "Go to the state police with evidence",
        next: "endgame_justice",
        effects: { memory: 40, trust: 30 },
      },
      {
        text: "Contact a major newspaper",
        next: "endgame_expose",
        effects: { memory: 45, trust: 20 },
      },
      {
        text: "Use the evidence to gain power in the town",
        next: "endgame_dark",
        effects: { memory: 50, trust: -40, suspicion: 80 },
      },
    ],
  },

  helen_confrontation: {
    title: "Face to Face with Helen",
    text: "Helen smiles when she sees you. 'Clever. You figured it out. But you can't prove anything that won't disappear. And you're still the town's villain—the crazy journalist who vanished for three months. Who would believe you?'",
    choices: [
      {
        text: "Show her the evidence you have",
        next: "endgame_expose",
        effects: { memory: 55, trust: 25 },
      },
      {
        text: "Turn her offer down and go to authorities",
        next: "endgame_justice",
        effects: { memory: 50, trust: 45 },
      },
    ],
  },

  helen_final_confrontation: {
    title: "The Architect",
    text: "Helen listens calmly as you accuse her. 'Yes, I orchestrated your disappearance. You were dangerous. But now you're back, and you know too much. The question is: what are you going to do about it?' She extends her hand. 'Join us. Use what you know. Or...'",
    choices: [
      {
        text: "Refuse and expose everything",
        next: "endgame_expose",
        effects: { memory: 60, trust: 50 },
      },
      {
        text: "Take her hand",
        next: "endgame_dark",
        effects: { memory: 60, trust: -50, suspicion: 100 },
      },
    ],
  },

  diner_confrontation: {
    title: "Maya's Truth",
    text: "You force your way into the back. Maya is on the phone, hanging up quickly. Her eyes are sad. 'I wanted to protect you. But they found you. I'm sorry, but I had to call them.'",
    choices: [
      {
        text: "Flee the diner",
        next: "escape_scene",
        effects: { memory: 20, trust: -50, suspicion: 70 },
      },
    ],
  },

  confrontation_scene: {
    title: "Public Reckoning",
    text: "You grab someone in the street and demand answers. 'Where was I? What happened to me?' Suddenly, you're surrounded by townspeople. Some look afraid. Others angry. The Sheriff appears, hand on his gun.",
    choices: [
      {
        text: "Apologize and back down",
        next: "diner",
        effects: { trust: -10, suspicion: 60 },
      },
      {
        text: "Stand your ground and challenge them",
        next: "endgame_dark",
        effects: { suspicion: 80, memory: 30 },
      },
    ],
  },

  // ENDINGS
  endgame_good: {
    title: "The Truth Prevails",
    text: "ENDING: REDEMPTION\n\nWith Maya's help and the evidence you gathered, you expose the corruption. The state police raid Pine Falls. Mayor Stone is arrested. Councilwoman Helen Greene disappears, but her network falls apart. You regain your memory slowly—you're ALEX, a journalist who came here to expose a conspiracy and succeeded. The town begins to heal as Maya becomes interim mayor.",
    choices: [{ text: "Start Over", next: "intro", effects: {} }],
  },

  endgame_justice: {
    title: "Justice Served",
    text: "ENDING: THE WHISTLEBLOWER\n\nYou bring the evidence to the state police. They launch a full investigation and arrest council members. You testify under oath, and your memory returns fully—you're ALEX, a journalist who discovered a corruption ring. The town is cleaned up and the guilty are punished. You become a hero. But Helen Greene remains at large, and you receive threatening letters. The cost of truth is high.",
    choices: [{ text: "Start Over", next: "intro", effects: {} }],
  },

  endgame_expose: {
    title: "Headline News",
    text: "ENDING: NATIONAL EXPOSURE\n\nYou contact the state newspaper and they investigate. The story breaks: 'SMALL TOWN'S CORRUPTION RING EXPOSED BY MISSING JOURNALIST.' Your face is on the front page and your memory returns—you're ALEX, finally vindicated. The scandal goes national and federal agents get involved. Pine Falls becomes infamous. You're offered a book deal and speaking engagements, but you feel hollow. You exposed the darkness, but at what cost?",
    choices: [{ text: "Start Over", next: "intro", effects: {} }],
  },

  endgame_dark: {
    title: "Power Corrupts",
    text: "ENDING: THE DARK PATH\n\nYou use the evidence to seize control. With Helen's backing, you become the new power broker in Pine Falls. Your memory returns fully—you're ALEX. But ALEX is no longer a journalist seeking truth. You've become a puppet master. The conspiracy continues, just with different hands at the helm. You've become what you swore to destroy.",
    choices: [{ text: "Start Over", next: "intro", effects: {} }],
  },
};

function setup() {
  createCanvas(1000, 700);
  textSize(16);
  // Load a pixel-style font
  textFont("Courier New, monospace");
}

function getBackgroundColor() {
  // Pixel art mystery theme - dark, moody retro colors
  let r, g, b;

  if (gameState.suspicion > 70) {
    // High suspicion = deep purple/red danger
    r = 139;
    g = 35;
    b = 69;
  } else if (gameState.suspicion > 40) {
    // Medium suspicion = dark blue/purple mystery
    r = 47;
    g = 79;
    b = 126;
  } else if (gameState.trust > 70) {
    // High trust = warm brown/orange safe
    r = 101;
    g = 67;
    b = 33;
  } else if (gameState.memory > 70) {
    // High memory = clear cyan/blue clarity
    r = 33;
    g = 150;
    b = 243;
  } else {
    // Default mysterious deep purple
    r = 25;
    g = 25;
    b = 51;
  }

  return color(r, g, b);
}

function drawRoundedRect(x, y, w, h, r) {
  // Draw a rounded rectangle
  beginShape();
  vertex(x + r, y);
  vertex(x + w - r, y);
  quadraticVertex(x + w, y, x + w, y + r);
  vertex(x + w, y + h - r);
  quadraticVertex(x + w, y + h, x + w - r, y + h);
  vertex(x + r, y + h);
  quadraticVertex(x, y + h, x, y + h - r);
  vertex(x, y + r);
  quadraticVertex(x, y, x + r, y);
  endShape();
}

function wrapText(text, x, y, maxWidth) {
  // Split by newlines first to preserve paragraph breaks
  let paragraphs = text.split("\n");
  let allLines = [];

  for (let para of paragraphs) {
    let words = para.split(" ");
    let currentLine = "";

    for (let word of words) {
      let testLine = currentLine + (currentLine ? " " : "") + word;
      let w = textWidth(testLine);

      if (w > maxWidth && currentLine !== "") {
        allLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) allLines.push(currentLine);
    allLines.push(""); // Add empty line for paragraph break
  }

  return allLines;
}

function isEndingScene(sceneKey) {
  // Check if scene is an ending scene
  return sceneKey.startsWith("endgame_");
}

function draw() {
  // Set background based on stats
  let bgColor = getBackgroundColor();
  background(bgColor);

  let scene = scenes[gameState.currentScene];

  if (!scene) {
    console.error("Scene not found:", gameState.currentScene);
    return;
  }

  // Content area (centered box) - pixel art style
  let contentX = width / 2 - 350;
  let contentY = 30;
  let contentWidth = 700;
  let contentHeight = 640;

  // Pixel art background with double border effect
  fill(10, 10, 25);
  rect(contentX, contentY, contentWidth, contentHeight);

  // Outer border (thick pixel border)
  stroke(255, 200, 50);
  strokeWeight(4);
  noFill();
  rect(contentX, contentY, contentWidth, contentHeight);

  // Inner border (accent)
  stroke(100, 200, 255);
  strokeWeight(2);
  rect(contentX + 4, contentY + 4, contentWidth - 8, contentHeight - 8);
  noStroke();

  // Display title
  fill(255, 200, 50);
  textSize(28);
  textAlign(CENTER);
  textStyle(BOLD);
  text(scene.title, width / 2, contentY + 35);
  textStyle(NORMAL);

  // Display story text (centered and wrapped)
  fill(200, 220, 255);
  textSize(13);
  textAlign(isEndingScene(gameState.currentScene) ? LEFT : CENTER);
  let textY = contentY + 75;
  let lines = wrapText(scene.text, contentX + 30, textY, contentWidth - 60);

  for (let line of lines) {
    if (line === "") {
      // Skip empty lines for paragraph breaks
      textY += 12;
      continue;
    }
    if (isEndingScene(gameState.currentScene)) {
      text(line, contentX + 40, textY);
    } else {
      text(line, width / 2, textY);
    }
    textY += 24;
  }

  // If this is an ending scene, display final stats below the text
  if (isEndingScene(gameState.currentScene)) {
    // Separator line
    stroke(100, 200, 255);
    strokeWeight(2);
    line(contentX + 40, textY + 10, contentX + contentWidth - 40, textY + 10);
    noStroke();

    // Stats section
    fill(255, 200, 50);
    textSize(12);
    textStyle(BOLD);
    textAlign(CENTER);
    text("FINAL STATS", width / 2, textY + 35);
    textStyle(NORMAL);

    fill(200, 220, 255);
    textSize(12);
    textY += 55;
    text(`MEMORY: ${gameState.memory}%`, width / 2, textY);
    textY += 25;
    text(`TRUST: ${gameState.trust}%`, width / 2, textY);
    textY += 25;
    text(`SUSPICION: ${gameState.suspicion}%`, width / 2, textY);
  }

  // Display choice buttons - pixel art style
  textSize(13);
  textAlign(CENTER);
  let buttonY = contentY + contentHeight - 110;

  for (let i = 0; i < scene.choices.length; i++) {
    let choice = scene.choices[i];
    let buttonX = width / 2;
    let buttonWidth = 620;
    let buttonHeight = 42;

    // Draw pixel-style button with thick border
    fill(50, 100, 200);
    stroke(150, 200, 255);
    strokeWeight(3);
    rect(
      buttonX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
    );

    // Inner highlight
    stroke(200, 255, 100);
    strokeWeight(1);
    rect(
      buttonX - buttonWidth / 2 + 2,
      buttonY - buttonHeight / 2 + 2,
      buttonWidth - 4,
      buttonHeight - 4,
    );

    // Button text
    fill(0);
    noStroke();
    text(choice.text, buttonX, buttonY + 3);

    // Store button info for click detection
    choice.x = buttonX - buttonWidth / 2;
    choice.y = buttonY - buttonHeight / 2;
    choice.w = buttonWidth;
    choice.h = buttonHeight;

    buttonY += 54;
  }

  // Menu button (top right) - pixel style
  if (
    gameState.currentScene !== "homeScreen" &&
    !gameState.showStatsModal &&
    !gameState.showPauseMenu
  ) {
    fill(100, 150, 200);
    stroke(150, 200, 255);
    strokeWeight(2);
    rect(width - 120, 20, 100, 40);

    fill(255, 200, 50);
    noStroke();
    textSize(12);
    textAlign(CENTER);
    text("STATS (S)", width - 70, 48);
  }

  // Pause button (top left) - pixel style
  if (
    gameState.currentScene !== "homeScreen" &&
    !gameState.showStatsModal &&
    !gameState.showPauseMenu
  ) {
    fill(100, 150, 200);
    stroke(150, 200, 255);
    strokeWeight(2);
    rect(20, 20, 100, 40);

    fill(255, 200, 50);
    noStroke();
    textSize(12);
    textAlign(CENTER);
    text("PAUSE (P)", 70, 48);
  }

  // Draw stats modal if active
  if (gameState.showStatsModal) {
    drawStatsModal();
  }

  // Draw pause menu if active
  if (gameState.showPauseMenu) {
    drawPauseMenu();
  }
}

function drawStatsModal() {
  // Dark overlay
  fill(0, 0, 0, 200);
  rect(0, 0, width, height);

  // Modal box - pixel art style
  let modalWidth = 500;
  let modalHeight = 400;
  let modalX = width / 2 - modalWidth / 2;
  let modalY = height / 2 - modalHeight / 2;

  fill(10, 10, 25);
  stroke(255, 200, 50);
  strokeWeight(4);
  rect(modalX, modalY, modalWidth, modalHeight);

  // Inner border
  stroke(100, 200, 255);
  strokeWeight(2);
  rect(modalX + 4, modalY + 4, modalWidth - 8, modalHeight - 8);
  noStroke();

  // Title
  fill(255, 200, 50);
  textSize(32);
  textAlign(CENTER);
  textStyle(BOLD);
  text("[ STATS ]", width / 2, modalY + 40);
  textStyle(NORMAL);

  // Stats display
  fill(200, 220, 255);
  textSize(16);
  textAlign(LEFT);
  let statY = modalY + 90;
  let statX = modalX + 40;

  // Memory stat
  text("MEMORY:", statX, statY);
  drawPixelStatBar(
    statX,
    statY + 15,
    400,
    20,
    gameState.memory,
    color(100, 200, 255),
  );
  text(`${gameState.memory}%`, statX + 420, statY + 32);

  // Trust stat
  statY += 70;
  text("TRUST:", statX, statY);
  drawPixelStatBar(
    statX,
    statY + 15,
    400,
    20,
    gameState.trust,
    color(100, 255, 100),
  );
  text(`${gameState.trust}%`, statX + 420, statY + 32);

  // Suspicion stat
  statY += 70;
  text("SUSPICION:", statX, statY);
  drawPixelStatBar(
    statX,
    statY + 15,
    400,
    20,
    gameState.suspicion,
    color(255, 100, 100),
  );
  text(`${gameState.suspicion}%`, statX + 420, statY + 32);

  // Close instruction
  fill(150, 150, 150);
  textSize(12);
  textAlign(CENTER);
  text("PRESS S or ESC to close", width / 2, modalY + modalHeight - 20);
}

function drawStatBar(x, y, w, h, value, barColor) {
  // Background bar
  fill(50, 50, 70);
  stroke(100, 100, 120);
  strokeWeight(1);
  rect(x, y, w, h);

  // Value bar
  fill(barColor);
  noStroke();
  let fillWidth = (value / 100) * w;
  rect(x, y, fillWidth, h);
}

function drawPixelStatBar(x, y, w, h, value, barColor) {
  // Pixel-style stat bar with borders
  fill(25, 25, 50);
  stroke(100, 150, 255);
  strokeWeight(2);
  rect(x, y, w, h);

  // Value bar
  fill(barColor);
  noStroke();
  let fillWidth = (value / 100) * w;
  rect(x + 2, y + 2, fillWidth - 4, h - 4);
}

function drawPauseMenu() {
  // Dark overlay
  fill(0, 0, 0, 200);
  rect(0, 0, width, height);

  // Modal box - pixel art style
  let modalWidth = 400;
  let modalHeight = 300;
  let modalX = width / 2 - modalWidth / 2;
  let modalY = height / 2 - modalHeight / 2;

  fill(10, 10, 25);
  stroke(255, 200, 50);
  strokeWeight(4);
  rect(modalX, modalY, modalWidth, modalHeight);

  // Inner border
  stroke(100, 200, 255);
  strokeWeight(2);
  rect(modalX + 4, modalY + 4, modalWidth - 8, modalHeight - 8);
  noStroke();

  // Title
  fill(255, 200, 50);
  textSize(36);
  textAlign(CENTER);
  textStyle(BOLD);
  text("[ PAUSED ]", width / 2, modalY + 50);
  textStyle(NORMAL);

  // Resume button
  let buttonY = modalY + 100;
  let buttonX = width / 2;
  let buttonWidth = 300;
  let buttonHeight = 50;

  fill(100, 150, 200);
  stroke(150, 200, 255);
  strokeWeight(3);
  rect(buttonX - buttonWidth / 2, buttonY, buttonWidth, buttonHeight);

  fill(255, 200, 50);
  noStroke();
  textSize(16);
  text("RESUME (P)", buttonX, buttonY + 32);

  // Store button info
  let resumeBtn = {
    x: buttonX - buttonWidth / 2,
    y: buttonY,
    w: buttonWidth,
    h: buttonHeight,
    action: "resume",
  };

  // Go to Menu button
  buttonY += 70;
  fill(150, 100, 150);
  stroke(200, 150, 200);
  strokeWeight(3);
  rect(buttonX - buttonWidth / 2, buttonY, buttonWidth, buttonHeight);

  fill(255, 200, 50);
  noStroke();
  textSize(16);
  text("GO TO MENU", buttonX, buttonY + 32);

  let menuBtn = {
    x: buttonX - buttonWidth / 2,
    y: buttonY,
    w: buttonWidth,
    h: buttonHeight,
    action: "menu",
  };

  // Restart button
  buttonY += 70;
  fill(200, 100, 100);
  stroke(255, 150, 150);
  strokeWeight(3);
  rect(buttonX - buttonWidth / 2, buttonY, buttonWidth, buttonHeight);

  fill(255, 200, 50);
  noStroke();
  textSize(16);
  text("RESTART", buttonX, buttonY + 32);

  let restartBtn = {
    x: buttonX - buttonWidth / 2,
    y: buttonY,
    w: buttonWidth,
    h: buttonHeight,
    action: "restart",
  };

  // Store buttons globally for click detection
  window.pauseMenuButtons = [resumeBtn, menuBtn, restartBtn];
}

function mousePressed() {
  if (gameState.showPauseMenu) {
    // Handle pause menu clicks
    if (window.pauseMenuButtons) {
      for (let btn of window.pauseMenuButtons) {
        if (
          mouseX > btn.x &&
          mouseX < btn.x + btn.w &&
          mouseY > btn.y &&
          mouseY < btn.y + btn.h
        ) {
          if (btn.action === "resume") {
            gameState.showPauseMenu = false;
          } else if (btn.action === "menu") {
            resetGame();
            gameState.currentScene = "homeScreen";
            gameState.showPauseMenu = false;
          } else if (btn.action === "restart") {
            resetGame();
            gameState.currentScene = "intro";
            gameState.showPauseMenu = false;
          }
          return;
        }
      }
    }
    return; // Don't process other clicks while pause menu is open
  }

  if (gameState.showStatsModal) {
    return; // Don't process choices while stats modal is open
  }

  // Check if pause button was clicked
  if (
    gameState.currentScene !== "homeScreen" &&
    mouseX > 20 &&
    mouseX < 120 &&
    mouseY > 20 &&
    mouseY < 60
  ) {
    gameState.showPauseMenu = true;
    return;
  }

  // Check if stats button was clicked
  if (
    gameState.currentScene !== "homeScreen" &&
    mouseX > width - 120 &&
    mouseX < width - 20 &&
    mouseY > 20 &&
    mouseY < 60
  ) {
    gameState.showStatsModal = true;
    return;
  }

  let scene = scenes[gameState.currentScene];

  for (let choice of scene.choices) {
    if (
      mouseX > choice.x &&
      mouseX < choice.x + choice.w &&
      mouseY > choice.y &&
      mouseY < choice.y + choice.h
    ) {
      // Check if this is a "Start Over" choice - reset game first
      if (choice.text === "Start Over") {
        resetGame();
      }

      // Apply effects
      if (choice.effects) {
        gameState.memory += choice.effects.memory || 0;
        gameState.trust += choice.effects.trust || 0;
        gameState.suspicion += choice.effects.suspicion || 0;

        // Clamp values
        gameState.memory = constrain(gameState.memory, 0, 100);
        gameState.trust = constrain(gameState.trust, 0, 100);
        gameState.suspicion = constrain(gameState.suspicion, 0, 100);

        if (choice.effects.inventory) {
          gameState.inventory.push(...choice.effects.inventory);
        }
      }

      // Move to next scene
      gameState.currentScene = choice.next;
      gameState.history.push(choice.text);
      gameState.showStatsModal = false; // Auto-close stats modal on choice
      break;
    }
  }
}

function resetGame() {
  // Reset all stats and history
  gameState.memory = 0;
  gameState.trust = 50;
  gameState.suspicion = 30;
  gameState.inventory = [];
  gameState.history = [];
  gameState.showStatsModal = false;
  gameState.showPauseMenu = false;
}

function keyPressed() {
  // Press S or ESC to toggle stats modal
  if (key.toLowerCase() === "s" || key === "Escape") {
    if (gameState.currentScene !== "homeScreen" && !gameState.showPauseMenu) {
      gameState.showStatsModal = !gameState.showStatsModal;
    }
  }

  // Press P to toggle pause menu
  if (key.toLowerCase() === "p") {
    if (gameState.currentScene !== "homeScreen" && !gameState.showStatsModal) {
      gameState.showPauseMenu = !gameState.showPauseMenu;
    }
  }
}
