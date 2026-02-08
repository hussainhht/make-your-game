export function addFighterStyles() {
  if (document.getElementById("fighter-styles")) return;

  const style = document.createElement("style");
  style.id = "fighter-styles";
  style.textContent = `
    .fighter {
      position: absolute;
      image-rendering: pixelated;
    }
    
    .fighter-body {
      width: 100%;
      height: 100%;
      position: relative;
      transition: filter 0.1s;
    }
    
    .fighter-body.warrior {
      background: linear-gradient(180deg, #00aaff 0%, #0066aa 50%, #003366 100%);
      border-radius: 10px 10px 5px 5px;
    }
    
    .fighter-body.ninja {
      background: linear-gradient(180deg, #9900ff 0%, #6600aa 50%, #330066 100%);
      border-radius: 10px 10px 5px 5px;
    }
    
    .fighter-body.enemy {
      background: linear-gradient(180deg, hsl(355, 79%, 48%) 0%, hsl(355, 79%, 35%) 50%, hsl(355, 79%, 22%) 100%);
      border-radius: 10px 10px 5px 5px;
    }
    
    .fighter-body.boss {
      background: linear-gradient(180deg, #990000 0%, #660000 50%, #330000 100%);
      border-radius: 10px 10px 5px 5px;
      box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
    }
    
    .fighter-body::before {
      content: '';
      position: absolute;
      top: 10%;
      left: 50%;
      transform: translateX(-50%);
      width: 50%;
      height: 25%;
      background: radial-gradient(ellipse, #ffcc99 0%, #cc9966 100%);
      border-radius: 50%;
    }
    
    .fighter-body.enemy::before {
      content: '';
      position: absolute;
      top: -80%;
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      height: 90%;
      background: url('assets/characters/hitler-bot-head.png') no-repeat center center;
      background-size: cover;
      border-radius: 0;
    }
    
    .fighter-body.enemy::after {
      content: '';
      position: absolute;
      top: 30%;
      left: 50%;
      transform: translateX(-50%);
      width: 60%;
      height: 40%;
      background: url('assets/characters/nazia.png') no-repeat center center;
      background-size: contain;
      border-radius: 0;
    }
    
    .fighter-body::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 10%;
      width: 80%;
      height: 30%;
      background: inherit;
      border-radius: 0 0 5px 5px;
    }
    
    .fighter-body.state-idle {
      animation: idle-bob 0.8s ease-in-out infinite;
    }
    
    .fighter-body.state-running {
      animation: run-bounce 0.2s ease-in-out infinite;
    }
    
    .fighter-body.state-attacking {
      animation: attack-punch 0.15s ease-out;
    }
    
    .fighter-body.state-hurt {
      animation: hurt-shake 0.15s ease-out;
      filter: brightness(2) saturate(0.5);
    }
    
    .fighter-body.state-blocking {
      transform: scaleX(0.9);
      filter: brightness(0.8);
    }
    
    .fighter-body.blocking::before {
      background: rgba(100, 200, 255, 0.5) !important;
    }
    
    .fighter-body.state-attacking::after {
      content: '💥';
      position: absolute;
      right: -40px;
      top: 50%;
      font-size: 2rem;
      animation: attack-effect 0.2s ease-out;
    }
    
    @keyframes idle-bob {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
    
    @keyframes run-bounce {
      0%, 100% { transform: translateY(0) scaleY(1); }
      50% { transform: translateY(-5px) scaleY(0.95); }
    }
    
    @keyframes attack-punch {
      0% { transform: translateX(0); }
      50% { transform: translateX(20px); }
      100% { transform: translateX(0); }
    }
    
    @keyframes hurt-shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }
    
    @keyframes attack-effect {
      0% { opacity: 0; transform: scale(0.5); }
      50% { opacity: 1; transform: scale(1.2); }
      100% { opacity: 0; transform: scale(1); }
    }
    
    .hit-flash {
      animation: flash 0.1s ease-out 3;
    }
    
    @keyframes flash {
      0%, 100% { filter: brightness(1); }
      50% { filter: brightness(3) saturate(0); }
    }
    
    .block-flash { 
      animation: blockFlash 0.15s ease-out;
    }
    @keyframes blockFlash {
      0% { filter: brightness(1) sepia(0); }
      50% { filter: brightness(1.5) sepia(0.5) hue-rotate(180deg); }
      100% { filter: brightness(1) sepia(0); }
    }
    
    .perfect-block-flash {
      animation: perfectBlockFlash 0.2s ease-out;
      box-shadow: 0 0 30px rgba(0, 255, 255, 0.8) !important;
    }
    @keyframes perfectBlockFlash {
      0% { filter: brightness(1); }
      30% { filter: brightness(2) saturate(2) hue-rotate(180deg); }
      100% { filter: brightness(1); }
    }
    
    .invincible {
      opacity: 0.7;
      filter: brightness(1.2);
    }

    .fighter-body.dummy {
      background: linear-gradient(180deg, #555 0%, #333 60%, #1a1a1a 100%);
      border-radius: 60px 60px 18px 18px;
      border: 2px solid #666;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.6);
    }
    .fighter-body.dummy::before {
      content: '';
      position: absolute;
      top: 12%;
      left: 50%;
      transform: translateX(-50%);
      width: 78%;
      height: 18%;
      background: repeating-linear-gradient(
        90deg,
        #ff9900,
        #ff9900 10px,
        #333 10px,
        #333 20px
      );
      border-radius: 10px;
      opacity: 0.9;
    }
    .fighter-body.dummy::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 18%;
      width: 64%;
      height: 16%;
      background: #333;
      border-radius: 0 0 18px 18px;
      opacity: 0.9;
    }
    
    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.5);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInScale {
      from {
        opacity: 0;
        transform: scale(0.5);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `;
  document.head.appendChild(style);
}
