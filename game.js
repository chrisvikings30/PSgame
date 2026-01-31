const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ===============================
GRUNDSTATUS (wie Feuerwehr-Spiel)
================================= */
let running = true;
let score = 0;
let speed = 4;
let frameCount = 0;

/* ===============================
BILDER
================================= */
const bgImg = new Image();
bgImg.src = "assets/bg.png";

const runImgs = [new Image(), new Image()];
runImgs[0].src = "assets/player_run1.png";
runImgs[1].src = "assets/player_run2.png";

const jumpImg = new Image();
jumpImg.src = "assets/player_jump.png";

const obstacleImg = new Image();
obstacleImg.src = "assets/obstacle.png";

const bonusTypes = [
{ img: new Image(), points: 50 }, // Schlagring
{ img: new Image(), points: 25 }, // Bier
{ img: new Image(), points: 15 } // Reifen
];
bonusTypes[0].img.src = "assets/collect1.png";
bonusTypes[1].img.src = "assets/collect2.png";
bonusTypes[2].img.src = "assets/collect3.png";

/* ===============================
HINTERGRUND
================================= */
let bgX = 0;

/* ===============================
SPIELER (Referenz-Physik)
================================= */
const GROUND_Y = 320;

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

// Animation
let runFrame = 0;
let runTick = 0;

/* ===============================
OBJEKTE
================================= */
let obstacles = [];
let bonuses = [];

/* ===============================
STEUERUNG
================================= */
document.addEventListener("keydown", e => {
if ((e.code === "Space" || e.code === "ArrowUp") && player.onGround) {
player.vy = player.jumpPower;
player.onGround = false;
}
});

// Touch (Mobile)
canvas.addEventListener("touchstart", () => {
if (player.onGround) {
player.vy = player.jumpPower;
player.onGround = false;
}
});

/* ===============================
GAME LOOP (wie Referenz)
================================= */
function gameLoop() {
if (!running) return;

frameCount++;

ctx.clearRect(0, 0, canvas.width, canvas.height);

/* ---------- Hintergrund ---------- */
bgX -= speed;
if (bgX <= -canvas.width) bgX = 0;
ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);

/* ---------- Spieler Physik ---------- */
player.vy += player.gravity;
player.y += player.vy;

if (player.y >= GROUND_Y) {
player.y = GROUND_Y;
player.vy = 0;
player.onGround = true;
}

/* ---------- Spieler zeichnen ---------- */
if (!player.onGround) {
ctx.drawImage(jumpImg, player.x, player.y, player.w, player.h);
} else {
runTick++;
if (runTick > 8) {
runFrame = (runFrame + 1) % 2;
runTick = 0;
}
ctx.drawImage(runImgs[runFrame], player.x, player.y, player.w, player.h);
}

/* ---------- Hindernisse ---------- */
obstacles.forEach((o, i) => {
o.x -= speed;
ctx.drawImage(obstacleImg, o.x, o.y, o.w, o.h);

if (collide(player, o)) {
endGame();
}

if (o.x + o.w < 0) {
obstacles.splice(i, 1);
}
});

/* ---------- Bonusobjekte ---------- */
bonuses.forEach((b, i) => {
b.x -= speed;
ctx.drawImage(b.img, b.x, b.y, b.w, b.h);

if (collide(player, b)) {
score += b.points;
bonuses.splice(i, 1);
updateScore();
}

if (b.x + b.w < 0) {
bonuses.splice(i, 1);
}
});

/* ---------- Spawns (wie Feuerwehr-Spiel) ---------- */
// Erst nach kurzer Einlaufzeit
if (frameCount > 90 && Math.random() < 0.02) {
obstacles.push({
x: canvas.width,
y: GROUND_Y - 80,
w: 40,
h: 80
});
}

if (frameCount > 90 && Math.random() < 0.015) {
const t = bonusTypes[Math.floor(Math.random() * bonusTypes.length)];
bonuses.push({
x: canvas.width,
y: Math.random() < 0.5 ? GROUND_Y - 70 : GROUND_Y,
w: 48,
h: 48,
img: t.img,
points: t.points
});
}

requestAnimationFrame(gameLoop);
}

/* ===============================
HILFSFUNKTIONEN
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
document.getElementById("gameover").classList.remove("hidden");
showScores();
}

/* ===============================
HIGHSCORE (wie Referenz)
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
const scores = JSON.parse(localStorage.getItem("scores") || "[]");
scores.forEach(s => {
const li = document.createElement("li");
li.textContent = `${s.name}: ${s.score}`;
list.appendChild(li);
});
}

function restart() {
location.reload();
}

/* ===============================
START (wichtig!)
================================= */
document.getElementById("gameover").classList.add("hidden");
updateScore();
gameLoop();
