const canvas = document.getElementById("game");
canvas.width = 900;
canvas.height = 450;
const ctx = canvas.getContext("2d");

/* ======================
   MOBILE FULLSCREEN
====================== */
let fullscreenAllowed = false;

function tryFullscreen() {
  if (!fullscreenAllowed) return;
  if (window.innerWidth > window.innerHeight) {
    if (!document.fullscreenElement) {
      canvas.requestFullscreen?.().catch(() => {});
    }
  }
}

window.addEventListener("orientationchange", () => {
  setTimeout(tryFullscreen, 300);
});
window.addEventListener("resize", tryFullscreen);

/* ======================
   GAME STATE
====================== */
let running = false;
let started = false;
let score = 0;
let frame = 0;

/* ======================
   SPEED / DIFFICULTY
====================== */
const BASE_SPEED = 4;
const SPEED_STEP = 0.6;
const SPEED_INTERVAL = 1500;
const MAX_SPEED = 9;

/* ======================
   PHYSICS
====================== */
const GRAVITY_GROUND = 1.2;
const GRAVITY_AIR = 0.45;

/* ======================
   WORLD
====================== */
const ROAD_Y = 380;
const UPPER_COLLECT_Y = 160;

/* ======================
   PLAYER
====================== */
const player = {
  x: 120,
  y: 0,
  w: 192,
  h: 144,
  vy: 0,
  jumpPower: -20,
  onGround: true
};

/* ======================
   ASSETS (IMAGES)
====================== */
const images = {};
const assets = {
  bg: "assets/bg.png",
  run1: "assets/player_run1.png",
  run2: "assets/player_run2.png",
  jump: "assets/player_jump.png",
  obstacle: "assets/obstacle.png",
  collect1: "assets/collect1.png",
  collect2: "assets/collect2.png",
  collect3: "assets/collect3.png"
};

/* ======================
   MUSIC (MOBILE SAFE)
====================== */
const music = new Audio("assets/music.mp3");
music.loop = true;
music.volume = 0.5;
music.preload = "auto";
let musicUnlocked = false;

/* ======================
   LOAD IMAGES
====================== */
let loaded = 0;
Object.keys(assets).forEach(key => {
  images[key] = new Image();
  images[key].src = assets[key];
  images[key].onload = () => {
    loaded++;
    if (loaded === Object.keys(assets).length) drawStartScreen();
  };
});

/* ======================
   OBJECTS
====================== */
let bgX = 0;
let obstacles = [];
let collectibles = [];
let lastObstacle = 0;
let lastCollectible = 0;

/* ======================
   INPUT: KEYBOARD
====================== */
document.addEventListener("keydown", e => {
  if (!started) return;
  if ((e.code === "Space" || e.code === "ArrowUp") && player.onGround) {
    player.vy = player.jumpPower;
    player.onGround = false;
  }
});

/* ======================
   INPUT: TOUCH (START + JUMP)
====================== */
canvas.addEventListener(
  "touchstart",
  e => {
    e.preventDefault();

    // Musik entsperren (iOS)
    if (!musicUnlocked) {
      music.play().then(() => {
        music.pause();
        music.currentTime = 0;
        musicUnlocked = true;
      }).catch(() => {});
    }

    // Spielstart
    if (!started) {
      fullscreenAllowed = true;
      startGame();
      tryFullscreen();
      return;
    }

    // Springen
    if (player.onGround) {
      player.vy = player.jumpPower;
      player.onGround = false;
    }
  },
  { passive: false }
);

/* ======================
   START SCREEN
====================== */
function drawStartScreen() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = "22px Arial";
  ctx.fillText("PC: Leertaste = Springen", 450, 170);
  ctx.fillText("Handy: Tippen = Springen", 450, 200);
  ctx.fillText("📱 Handy QUER drehen für Fullscreen", 450, 240);

  ctx.font = "26px Arial";
  ctx.fillText("▶ SPIEL STARTEN", 450, 310);

  canvas.onclick = () => {
    fullscreenAllowed = true;
    startGame();
    tryFullscreen();
  };
}

/* ======================
   GAME LOOP
====================== */
function loop() {
  if (!running) return;
  frame++;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const level = Math.floor(score / SPEED_INTERVAL);
  const speed = Math.min(BASE_SPEED + level * SPEED_STEP, MAX_SPEED);

  /* Background */
  bgX -= speed;
  if (bgX <= -canvas.width) bgX = 0;
  ctx.drawImage(images.bg, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(images.bg, bgX + canvas.width, 0, canvas.width, canvas.height);

  /* Player physics */
  player.vy += player.onGround ? GRAVITY_GROUND : GRAVITY_AIR;
  player.y += player.vy;

  const ground = ROAD_Y - player.h;
  if (player.y >= ground) {
    player.y = ground;
    player.vy = 0;
    player.onGround = true;
  }

  /* Player draw */
  const sprite = player.onGround
    ? frame % 20 < 10 ? images.run1 : images.run2
    : images.jump;

  ctx.drawImage(sprite, player.x, player.y, player.w, player.h);

  /* Obstacles */
  obstacles.forEach((o, i) => {
    o.x -= speed;
    ctx.drawImage(images.obstacle, o.x, o.y, o.w, o.h);
    if (collideObstacle(player, o)) endGame();
    if (o.x + o.w < 0) obstacles.splice(i, 1);
  });

  /* Collectibles */
  collectibles.forEach((c, i) => {
    c.x -= speed;
    ctx.drawImage(c.img, c.x, c.y, c.w, c.h);
    if (collide(player, c)) {
      score += 100;
      collectibles.splice(i, 1);
    }
    if (c.x + c.w < 0) collectibles.splice(i, 1);
  });

  /* Spawns */
  if (frame - lastObstacle > 140 && Math.random() < 0.03) {
    obstacles.push({
      x: canvas.width,
      y: ROAD_Y - 160,
      w: 80,
      h: 160
    });
    lastObstacle = frame;
  }

  if (
    frame - lastCollectible > 260 &&
    collectibles.length < 2 &&
    Math.random() < 0.03
  ) {
    collectibles.push({
      x: canvas.width + 40,
      y: Math.random() < 0.5 ? ROAD_Y - 90 : UPPER_COLLECT_Y,
      w: 64,
      h: 64,
      img: images[
        ["collect1", "collect2", "collect3"][Math.floor(Math.random() * 3)]
      ]
    });
    lastCollectible = frame;
  }

  score++;
  document.getElementById("score").innerText = "Punkte: " + score;

  requestAnimationFrame(loop);
}

/* ======================
   COLLISION
====================== */
function collide(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function collideObstacle(p, o) {
  return collide(p, {
    x: o.x + 24,
    y: o.y + 35,
    w: o.w - 48,
    h: o.h - 60
  });
}

/* ======================
   GAME FLOW
====================== */
function startGame() {
  if (started) return;
  started = true;
  running = true;

  canvas.onclick = null;

  score = 0;
  frame = 0;
  obstacles = [];
  collectibles = [];
  player.y = ROAD_Y - player.h;

  music.currentTime = 0;
  music.play().catch(() => {});

  loop();
}

function endGame() {
  running = false;
  music.pause();
  document.getElementById("gameover").style.display = "flex";
}

function restart() {
  location.reload();
}
