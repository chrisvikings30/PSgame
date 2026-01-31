const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ======================
   GAME STATE
====================== */
let running = false;
let started = false;
let score = 0;
let frame = 0;

/* ======================
   SPEED / JUMP
====================== */
let speed = 4;
const SPEED_STEP = 0.6;
const SPEED_INTERVAL = 1500;
const MAX_SPEED = 9;

const JUMP_FORWARD_BOOST = 1.55; // MEHR WEITE IN DER LUFT

/* ======================
   PHYSICS
====================== */
const GRAVITY_GROUND = 1.2;
const GRAVITY_AIR = 0.8;
const JUMP_CUT = 0.4;

/* ======================
   WORLD
====================== */
const ROAD_Y = 380;

/* ======================
   PLAYER
====================== */
const player = {
  x: 120,
  y: 0,
  w: 192,
  h: 144,
  vy: 0,
  jumpPower: -26,
  onGround: true,
  jumping: false
};

/* ======================
   ASSETS
====================== */
const images = {};
const assets = {
  bg: "assets/bg.png",
  run1: "assets/player_run1.png",
  run2: "assets/player_run2.png",
  jump: "assets/player_jump.png",
  obstacle: "assets/obstacle.png"
};

let loaded = 0;
Object.keys(assets).forEach(k => {
  images[k] = new Image();
  images[k].src = assets[k];
  images[k].onload = () => {
    loaded++;
    if (loaded === Object.keys(assets).length) drawStartScreen();
  };
});

/* ======================
   OBJECTS
====================== */
let bgX = 0;
let obstacles = [];
let lastObstacle = 0;

/* ======================
   INPUT
====================== */
document.addEventListener("keydown", e => {
  if (!started) return;
  if ((e.code === "Space" || e.code === "ArrowUp") && player.onGround) {
    player.vy = player.jumpPower;
    player.onGround = false;
    player.jumping = true;
  }
});

document.addEventListener("keyup", e => {
  if ((e.code === "Space" || e.code === "ArrowUp") && player.jumping) {
    if (player.vy < 0) player.vy *= JUMP_CUT;
    player.jumping = false;
  }
});

canvas.addEventListener("touchstart", () => {
  if (!started || !player.onGround) return;
  player.vy = player.jumpPower;
  player.onGround = false;
  player.jumping = true;
});

canvas.addEventListener("touchend", () => {
  if (player.jumping && player.vy < 0) player.vy *= JUMP_CUT;
  player.jumping = false;
});

/* ======================
   START SCREEN
====================== */
function drawStartScreen() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = "22px Arial";
  ctx.fillText("PC: Leertaste = Springen", 450, 180);
  ctx.fillText("Handy: Tippen / Halten", 450, 210);
  ctx.fillText("📱 Handy quer halten", 450, 250);
  ctx.font = "26px Arial";
  ctx.fillText("▶ SPIEL STARTEN", 450, 320);

  canvas.onclick = startGame;
}

/* ======================
   GAME LOOP
====================== */
function loop() {
  if (!running) return;
  frame++;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const level = Math.floor(score / SPEED_INTERVAL);
  speed = Math.min(4 + level * SPEED_STEP, MAX_SPEED);
  const effSpeed = player.onGround ? speed : speed * JUMP_FORWARD_BOOST;

  // Background
  bgX -= effSpeed;
  if (bgX <= -canvas.width) bgX = 0;
  ctx.drawImage(images.bg, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(images.bg, bgX + canvas.width, 0, canvas.width, canvas.height);

  // Player physics
  player.vy += player.onGround ? GRAVITY_GROUND : GRAVITY_AIR;
  player.y += player.vy;

  const ground = ROAD_Y - player.h;
  if (player.y >= ground) {
    player.y = ground;
    player.vy = 0;
    player.onGround = true;
  }

  // Player draw
  const img = player.onGround
    ? (frame % 20 < 10 ? images.run1 : images.run2)
    : images.jump;
  ctx.drawImage(img, player.x, player.y, player.w, player.h);

  // Obstacles
  obstacles.forEach((o, i) => {
    o.x -= effSpeed;
    ctx.drawImage(images.obstacle, o.x, o.y, o.w, o.h);

    if (collidePlayerObstacle(player, o)) endGame();
    if (o.x + o.w < 0) obstacles.splice(i, 1);
  });

  // Spawn obstacle
  if (frame - lastObstacle > 140 && Math.random() < 0.03) {
    obstacles.push({
      x: canvas.width,
      y: ROAD_Y - 160,
      w: 80,
      h: 160
    });
    lastObstacle = frame;
  }

  score++;
  document.getElementById("score").innerText = "Punkte: " + score;

  requestAnimationFrame(loop);
}

/* ======================
   FAIR HITBOX
====================== */
function collidePlayerObstacle(p, o) {
  const hitbox = {
    x: o.x + 14,
    y: o.y + 18,
    w: o.w - 28,
    h: o.h - 30
  };

  return (
    p.x < hitbox.x + hitbox.w &&
    p.x + p.w > hitbox.x &&
    p.y < hitbox.y + hitbox.h &&
    p.y + p.h > hitbox.y
  );
}

/* ======================
   GAME FLOW
====================== */
function startGame() {
  started = true;
  running = true;
  score = 0;
  obstacles = [];
  player.y = ROAD_Y - player.h;
  loop();
}

function endGame() {
  running = false;
  document.getElementById("gameover").style.display = "flex";
}

function restart() {
  location.reload();
}
