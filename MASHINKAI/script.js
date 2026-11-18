const LETTERS = "აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ".split("");
const N = 20,
  CELL = 30;
const cv = document.getElementById("c"),
  ctx = cv.getContext("2d");
const $ = (id) => document.getElementById(id);

let mode = "alpha",
  snake,
  dir,
  nextDir,
  foods,
  score,
  lives,
  idx,
  collected,
  running = false,
  paused = false,
  timer,
  speed;
let best = 0;
try {
  best = +localStorage.getItem("geoSnakeBest") || 0;
} catch (e) {}
$("best").textContent = best;

// alphabet panel
LETTERS.forEach((l, i) => {
  const s = document.createElement("span");
  s.textContent = l;
  s.id = "a" + i;
  $("alpha").appendChild(s);
});

function setMode(m) {
  if (running && !paused) return;
  mode = m;
  $("mAlpha").classList.toggle("on", m === "alpha");
  $("mFree").classList.toggle("on", m === "free");
  $("targetCard").style.display = m === "alpha" ? "" : "none";
  $("ovText").textContent =
    m === "alpha"
      ? "ისრებით ან WASD-ით მართე გველი. ჭამე ასოები რიგრიგობით: ა → ბ → გ… არასწორი ასო სიცოცხლეს წაგართმევს."
      : "ისრებით ან WASD-ით მართე გველი. ჭამე ნებისმიერი ასო და გაიზარდე რაც შეიძლება დიდი!";
}
$("mAlpha").onclick = () => setMode("alpha");
$("mFree").onclick = () => setMode("free");

function freeCell() {
  while (true) {
    const p = {
      x: Math.floor(Math.random() * N),
      y: Math.floor(Math.random() * N),
    };
    if (snake.some((s) => s.x === p.x && s.y === p.y)) continue;
    if (foods.some((f) => f.x === p.x && f.y === p.y)) continue;
    if (Math.abs(p.x - snake[0].x) + Math.abs(p.y - snake[0].y) < 3) continue;
    return p;
  }
}

function spawnFoods() {
  foods = [];
  if (mode === "alpha") {
    const want = LETTERS[idx];
    foods.push({ ...freeCell(), l: want });
    const others = LETTERS.filter((l) => l !== want)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    others.forEach((l) => foods.push({ ...freeCell(), l }));
  } else {
    while (foods.length < 4)
      foods.push({
        ...freeCell(),
        l: LETTERS[Math.floor(Math.random() * LETTERS.length)],
      });
  }
}

function reset() {
  snake = [
    { x: 10, y: 10, l: "" },
    { x: 9, y: 10, l: "" },
    { x: 8, y: 10, l: "" },
  ];
  dir = { x: 1, y: 0 };
  nextDir = dir;
  score = 0;
  lives = 3;
  idx = 0;
  collected = new Set();
  speed = 140;
  foods = [];
  spawnFoods();
  updateUI();
}

function updateUI() {
  $("score").textContent = score;
  $("lives").textContent = "❤".repeat(lives) + "♡".repeat(3 - lives);
  $("target").textContent = LETTERS[idx] || "★";
  LETTERS.forEach((l, i) => {
    const s = $("a" + i);
    s.classList.toggle("got", collected.has(l));
    s.classList.toggle("now", mode === "alpha" && i === idx);
  });
}

function toast(t, color) {
  const el = $("toast");
  el.textContent = t;
  el.style.color = color;
  el.style.opacity = 1;
  clearTimeout(el._t);
  el._t = setTimeout(() => (el.style.opacity = 0), 700);
}

function start() {
  reset();
  running = true;
  paused = false;
  $("ov").classList.add("hidden");
  loop();
}
function loop() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    step();
    if (running) loop();
  }, speed);
}

function gameOver(win) {
  running = false;
  clearTimeout(timer);
  if (score > best) {
    best = score;
    try {
      localStorage.setItem("geoSnakeBest", best);
    } catch (e) {}
    $("best").textContent = best;
  }
  $("ovTitle").textContent = win
    ? "🎉 მთელი ანბანი შეაგროვე!"
    : "თამაში დასრულდა";
  $("ovText").textContent =
    `ქულა: ${score} · შეგროვებული ასოები: ${collected.size}/33`;
  $("startBtn").textContent = "თავიდან";
  $("ov").classList.remove("hidden");
}

