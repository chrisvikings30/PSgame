const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ===============================
   GAME STATE
================================= */
let running = false;
let started = false;
let score = 0;
let frameCount = 0;

/* ===============================
   SPEED / FLOW
================================= */
let baseSpeed = 4;
let speed = baseSpeed;
const SPEED_STEP = 0.6;
const SPEED_SCORE_INTERVAL = 1500;
const MAX_SPEED = 9;
const JUMP_FORWARD_BOOST = 1.35;

/* ===============================
   GRAVITY / JUMP
================================= */
const GRAVITY_GROUND = 1.2;
const GRAVITY_AIR = 0.75;
const JUMP_CUT_MULTIPLIER = 0.4; // <- Sprung abbrechen beim Loslassen

/* ===============================
   WORLD
================================= */
const ROAD_Y = 380;
const UPPER_COLLECT_Y = 240;

/* ===============================
   PLAYER
================================= */
const player = {
    x: 120,
    y: 0,
    w: 192,
    h: 144,
    vy: 0,
    jumpPower: -26,
    onGround: true,
    isJumping: false
};

let runFrame = 0;
let runTick = 0;

/* ===============================
   OBJECTS
================================= */
let bgX = 0;
let obstacles = [];
let bonuses = [];
let lastObstacleFrame = 0;
const MIN_OBSTACLE_FRAMES = 130;

/* ===============================
   HIGHSCORE
================================= */
const SCORE_KEY = "psgame_highscores";

/* ===============================
   INPUT
================================= */
document.addEventListener("keydown", e => {
    if (!started) return;

    if ((e.code === "Space" || e.code === "ArrowUp") && player.onGround) {
        player.vy = player.jumpPower;
        player.onGround = false;
        player.isJumping = true;
    }
});

document.addEventListener("keyup", e => {
    if ((e.code === "Space" || e.code === "ArrowUp") && player.isJumping) {
        if (player.vy < 0) {
            player.vy *= JUMP_CUT_MULTIPLIER;
        }
        player.isJumping = false;
    }
});

canvas.addEventListener("touchstart", () => {
    if (!started || !player.onGround) return;
    player.vy = player.jumpPower;
    player.onGround = false;
    player.isJumping = true;
});

canvas.addEventListener("touchend", () => {
    if (player.isJumping && player.vy < 0) {
        player.vy *= JUMP_CUT_MULTIPLIER;
    }
    player.isJumping = false;
});

/* ===============================
   START SCREEN
================================= */
function drawStartScreen() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "24px Arial";
    ctx.fillText("PC: LEERTASTE = Springen", canvas.width / 2, 170);
    ctx.fillText("Handy: TIPPen / HALTEN = höher springen", canvas.width / 2, 205);
    ctx.fillText("📱 Handy quer halten", canvas.width / 2, 245);
    ctx.font = "26px Arial";
    ctx.fillText("▶ SPIEL STARTEN", canvas.width / 2, 320);

    canvas.addEventListener("click", startFromScreen, { once: true });
    canvas.addEventListener("touchstart", startFromScreen, { once: true });
}

function startFromScreen() {
    started = true;
    running = true;
    startGame();
}

/* ===============================
   GAME LOOP
================================= */
function gameLoop() {
    if (!running) return;
    frameCount++;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const level = Math.floor(score / SPEED_SCORE_INTERVAL);
    speed = Math.min(baseSpeed + level * SPEED_STEP, MAX_SPEED);
    const effectiveSpeed = player.onGround ? speed : speed * JUMP_FORWARD_BOOST;

    /* PHYSICS */
    player.vy += player.onGround ? GRAVITY_GROUND : GRAVITY_AIR;
    player.y += player.vy;

    const groundY = ROAD_Y - player.h;
    if (player.y >= groundY) {
        player.y = groundY;
        player.vy = 0;
        player.onGround = true;
        player.isJumping = false;
    }

    /* OBSTACLES */
    obstacles.forEach((o, i) => {
        o.x -= effectiveSpeed;
        if (collide(player, o)) endGame();
        if (o.x + o.w < 0) obstacles.splice(i, 1);
    });

    /* SCORE */
    score++;
    updateScore();

    /* SPAWNS */
    if (
        frameCount > 120 &&
        frameCount - lastObstacleFrame > MIN_OBSTACLE_FRAMES &&
        Math.random() < 0.035
    ) {
        obstacles.push({
            x: canvas.width + 40,
            y: ROAD_Y - 160 + 12,
            w: 80,
            h: 160
        });
        lastObstacleFrame = frameCount;
    }

    requestAnimationFrame(gameLoop);
}

/* ===============================
   HIGHSCORE LOGIC
================================= */
function saveHighscore(name) {
    const scores = JSON.parse(localStorage.getItem(SCORE_KEY)) || [];
    scores.push({ name, score });
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem(SCORE_KEY, JSON.stringify(scores.slice(0, 10)));
}

function loadHighscores() {
    return JSON.parse(localStorage.getItem(SCORE_KEY)) || [];
}

/* ===============================
   HELPERS
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
    const name = document.getElementById("playerName")?.value || "Anonym";
    saveHighscore(name);
    document.getElementById("gameover").style.display = "flex";
}

function startGame() {
    score = 0;
    frameCount = 0;
    obstacles = [];
    player.y = ROAD_Y - player.h;
    updateScore();
    gameLoop();
}

function restart() {
    location.reload();
}

/* ===============================
   INIT
================================= */
drawStartScreen();
