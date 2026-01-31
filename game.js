const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ===============================
STATUS
================================= */
let running = true;
let score = 0;
let speed = 4;
let frameCount = 0;

/* ===============================
SPEED-LOGIK
================================= */
const SPEED_STEP = 0.5;
const SPEED_SCORE_INTERVAL = 1500;
const MAX_SPEED = 8;

/* ===============================
IMAGE LOADER
================================= */
const images = {};
const imageFiles = {
bg: "assets/bg.png",
run1: "assets/player_run1.png",
run2: "assets/player_run2.png",
jump: "assets/player_jump.png",
obstacle: "assets/obstacle.png",
collect1: "assets/collect1.png",
collect2: "assets/collect2.png",
collect3: "assets/collect3.png"
};

let imagesLoaded = 0;
const totalImages = Object.keys(imageFiles).length;

for (const key in imageFiles) {
const img = new Image();
img.src = imageFiles[key];
img.onload = () => {
imagesLoaded++;
if (imagesLoaded === totalImages) startGame();
};
images[key] = img;
}

/* ===============================
EBENEN
================================= */
const GROUND_Y = 320;
const UPPER_Y = 260;

/* ===============================
SPIELER
================================= */
const player = {
x: 100,
y: GROUND_Y,
w: 96,
h: 72,
vy: 0,
gravity: 1.2,
jumpPower: -18,
onGround: true
};

let runFrame = 0;
let runTick = 0;

/* ===============================
OBJEKTE
================================= */
let bgX = 0;
let obstacles = [];
let bonuses = [];

let lastObstacleX = 0;
const MIN_OBSTACLE_DISTANCE = 260;

/* ===============================
STEUERUNG
================================= */
document.addEventListener("keydown", e => {
if ((e.code === "Space" || e.code === "ArrowUp") && player.onGround) {
player.vy = player.jumpPower;
player.onGround = false;
}
});

canvas.addEventListener("touchstart", () => {
if (player.onGround) {
player.vy = player.jumpPower;
player.onGround = false;
}
});

/* ===============================
GAME LOOP
================================= */
function gameLoop() {
if (!running) return;

frameCount++;
ctx.clearRect(0, 0, canvas.width, canvas.height);

/* ---------- SPEED ERHÖHEN ---------- */
const speedLevel = Math.floor(score / SPEED_SCORE_INTERVAL);
speed = Math.min(4 + speedLevel * SPEED_STEP, MAX_SPEED);

/* ---------- HINTERGRUND ---------- */
bgX -= speed;
if (bgX <= -canvas.width) bgX = 0;
ctx.drawImage(images.bg, bgX, 0, canvas.width, canvas.height);
ctx.drawImage(images.bg, bgX + canvas.width, 0, canvas.width, canvas.height);

/* ---------- SPIELER PHYSIK ---------- */
player.vy += player.gravity;
player.y += player.vy;

if (player.y >= GROUND_Y) {
player.y = GROUND_Y;
player.vy = 0;
player.onGround = true;
}

/* ---------- SPIELER ZEICHNEN ---------- */
if (!player.onGround) {
ctx.drawImage(images.jump, player.x, player.y, player.w, player.h);
} else {
runTick++;
if (runTick > 8) {
runFrame = (runFrame + 1) % 2;
runTick = 0;
}
ctx.drawImage(
runFrame === 0 ? images.run1 : images.run2,
player.x, player.y, player.w, player.h
);
}

/* ---------- HINDERNISSE ---------- */
obstacles.forEach((o, i) => {
o.x -= speed;
ctx.drawImage(images.obstacle, o.x, o.y, o.w, o.h);

if (collide(player, o)) endGame();
if (o.x + o.w < 0) obstacles.splice(i, 1);
});

/* ---------- BONUS ---------- */
bonuses.forEach((b, i) => {
b.x -= speed;
ctx.drawImage(b.img, b.x, b.y, b.w, b.h);

if (collide(player, b)) {
score += b.points;
bonuses.splice(i, 1);
updateScore();
}

if (b.x + b.w < 0) bonuses.splice(i, 1);
});

/* ---------- HINDERNIS-SPAWN ---------- */
if (frameCount > 90 && Math.random() < 0.02) {
const spawnX = canvas.width;
if (spawnX - lastObstacleX > MIN_OBSTACLE_DISTANCE) {
const levelY = Math.random() < 0.5 ? GROUND_Y - 80 : UPPER_Y;
obstacles.push({
x: spawnX,
y: levelY,
w: 40,
h: 80
});
lastObstacleX = spawnX;
}
}

/* ---------- BONUS-SPAWN ---------- */
if (frameCount > 90 && Math.random() < 0.015) {
const types = [
{ img: images.collect1, points: 50 },
{ img: images.collect2, points: 25 },
{ img: images.collect3, points: 15 }
];
const t = types[Math.floor(Math.random() * types.length)];
bonuses.push({
x: canvas.width,
y: Math.random() < 0.5 ? UPPER_Y : GROUND_Y,
w: 48,
h: 48,
img: t.img,
points: t.points
});
}

requestAnimationFrame(gameLoop);
}

/* ===============================
HELFER
================================= */
function collide(a, b) {
return (
a.x < b.x + b.w &&
a.x + a.w > b.x &&
a.y < b.y + b.h &&
a.y + a.h > b.y
);
}

function updateScore() {
document.getElementById("score").innerText = "Punkte: " + score;
}

function endGame() {
running = false;
document.getElementById("gameover").style.display = "flex";
showScores();
}

function startGame() {
document.getElementById("gameover").style.display = "none";
updateScore();
gameLoop();
}

/* ===============================
HIGHSCORE
================================= */
function saveScore() {
const name = document.getElementById("playerName").value || "Anonym";
const scores = JSON.parse(localStorage.getItem("scores") || "[]");
scores.push({ name, score });
scores.sort((a, b) => b.score - a.score);
localStorage.setItem("scores", JSON.stringify(scores.slice(0, 10)));
showScores();
}

function showScores() {
const list = document.getElementById("highscores");
list.innerHTML = "";
JSON.parse(localStorage.getItem("scores") || "[]").forEach(s => {
const li = document.createElement("li");
li.textContent = `${s.name}: ${s.score}`;
list.appendChild(li);
});
}

function restart() {
location.reload();
}
