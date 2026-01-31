const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let running = true;
let score = 0;
let frameCount = 0;

/* ===============================
   SPEED
================================= */
let baseSpeed = 4;
let speed = baseSpeed;
const SPEED_STEP = 0.6;
const SPEED_SCORE_INTERVAL = 1500;
const MAX_SPEED = 9;

/* ===============================
   BILDER
================================= */
const images = {};
const files = {
    bg: "assets/bg.png",
    run1: "assets/player_run1.png",
    run2: "assets/player_run2.png",
    jump: "assets/player_jump.png",
    obstacle: "assets/obstacle.png",
    collect1: "assets/collect1.png",
    collect2: "assets/collect2.png",
    collect3: "assets/collect3.png"
};

let loaded = 0;
for (const k in files) {
    images[k] = new Image();
    images[k].src = files[k];
    images[k].onload = () => {
        loaded++;
        if (loaded === Object.keys(files).length) startGame();
    };
}

/* ===============================
   STRASSE & EBENEN
================================= */
const ROAD_Y = 380;
const UPPER_OFFSET = 120;

/* ===============================
   SPIELER (2×)
================================= */
const player = {
    x: 120,
    y: 0,
    w: 192,
    h: 144,
    vy: 0,
    gravity: 1.4,
    jumpPower: -22,
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
let lastObstacleFrame = 0;
const MIN_OBSTACLE_FRAMES = 130;

/* ===============================
   INPUT
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
   LOOP
================================= */
function gameLoop() {
    if (!running) return;
    frameCount++;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const level = Math.floor(score / SPEED_SCORE_INTERVAL);
    speed = Math.min(baseSpeed + level * SPEED_STEP, MAX_SPEED);

    bgX -= speed;
    if (bgX <= -canvas.width) bgX = 0;
    draw(images.bg, bgX, 0, canvas.width, canvas.height);
    draw(images.bg, bgX + canvas.width, 0, canvas.width, canvas.height);

    /* PLAYER */
    player.vy += player.gravity;
    player.y += player.vy;

    const groundY = ROAD_Y - player.h;
    if (player.y >= groundY) {
        player.y = groundY;
        player.vy = 0;
        player.onGround = true;
    }

    if (!player.onGround) {
        draw(images.jump, player.x, player.y, player.w, player.h);
    } else {
        runTick++;
        if (runTick > 7) {
            runFrame = (runFrame + 1) % 2;
            runTick = 0;
        }
        draw(runFrame === 0 ? images.run1 : images.run2,
             player.x, player.y, player.w, player.h);
    }

    /* OBSTACLES */
    obstacles.forEach((o, i) => {
        o.x -= speed;
        draw(images.obstacle, o.x, o.y, o.w, o.h);

        if (collide(player, o)) {
            if (o.level === "ground") endGame();
            if (o.level === "upper" && !player.onGround) endGame();
        }
        if (o.x + o.w < 0) obstacles.splice(i, 1);
    });

    /* BONUSES (HALBIERT) */
    bonuses.forEach((b, i) => {
        b.x -= speed;
        draw(b.img, b.x, b.y, b.w, b.h);

        if (collide(player, b)) {
            score += b.points;
            bonuses.splice(i, 1);
            updateScore();
        }
        if (b.x + b.w < 0) bonuses.splice(i, 1);
    });

    /* OBSTACLE SPAWN */
    if (
        frameCount > 120 &&
        frameCount - lastObstacleFrame > MIN_OBSTACLE_FRAMES &&
        Math.random() < 0.035
    ) {
        const isUpper = Math.random() < 0.5;
        const h = 160;

        obstacles.push({
            x: canvas.width + 40,
            y: isUpper
                ? ROAD_Y - h - UPPER_OFFSET
                : ROAD_Y - h,
            w: 80,
            h,
            level: isUpper ? "upper" : "ground"
        });

        lastObstacleFrame = frameCount;
    }

    /* BONUS SPAWN – REDUZIERT */
    if (
        frameCount > 200 &&
        bonuses.length === 0 &&
        Math.random() < 0.01
    ) {
        const types = [
            { img: images.collect1, points: 50 },
            { img: images.collect2, points: 25 },
            { img: images.collect3, points: 15 }
        ];
        const t = types[Math.floor(Math.random() * types.length)];

        bonuses.push({
            x: canvas.width,
            y: ROAD_Y - 96,
            w: 96,
            h: 96,
            img: t.img,
            points: t.points
        });
    }

    requestAnimationFrame(gameLoop);
}

/* ===============================
   HILFE
================================= */
function draw(img, x, y, w, h) {
    ctx.drawImage(img, Math.round(x), Math.round(y), w, h);
}

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
}

function startGame() {
    player.y = ROAD_Y - player.h;
    updateScore();
    gameLoop();
}

function restart() {
    location.reload();
}
