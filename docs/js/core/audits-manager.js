// js/core/audits-manager.js
// Manages sequential "Audit" fights where enemies spawn one after another.
// The player keeps their exact state (HP, position, buffs) across all audits.

import { CHARACTER_TYPES } from "../character-types.js";
import { SpriteEnemy } from "../entities/sprite-enemy.js";
import { Enemy } from "../entities/enemy.js";

/**
 * Build a roster array from CHARACTER_TYPES, filtering to only
 * sprite-based characters (they have spriteConfig and work as enemies).
 */
function buildRoster() {
  const roster = [];
  for (const [id, charType] of Object.entries(CHARACTER_TYPES)) {
    if (charType.useSprite && charType.spriteConfig) {
      roster.push({ id, ...charType });
    }
  }
  // Fallback: if roster is empty, add a basic non-sprite entry
  if (roster.length === 0) {
    roster.push({
      id: "2",
      type: "ninja",
      name: "Shadow Ninja",
      color: "#9900ff",
      useSprite: false,
    });
  }
  return roster;
}

export class AuditsManager {
  /**
   * @param {Object} options
   * @param {number}   options.totalAudits   – how many enemies in total
   * @param {number}   options.enemyHP       – HP each enemy spawns with
   * @param {string}   options.label         – label prefix e.g. "YAMAN" or "AHMED ABDEEN"
   * @param {string}   options.difficulty    – AI difficulty for spawned enemies
   * @param {number}   options.enemyStrength – base strength for spawned enemies
   * @param {number}   options.enemySpeed    – base speed for spawned enemies
   * @param {number}   options.enemyDefense  – base defense for spawned enemies
   * @param {Function} options.onAuditStart  – (auditIndex, totalAudits, enemyName) => void
   * @param {Function} options.onAuditEnd    – (auditIndex, totalAudits) => void
   * @param {Function} options.onAllComplete – () => void
   * @param {Function} options.onPlayerDied  – () => void
   */
  constructor(options) {
    this.totalAudits = options.totalAudits || 3;
    this.enemyHP = options.enemyHP || 70;
    this.label = options.label || "AUDIT";
    this.difficulty = options.difficulty || "normal";
    this.enemyStrength = options.enemyStrength || 60;
    this.enemySpeed = options.enemySpeed || 50;
    this.enemyDefense = options.enemyDefense || 45;

    // Callbacks
    this.onAuditStart = options.onAuditStart || (() => {});
    this.onAuditEnd = options.onAuditEnd || (() => {});
    this.onAllComplete = options.onAllComplete || (() => {});
    this.onPlayerDied = options.onPlayerDied || (() => {});

    // State
    this.currentAudit = 0; // 0-indexed, incremented before spawn
    this.active = false;
    this.roster = buildRoster();
    this.lastEnemyId = null;

    // References set externally after each spawn
    this.currentEnemy = null;
  }

  /** Start the audit sequence */
  start() {
    this.currentAudit = 0;
    this.active = true;
    this.lastEnemyId = null;
    return this.spawnNext();
  }

  /**
   * Pick a random character from the roster, avoiding immediate duplicates.
   * Returns the character-type object.
   */
  pickRandom() {
    let pool = this.roster;

    // Avoid immediate duplicate if we have more than one option
    if (pool.length > 1 && this.lastEnemyId !== null) {
      pool = pool.filter((c) => c.id !== this.lastEnemyId);
    }

    const pick = pool[Math.floor(Math.random() * pool.length)];
    this.lastEnemyId = pick.id;
    return pick;
  }

  /**
   * Spawn the next enemy. Returns an object { enemy, enemyEl } that the
   * caller must attach to the DOM and game loop.
   * Returns null if all audits are complete.
   */
  spawnNext() {
    if (this.currentAudit >= this.totalAudits) {
      this.active = false;
      this.onAllComplete();
      return null;
    }

    this.currentAudit++;
    const charType = this.pickRandom();
    const enemyX = 650;

    let enemy;
    let enemyEl = document.createElement("div");
    enemyEl.className = "fighter enemy";

    if (charType.useSprite && charType.spriteConfig) {
      const scale = charType.customScale || 2.5;
      enemy = new SpriteEnemy({
        name: charType.name || "Audit Enemy",
        x: enemyX,
        y: 300,
        strength: this.enemyStrength,
        speed: this.enemySpeed,
        defense: this.enemyDefense,
        facing: -1,
        difficulty: this.difficulty,
        scale: scale,
        spriteConfig: charType.spriteConfig,
      });
    } else {
      enemy = new Enemy({
        name: charType.name || "Audit Enemy",
        x: enemyX,
        y: 400,
        characterType: charType.type || "warrior",
        strength: this.enemyStrength,
        speed: this.enemySpeed,
        defense: this.enemyDefense,
        facing: -1,
        difficulty: this.difficulty,
        aggressiveness: 0.5,
      });
    }

    // Override enemy HP
    enemy.health = this.enemyHP;
    enemy.maxHealth = this.enemyHP;

    this.currentEnemy = enemy;

    this.onAuditStart(this.currentAudit, this.totalAudits, charType.name);

    return { enemy, enemyEl };
  }

  /** Call when the current audit enemy has died */
  enemyDefeated() {
    this.onAuditEnd(this.currentAudit, this.totalAudits);

    if (this.currentAudit >= this.totalAudits) {
      this.active = false;
      this.onAllComplete();
      return null;
    }

    // Spawn next immediately
    return this.spawnNext();
  }

  /** Call when the player has died during audits */
  playerDied() {
    this.active = false;
    this.onPlayerDied();
    return null;
  }

  /** Check if there are more audits remaining */
  hasMore() {
    return this.currentAudit < this.totalAudits;
  }

  /** Get progress string e.g. "Audit 2/10" */
  getProgressText() {
    return `AUDIT ${this.currentAudit}/${this.totalAudits}`;
  }
}
