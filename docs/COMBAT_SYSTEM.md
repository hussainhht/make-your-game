# 🎮 Defense System Design Document

## 2D Fighting Game - Professional Gameplay Systems

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Blocking System](#blocking-system)
3. [Guard Meter](#guard-meter)
4. [Perfect Block / Just Guard](#perfect-block)
5. [Parry System](#parry-system)
6. [Defensive Escape Options](#escape-options)
7. [Anti-Turtling Rules](#anti-turtling)
8. [Controls Reference](#controls)
9. [Combat Scenarios](#scenarios)
10. [Balancing Considerations](#balancing)

---

## 🛡️ System Overview <a name="system-overview"></a>

This defense system provides **multi-layered defensive options** that balance accessibility for casual players with depth for competitive play. Inspired by Street Fighter's blocking, Guilty Gear's instant block, Tekken's parry, and Smash Bros' dodge mechanics.

### Core Design Principles

| Principle            | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| **Reactive Defense** | Defense should reward reaction and reads, not passive play |
| **Risk/Reward**      | Every defensive option has associated risk                 |
| **Counter-Play**     | Every defensive option has a counter                       |
| **Clear Feedback**   | Visual and audio cues must be unmistakable                 |

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      DEFENSE SYSTEM                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   BLOCKING  │  │ GUARD METER │  │  ESCAPES    │              │
│  │  - Stand    │  │  - 100 pts  │  │  - Backdash │              │
│  │  - Crouch   │  │  - Regen    │  │  - Roll     │              │
│  │  - Perfect  │  │  - Break    │  │  - Dodge    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│              ┌───────────┴───────────┐                          │
│              │    PARRY SYSTEM       │                          │
│              │   (Advanced Option)   │                          │
│              └───────────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ Blocking System <a name="blocking-system"></a>

### Overview

The blocking system uses **directional blocking** where players must match their block stance to the attack height.

### Block Types

| Block Type          | Input        | Blocks    | Vulnerable To |
| ------------------- | ------------ | --------- | ------------- |
| **Standing Block**  | Hold Block   | High, Mid | Low attacks   |
| **Crouching Block** | Block + Down | Low, Mid  | Overheads     |

### Attack Heights

```
HIGH ATTACKS (Standing Block)
├── Jabs, hooks, high kicks
├── Anti-air attacks
└── Most special moves

MID ATTACKS (Any Block)
├── Standard punches
├── Body kicks
└── Most combo fillers

LOW ATTACKS (Crouching Block)
├── Sweeps
├── Low kicks
└── Slide attacks

OVERHEAD (Standing Block Only)
├── Jumping attacks
├── Overhead slams
└── Command overheads
```

### Chip Damage

- **Normal attacks**: No chip damage when blocked
- **Special attacks**: 15% of damage dealt as chip damage
- **Chip damage cannot kill** (minimum 1 HP remains)

### Frame Advantage on Block

| Attack Type | Blockstun | Frame Advantage |
| ----------- | --------- | --------------- |
| Light       | 100ms     | -2 frames       |
| Medium      | 150ms     | -4 frames       |
| Heavy       | 250ms     | -8 frames       |

### Pushback

- Normal blocks: 3 units pushback
- Heavy attacks: 6 units pushback
- Pushback increases 30% under anti-turtle penalty

---

## 2️⃣ Guard Meter (Defense Gauge) <a name="guard-meter"></a>

### Overview

The Guard Meter represents your fighter's defensive stamina. It depletes when blocking and regenerates when not blocking.

### Configuration

```javascript
GUARD_METER: {
  MAX_VALUE: 100,
  REGEN_RATE: 8,        // Points per second
  REGEN_DELAY: 1.5,     // Seconds before regen starts
  DANGER_THRESHOLD: 25, // Visual warning
}
```

### Depletion Rates

| Attack Type | Guard Damage |
| ----------- | ------------ |
| Light       | 5 points     |
| Medium      | 10 points    |
| Heavy       | 15 points    |
| Special     | 20 points    |

### Guard Break

When the Guard Meter reaches **zero**:

1. **Guard Break Animation** plays (1.2 seconds)
2. Fighter is **fully vulnerable** during stun
3. Fighter takes **25 bonus damage**
4. Guard Meter recovers to **30%** after stun
5. **Screen shake** and **red flash** effects trigger

### Visual Feedback

| Meter Level | Visual                 |
| ----------- | ---------------------- |
| 100-50%     | Blue gradient bar      |
| 50-25%      | Yellow warning         |
| Below 25%   | Red pulsing + "DANGER" |
| 0%          | "GUARD BREAK!" flash   |

---

## 3️⃣ Perfect Block / Just Guard <a name="perfect-block"></a>

### Overview

A **timing-based** advanced block that rewards precise input with significant benefits.

### Timing Window

- **6 frames** (~100ms at 60fps)
- Input must be **just before** the attack connects

### Benefits

| Benefit            | Value                  |
| ------------------ | ---------------------- |
| Chip Damage        | 0% (complete negation) |
| Guard Meter Damage | -50% reduction         |
| Recovery           | +4 frames faster       |
| Super Meter Reward | +5 points              |

### Visual Feedback

- **Golden flash** on character
- **"PERFECT!"** text popup
- **Distinct sound effect**
- **Slight hit-freeze** (50ms)

### How to Execute

```
TIMING DIAGRAM:

Attack Incoming: ═══════════════════►

Perfect Window:            ╔══╗
                           ║  ║
                           ╚══╝
                          100ms

Block Input:                 ▼
```

---

## 4️⃣ Parry System <a name="parry-system"></a>

### Overview

An **advanced defensive technique** with high risk and high reward. Completely negates damage but is heavily punishable on failure.

### Configuration

```javascript
PARRY: {
  WINDOW_MS: 66,              // Stricter than perfect block
  RECOVERY_FRAMES_SUCCESS: 0,  // Instant recovery
  RECOVERY_FRAMES_FAIL: 24,    // ~400ms punish window
  ADVANTAGE_ON_SUCCESS: 12,    // +12 frame advantage
  METER_REWARD: 10,            // Super meter gain
}
```

### Risk/Reward Analysis

| Outcome     | Result                                           |
| ----------- | ------------------------------------------------ |
| **Success** | 0 damage, +12 frames, +10 meter, opponent frozen |
| **Failure** | 400ms vulnerable recovery (free punish)          |

### Visual Feedback

- **Cyan flash** on success
- **"PARRY!"** text with glow
- **Time freeze** effect (100ms)

### Input

- Dedicated parry button (L key)
- Must be **timed precisely** to incoming attack

---

## 5️⃣ Defensive Escape Options <a name="escape-options"></a>

### Backdash

| Property      | Value              |
| ------------- | ------------------ |
| Distance      | 150 units          |
| Duration      | 300ms              |
| Invincibility | Frames 1-9 (150ms) |
| Recovery      | 120ms vulnerable   |
| Cooldown      | 800ms              |

**Use Case**: Escape pressure, reset to neutral

### Roll

| Property      | Value                        |
| ------------- | ---------------------------- |
| Distance      | 200 units (through opponent) |
| Duration      | 500ms                        |
| Invincibility | Frames 3-21 (300ms)          |
| Recovery      | 150ms vulnerable             |
| Cooldown      | 1200ms                       |
| Cost          | 20 stamina                   |

**Use Case**: Escape corner, cross-up opponent

### Spot Dodge

| Property      | Value               |
| ------------- | ------------------- |
| Distance      | None (stationary)   |
| Duration      | 250ms               |
| Invincibility | Frames 1-11 (180ms) |
| Recovery      | 70ms vulnerable     |
| Cooldown      | 600ms               |

**Use Case**: Dodge single attack, bait whiff punish

### Invincibility Visualization

```
BACKDASH FRAMES:
[▓▓▓▓▓▓▓▓▓░░░░░░]
 ^^^^^^^^  ^^^^^
 INVINCIBLE RECOVERY

ROLL FRAMES:
[░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░]
   ^^^^^^^^^^^^^^^^^^^  ^^^^
   INVINCIBLE           RECOVERY

SPOT DODGE FRAMES:
[▓▓▓▓▓▓▓▓▓▓▓░░░]
 ^^^^^^^^^^^  ^^
 INVINCIBLE   RECOVERY
```

---

## 6️⃣ Anti-Turtling Rules <a name="anti-turtling"></a>

### Design Philosophy

Defense must **not be stronger than offense**. Continuous blocking should be actively discouraged.

### Continuous Block Penalty

When blocking for **more than 3 seconds continuously**:

| Penalty     | Multiplier        |
| ----------- | ----------------- |
| Guard Drain | 1.5x (50% faster) |
| Pushback    | 1.3x (30% more)   |

### Additional Anti-Turtle Mechanics

1. **Throws Beat Blocks**

   - Grabs cannot be blocked
   - Forces defender to tech or take damage

2. **Guard Break Damage**

   - Breaking guard deals 25 damage
   - Creates significant punish opportunity

3. **Chip Damage on Specials**

   - Forces defenders to take some damage
   - Cannot turtle with 1 HP

4. **Pushback to Corner**
   - Excessive blocking leads to corner trap
   - Limited escape options in corner

---

## 🎮 Controls Reference <a name="controls"></a>

### Default Keyboard Layout

| Action           | Primary | Secondary |
| ---------------- | ------- | --------- |
| Move Left        | ←       | A         |
| Move Right       | →       | D         |
| Jump             | ↑       | W         |
| Crouch           | ↓       | S         |
| Light/Mid Attack | Space   | J         |
| Heavy Attack     | U       | -         |
| Block            | Shift   | K         |
| Parry            | L       | -         |
| Backdash         | Q       | -         |
| Roll             | E       | -         |
| Spot Dodge       | R       | -         |

### Input Priority

```
1. PARRY (if pressed)
2. ESCAPE OPTIONS (if pressed)
3. ATTACK (if pressed and not blocking)
4. BLOCK (if held)
5. MOVEMENT (if not blocked by above)
```

---

## ⚔️ Example Combat Scenarios <a name="scenarios"></a>

### Scenario 1: Pressure Defense

```
ATTACKER throws: Jab → Jab → Heavy Kick

DEFENDER options:
├── Continue blocking (chip + guard damage)
├── Perfect block the heavy (reduced damage, +frames)
├── Parry the heavy (full punish, risky)
└── Backdash before heavy (escape pressure)
```

### Scenario 2: Mixup Defense

```
ATTACKER has +frames after blocked attack

ATTACKER options:
├── Overhead (must stand block)
└── Low sweep (must crouch block)

DEFENDER options:
├── Guess correctly (block)
├── Spot dodge on read (invincible)
├── Parry on read (punish opportunity)
└── Backdash to reset (safe but gives space)
```

### Scenario 3: Low Guard Meter

```
DEFENDER at 20% guard (DANGER zone)
ATTACKER knows one special will break guard

DEFENDER options:
├── Roll through (escape, costs stamina)
├── Parry (risky, but resets situation)
├── Take the guard break (accept punish)
└── Interrupt with attack (frame gamble)
```

### Scenario 4: Corner Pressure

```
DEFENDER cornered with limited space

ATTACKER pressure: Jab → Jab → Overhead/Low mixup

DEFENDER options:
├── Roll through attacker (escape corner)
├── Perfect block + punish
├── Spot dodge + reversal
└── Jump out (risky, anti-air vulnerable)
```

---

## ⚖️ Balancing Considerations <a name="balancing"></a>

### For Casual Players

| Feature                        | Why It Helps             |
| ------------------------------ | ------------------------ |
| Basic blocking                 | Intuitive hold-to-block  |
| Guard regeneration             | Recovers from mistakes   |
| Generous backdash i-frames     | Easy escape option       |
| Clear visual feedback          | Understand what happened |
| Forgiving perfect block window | Achievable with practice |

### For Competitive Players

| Feature                | Why It Adds Depth         |
| ---------------------- | ------------------------- |
| Tight parry window     | Rewards precise timing    |
| Frame advantage system | Rewards game knowledge    |
| Anti-turtle mechanics  | Prevents stalling         |
| Escape cooldowns       | Forces smart resource use |
| Guard break combos     | Rewards pressure          |

### Tuning Variables

```javascript
// Accessibility tuning
PERFECT_BLOCK.WINDOW_MS = 100; // ↑ = easier
PARRY.WINDOW_MS = 66; // ↓ = harder

// Pace tuning
GUARD_METER.REGEN_RATE = 8; // ↓ = more offensive
ESCAPE.BACKDASH.COOLDOWN = 0.8; // ↑ = less escape spam

// Risk tuning
PARRY.RECOVERY_FRAMES_FAIL = 24; // ↑ = more punishable
BLOCKING.CHIP_DAMAGE_PERCENT = 0.15; // ↑ = more damage through block
```

### Balance Testing Metrics

Track these during playtesting:

1. **Block Frequency**: Should be 30-40% of defense
2. **Perfect Block Rate**: Target 15-25% of blocks
3. **Parry Success Rate**: Target 40-60% (risky option)
4. **Guard Break Frequency**: 5-10% of rounds
5. **Average Round Length**: 60-90 seconds

---

## 📁 File Structure

```
game/js/
├── core/
│   ├── defense-system.js    # Main defense system logic
│   ├── engine.js
│   ├── input.js             # Updated for justPressed
│   └── physics.js
├── entities/
│   ├── fighter.js           # Updated with defense integration
│   ├── player.js            # Updated with new controls
│   └── enemy.js
└── ui/
    ├── defense-hud.js       # Guard meter & feedback UI
    └── hud.js
```

---

## 🔧 Implementation Status

| Feature                  | Status      |
| ------------------------ | ----------- |
| ✅ Standing Block        | Implemented |
| ✅ Crouching Block       | Implemented |
| ✅ Guard Meter           | Implemented |
| ✅ Guard Break           | Implemented |
| ✅ Perfect Block         | Implemented |
| ✅ Parry System          | Implemented |
| ✅ Backdash              | Implemented |
| ✅ Roll                  | Implemented |
| ✅ Spot Dodge            | Implemented |
| ✅ Anti-Turtle Mechanics | Implemented |
| ✅ Visual Feedback UI    | Implemented |
| ✅ Defense HUD           | Implemented |

---

_Defense System v1.0 - Designed for competitive play with casual accessibility_
