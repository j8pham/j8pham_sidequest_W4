# Project Title

GBDA302 Week 4: Data-Driven Dungeon Drop

---

## Authors

Jason Pham (j8pham) (21106514)  
Previously by Karen Cochrane and David Han

---

## Description

Dungeon Drop is a vertical dungeon arcade game where the player controls a blob that continuously drops downward through increasingly dangerous levels. The player must avoid spikes and monsters while collecting blob fragments to gain points. A rare mischievous blob can also appear, granting temporary immunity. As the blob descends, an anxiety system kicks in where it changes color and becomes more anxious the deeper it goes.

Every 25 floors the difficulty ramps up with a new level.
Each level has its own:

- spawn rates
- platform speeds
- color theme
  so the dungeon feels different as you progress.

A "LEVEL X" banner fades in when you reach a new stage. There are 4 levels total, and if you survive past all of them it keeps you on the hardest one.

## Setup and Interaction Instructions

### Setup

- Run in web browser (GitHub Pages link)

### Controls

- **A / D or Left / Right Arrow Keys**: Move left and right
- **Space Bar or W or Up Arrow**: Jump
- **R**: Restart

### Objective

- Avoid spikes and monsters
- Collect blob pieces to increase score
- Collect the mischievous blob to gain temporary immunity
- Survive as long as possible as speed and difficulty increase
- Every 25 floors you progress to a harder level with new colors and settings

---

## Iteration Notes

### Post-Playtest: Changes Made

1. Simplified the JSON level structure after the first version was too complex.
2. Changed from a basic 2-level system to a floor-based progression where every 25 floors is a new level.
3. Added color themes from the JSON so each level looks visually distinct.
4. Fixed a level transition bug where loadLevel() was wiping all platforms mid-game and causing a black screen. Changed it so mid-game transitions only swap the config without clearing existing platforms.

### Post-Showcase: Planned Improvements

1. Add a third level with unique mechanics like moving platforms or disappearing tiles.
2. Add a brief slowdown or pause effect during level transitions for more impact.

---

## Assets

N/A

---

## GenAI

- I came up with the idea and planned the approach myself.
- GenAI was used through prompt engineering to write the code.
  The code was written and comments were written by GenAi. Tweaks/bugs were done by Jason Pham.

---

## References

[1] D. Han and K. Cochrane, "Week 4 Code Tutorial: JSON Files & Classes," GBDA 302, University of Waterloo, Winter 2026.
