// Character Selection System
class CharacterSelect {
  constructor() {
    this.selectedCharacter = null;
    this.selectedMode = null;
    this.selectedMap = "random";
    this.characterSlots = document.querySelectorAll(".character-slot");
    this.modeOptions = document.querySelectorAll(".mode-option");
    this.startButton = document.getElementById("start-game");
    this.mapSelection = document.getElementById("map-selection");
    this.mapOptions = document.querySelectorAll(".map-option");
    this.previewImg = document.getElementById("preview-img");
    this.characterTitle = document.getElementById("character-title");
    this.placeholderText = document.querySelector(".placeholder-text");

    this.statStrength = document.getElementById("stat-strength");
    this.statSpeed = document.getElementById("stat-speed");
    this.statDefense = document.getElementById("stat-defense");

    this.init();
  }

  init() {
    this.characterSlots.forEach((slot) => {
      slot.addEventListener("click", () => this.selectCharacter(slot));
    });

    this.modeOptions.forEach((option) => {
      option.addEventListener("click", () => this.selectMode(option));
    });

    this.mapOptions.forEach((option) => {
      option.addEventListener("click", () => this.selectMap(option));
    });

    this.startButton.addEventListener("click", () => this.startGame());

    this.addHoverEffects();
  }

  selectCharacter(slot) {
    const characterId = slot.getAttribute("data-character");

    if (slot.querySelector(".slot-locked")) {
      this.showLockedMessage();
      return;
    }

    this.characterSlots.forEach((s) => s.classList.remove("selected"));

    slot.classList.add("selected");
    this.selectedCharacter = characterId;

    this.updatePreview(slot);

    this.updateStartButton();
  }

  selectMode(option) {
    const mode = option.getAttribute("data-mode");

    this.modeOptions.forEach((m) => m.classList.remove("selected"));

    option.classList.add("selected");
    this.selectedMode = mode;

    if (mode === "arcade" || mode === "training") {
      this.mapSelection.style.display = "block";
    } else {
      this.mapSelection.style.display = "none";
    }

    this.updateStartButton();
  }

  selectMap(option) {
    const map = option.getAttribute("data-map");

    this.mapOptions.forEach((m) => m.classList.remove("selected"));

    option.classList.add("selected");
    this.selectedMap = map;
  }

  updatePreview(slot) {
    const characterId = slot.getAttribute("data-character");
    const characterName =
      slot.getAttribute("data-name") || `CHARACTER ${characterId}`;
    const characterImg = slot.querySelector("img");

    this.characterTitle.textContent = characterName.toUpperCase();

    if (characterImg) {
      this.previewImg.src = characterImg.src;
      this.previewImg.style.display = "block";
      this.placeholderText.style.display = "none";
    } else {
      this.previewImg.style.display = "none";
      this.placeholderText.style.display = "block";
      this.placeholderText.textContent = characterId;
    }

    const strength =
      parseInt(slot.getAttribute("data-strength")) ||
      Math.floor(Math.random() * 50) + 50;
    const speed =
      parseInt(slot.getAttribute("data-speed")) ||
      Math.floor(Math.random() * 50) + 50;
    const defense =
      parseInt(slot.getAttribute("data-defense")) ||
      Math.floor(Math.random() * 50) + 50;

    this.animateStat(this.statStrength, strength);
    this.animateStat(this.statSpeed, speed);
    this.animateStat(this.statDefense, defense);
  }
  animateStat(element, value) {
    setTimeout(() => {
      element.style.width = value + "%";
    }, 100);
  }

  updateStartButton() {
    if (this.selectedCharacter && this.selectedMode) {
      this.startButton.disabled = false;
      this.startButton.querySelector(".button-subtitle").textContent =
        "PRESS TO BEGIN";
    } else {
      this.startButton.disabled = true;
      this.startButton.querySelector(".button-subtitle").textContent =
        "(Select character and mode)";
    }
  }

  showLockedMessage() {
    const message = document.createElement("div");
    message.textContent = "CHARACTER LOCKED - COMING SOON!";
    message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 1.5rem;
            letter-spacing: 2px;
            border: 3px solid #ff6666;
            box-shadow: 0 0 30px rgba(255, 0, 0, 0.8);
            z-index: 1000;
            animation: pulse 0.5s ease-in-out;
        `;

    document.body.appendChild(message);

    setTimeout(() => {
      message.remove();
    }, 2000);
  }

  addHoverEffects() {
    this.characterSlots.forEach((slot) => {
      slot.addEventListener("mouseenter", () => {
        if (!slot.querySelector(".slot-locked")) {
        }
      });
    });

    const hoverSound = new Audio("./assets/audio/rollover1.mp3");
    this.modeOptions.forEach((option) => {
      option.addEventListener("mouseenter", () => {
        hoverSound.currentTime = 0;
        hoverSound.play();
      });
    });
  }

  startGame() {
    if (!this.selectedCharacter || !this.selectedMode) return;

    const difficulty = document.getElementById("difficulty").value;
    const rounds = document.getElementById("rounds").value;

    const selectedSlot = document.querySelector(
      `.character-slot[data-character="${this.selectedCharacter}"]`,
    );

    const characterData = {
      id: this.selectedCharacter,
      name:
        selectedSlot.getAttribute("data-name") ||
        `Character ${this.selectedCharacter}`,
      strength: selectedSlot.getAttribute("data-strength") || 70,
      speed: selectedSlot.getAttribute("data-speed") || 70,
      defense: selectedSlot.getAttribute("data-defense") || 70,
      image: selectedSlot.querySelector("img")?.src || "",
    };

    const gameConfig = {
      character: characterData,
      mode: this.selectedMode,
      difficulty: difficulty,
      rounds: rounds,
      map: this.selectedMap,
      timestamp: Date.now(),
    };

    sessionStorage.setItem("gameConfig", JSON.stringify(gameConfig));

    console.log("Starting game with:", gameConfig);

    const loadingMessage = document.createElement("div");
    loadingMessage.textContent = "LOADING...";
    loadingMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 153, 0, 0.9);
            color: black;
            padding: 30px 60px;
            border-radius: 10px;
            font-size: 2rem;
            letter-spacing: 3px;
            border: 3px solid #ffcc00;
            box-shadow: 0 0 30px rgba(255, 153, 0, 0.8);
            z-index: 1000;
            font-weight: bold;
        `;

    document.body.appendChild(loadingMessage);

    setTimeout(() => {
      if (this.selectedMode === "arcade") {
        window.location.href = "arcade.html";
      } else if (this.selectedMode === "story") {
        window.location.href = "story.html";
      } else if (this.selectedMode === "tower") {
        window.location.href = "tower.html";
      } else if (this.selectedMode === "training") {
        gameConfig.difficulty = "easy";
        gameConfig.mode = "training";
        sessionStorage.setItem("gameConfig", JSON.stringify(gameConfig));
        window.location.href = "arcade.html";
      } else if (this.selectedMode === "versus") {
        loadingMessage.textContent = "VERSUS MODE COMING SOON!";
        setTimeout(() => {
          loadingMessage.remove();
        }, 2000);
      } else {
        loadingMessage.textContent = `${this.selectedMode.toUpperCase()} MODE COMING SOON!`;
        setTimeout(() => {
          loadingMessage.remove();
        }, 2000);
      }
    }, 1000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new CharacterSelect();

  const style = document.createElement("style");
  style.textContent = `
        @keyframes pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.05); }
        }
    `;
  document.head.appendChild(style);
});
