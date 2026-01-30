const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ------------------ Status ------------------
let running = true;
let score = 0;
let speed = 4;

// ------------------ Bilder ------------------
const bg = new Image();
bg.src = "assets/bg.png";

const runImgs = [new Image(), new Image()];
runImgs[0].src = "assets/player_run1.png";
runImgs[1].src = "assets/player_run2.png";

const jumpImg = new Image();
jumpImg.src = "assets/player_jump.png";

const obstacleImg = new Image();
obstacleImg.src = "assets/obstacle.png";

const collectImgs = [
{ img: new Image(), points: 50 },
{ img: new Image(), points: 25 },
{ img: new Image(), points: 15 }
];
collectImgs[0].img.src = "assets/collect1.png";
collectImgs[1].img.src = "assets/collect2.png";
collectImgs[2].img.src = "assets/collect3.png";

// ------------------ Hintergrund ------------------
let bgX = 0;

// ------------------ Spieler ------------------
const player = {
x: 100,
y: 320,
w: 96,
h: 72,
vy: 0,
gravity: 1.2,
jump: -18,
onGround: true
};

// Animation
let runFrame = 0;
let frameTimer = 0;

// ------------------ Objekte ------------------
let obstacles = [];
let collectibles = [];

// ------------------ Steuerung ------------------
document.addEventListener("keydown", e => {
if (e.code === "Space" && player.onGround) {
player.vy = player.jump;
player.onGround = false;
}
});

// ------------------ Game Loop ------------------
function loop() {
if (!running) return;

ctx.clearRect(0,0,canvas.width,canvas.height);

// Hintergrund
bgX -= speed;
if (bgX <= -canvas.width) bgX = 0;
ctx.drawImage(bg, bgX, 0, canvas.width, canvas.height);
ctx.drawImage(bg, bgX + canvas.width, 0, canvas.width, canvas.height);

// Spieler Physik
player.vy += player.gravity;
player.y += player.vy;

if (player.y >= 320) {
player.y = 320;
player.vy = 0;
player.onGround = true;
}

// Spieler zeichnen
if (!player.onGround) {
ctx.drawImage(jumpImg, player.x, player.y, player.w, player.h);
} else {
frameTimer++;
if (frameTimer > 8) {
runFrame = (runFrame + 1) % 2;
frameTimer = 0;
}
ctx.drawImage(runImgs[runFrame], player.x, player.y, player.w, player.h);
}

// Hindernisse
obstacles.forEach((o,i) => {
o.x -= speed;
ctx.drawImage(obstacleImg, o.x, o.y, o.w, o.h);

if (hit(player,o)) endGame();
if (o.x + o.w < 0) obstacles.splice(i,1);
});

// Bonusobjekte
collectibles.forEach((c,i) => {
c.x -= speed;
ctx.drawImage(c.img, c.x, c.y, 48, 48);

if (hit(player,c)) {
score += c.points;
collectibles.splice(i,1);
document.getElementById("score").innerText = "Punkte: " + score;
}
if (c.x < -50) collectibles.splice(i,1);
});

// Spawns
if (Math.random() < 0.02)
obstacles.push({ x: canvas.width, y: 300, w: 40, h: 80 });

if (Math.random() < 0.015) {
const t = collectImgs[Math.floor(Math.random()*3)];
collectibles.push({
x: canvas.width,
y: Math.random() < 0.5 ? 250 : 300,
img: t.img,
points: t.points,
w: 48,
h: 48
});
}

requestAnimationFrame(loop);
}

// ------------------ Helfer ------------------
function hit(a,b){
return a.x < b.x + b.w &&
a.x + a.w > b.x &&
a.y < b.y + b.h &&
a.y + a.h > b.y;
}

function endGame(){
running = false;
document.getElementById("gameover").classList.remove("hidden");
showScores();
}

// ------------------ Highscore ------------------
function saveScore(){
const name = document.getElementById("playerName").value || "Anonym";
const scores = JSON.parse(localStorage.getItem("scores")||"[]");
scores.push({name, score});
scores.sort((a,b)=>b.score-a.score);
localStorage.setItem("scores", JSON.stringify(scores.slice(0,10)));
showScores();
}

function showScores(){
const list = document.getElementById("highscores");
list.innerHTML = "";
JSON.parse(localStorage.getItem("scores")||"[]")
.forEach(s => {
const li = document.createElement("li");
li.innerText = `${s.name}: ${s.score}`;
list.appendChild(li);
});
}

function restart(){
location.reload();
}

// Start
loop();