function step() {
  if (paused) return;
  dir = nextDir;
  const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y, l: "" };
  if (
    h.x < 0 ||
    h.y < 0 ||
    h.x >= N ||
    h.y >= N ||
    snake.some((s) => s.x === h.x && s.y === h.y)
  ) {
    draw();
    return gameOver(false);
  }
  snake.unshift(h);
  const fi = foods.findIndex((f) => f.x === h.x && f.y === h.y);
  if (fi < 0) {
    snake.pop();
  } else {
    const f = foods[fi];
    if (mode === "alpha") {
      if (f.l === LETTERS[idx]) {
        snake[1] && (h.l = f.l);
        h.l = f.l;
        collected.add(f.l);
        score += 10;
        idx++;
        toast(f.l + " ✓", "var(--good)");
        speed = Math.max(70, speed - 2);
        if (idx >= LETTERS.length) {
          updateUI();
          draw();
          return gameOver(true);
        }
        spawnFoods();
      } else {
        snake.pop();
        lives--;
        toast("არა " + f.l + " — საჭიროა " + LETTERS[idx], "var(--bad)");
        foods.splice(fi, 1);
        foods.push({ ...freeCell(), l: f.l });
        if (lives <= 0) {
          updateUI();
          draw();
          return gameOver(false);
        }
      }
    } else {
      h.l = f.l;
      collected.add(f.l);
      score += 10;
      toast(f.l, "var(--good)");
      speed = Math.max(65, speed - 2);
      foods.splice(fi, 1);
      foods.push({
        ...freeCell(),
        l: LETTERS[Math.floor(Math.random() * LETTERS.length)],
      });
      if (collected.size === 33 && !snake._won) {
        snake._won = true;
        toast("🎉 მთელი ანბანი!", "var(--snake)");
      }
    }
    updateUI();
  }
  draw();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function draw() {
  ctx.fillStyle = "#173328";
  ctx.fillRect(0, 0, 600, 600);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      if ((x + y) % 2) {
        ctx.fillStyle = "#1a382c";
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // foods
  foods.forEach((f) => {
    const isTarget = mode === "alpha" && f.l === LETTERS[idx];
    ctx.fillStyle = "rgba(244,239,227,.12)";
    roundRect(f.x * CELL + 2, f.y * CELL + 2, CELL - 4, CELL - 4, 8);
    ctx.fillStyle = "#f4efe3";
    ctx.font = "800 21px 'Noto Sans Georgian'";
    ctx.fillText(f.l, f.x * CELL + CELL / 2, f.y * CELL + CELL / 2 + 1);
  });
  // snake
  snake.forEach((s, i) => {
    ctx.fillStyle = i === 0 ? "#f2c14e" : i % 2 ? "#e8b443" : "#d99a2b";
    roundRect(
      s.x * CELL + 1,
      s.y * CELL + 1,
      CELL - 2,
      CELL - 2,
      i === 0 ? 10 : 7,
    );
    if (s.l && i > 0) {
      ctx.fillStyle = "#3a2805";
      ctx.font = "800 17px 'Noto Sans Georgian'";
      ctx.fillText(s.l, s.x * CELL + CELL / 2, s.y * CELL + CELL / 2 + 1);
    }
  });
  // eyes
  const h = snake[0],
    cx = h.x * CELL + CELL / 2,
    cy = h.y * CELL + CELL / 2;
  const px = -dir.y,
    py = dir.x;
  [[1], [-1]].forEach(([s]) => {
    const ex = cx + dir.x * 6 + px * 6 * s,
      ey = cy + dir.y * 6 + py * 6 * s;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(ex, ey, 4, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.arc(ex + dir.x * 1.5, ey + dir.y * 1.5, 2, 0, 7);
    ctx.fill();
  });
  if (paused) {
    ctx.fillStyle = "rgba(10,24,18,.6)";
    ctx.fillRect(0, 0, 600, 600);
    ctx.fillStyle = "#f4efe3";
    ctx.font = "800 36px 'Noto Sans Georgian'";
    ctx.fillText("პაუზა", 300, 300);
  }
}

const DIRS = {
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
};
document.addEventListener("keydown", (e) => {
  if (DIRS[e.code]) {
    e.preventDefault();
    const [x, y] = DIRS[e.code];
    if (running && !(x === -dir.x && y === -dir.y)) nextDir = { x, y };
  } else if (e.code === "Space") {
    e.preventDefault();
    if (running) {
      paused = !paused;
      draw();
    }
  } else if (e.code === "Enter" && !running) {
    start();
  }
});
$("startBtn").onclick = start;

// touch: on-screen pad + swipe
function turn(x, y) {
  if (running && !(x === -dir.x && y === -dir.y)) nextDir = { x, y };
}
document.querySelectorAll("#pad [data-d]").forEach((b) => {
  b.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const [x, y] = b.dataset.d.split(",").map(Number);
    turn(x, y);
  });
});
$("pauseBtn").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (running) {
    paused = !paused;
    draw();
  } else start();
});
let sx = null,
  sy = null;
cv.addEventListener(
  "touchstart",
  (e) => {
    const t = e.touches[0];
    sx = t.clientX;
    sy = t.clientY;
    e.preventDefault();
  },
  { passive: false },
);
cv.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    if (sx === null) return;
    const t = e.touches[0],
      dx = t.clientX - sx,
      dy = t.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0);
    else turn(0, dy > 0 ? 1 : -1);
    sx = t.clientX;
    sy = t.clientY;
  },
  { passive: false },
);
cv.addEventListener("touchend", () => {
  sx = null;
});

// initial preview
snake = [
  { x: 10, y: 10, l: "" },
  { x: 9, y: 10, l: "ბ" },
  { x: 8, y: 10, l: "ა" },
];
dir = { x: 1, y: 0 };
foods = [];
setMode("alpha");
idx = 0;
collected = new Set();
spawnFoods();
document.fonts && document.fonts.ready.then(draw);
draw();
updateUI();
