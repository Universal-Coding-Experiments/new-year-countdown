const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const elapsedDiv = document.getElementById('elapsed');

let W = 0, H = 0;
let DPR = Math.max(1, window.devicePixelRatio || 1);

let titleSize = 64, yearSize = 80, countdownSize = 20, titleY = 0, yearY = 0, topBoxY = 24;

function setCanvasSize() {
    DPR = Math.max(1, window.devicePixelRatio || 1);
    W = Math.max(300, innerWidth);
    H = Math.max(200, innerHeight);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    computeLayout();
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function computeLayout() {
    const S = Math.min(W, H);
    titleSize = Math.round(clamp(S * 0.12, 36, 140));
    yearSize = Math.round(clamp(S * 0.14, 44, 160));
    countdownSize = Math.round(clamp(S * 0.045, 14, 40));
    const topMargin = clamp(H * 0.05, 18, 80);
    const centerShift = clamp(H * 0.06, 28, 140);
    titleY = Math.round(H / 2 - centerShift);
    yearY = Math.round(H / 2 + centerShift);
    topBoxY = Math.round(topMargin);
}

const fireworks = [];
const confetti = [];

function spawnFirework(x, y) {
    for (let i = 0; i < 48; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 1.6 + Math.random() * 2.6;
        fireworks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, size: 1 + Math.random() * 2 });
    }
}
function spawnConfetti() {
    for (let i = 0; i < 14; i++) {
        confetti.push({
            x: Math.random() * W,
            y: -10,
            vx: (Math.random() - 0.5) * 1.6,
            vy: 1.6 + Math.random() * 2.0,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.06,
            color: `hsl(${Math.random() * 360},85%,60%)`,
            w: 7 + Math.random() * 10,
            h: 4 + Math.random() * 4
        });
    }
}
const fireInterval = setInterval(() => spawnFirework(Math.random() * W, H * 0.32 + Math.random() * H * 0.28), 1200);
const confettiInterval = setInterval(spawnConfetti, 420);

function pad(n) { return String(n).padStart(2, '0'); }
function breakdown(ms) {
    if (ms < 0) ms = 0;
    const days = Math.floor(ms / 86400000); ms -= days * 86400000;
    const hours = Math.floor(ms / 3600000); ms -= hours * 3600000;
    const mins = Math.floor(ms / 60000); ms -= mins * 60000;
    const secs = Math.floor(ms / 1000);
    return { days, hours, mins, secs };
}
function getNextNewYear() {
    const now = new Date();
    return new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0);
}
let nextNewYear = getNextNewYear();

const projectStart = new Date(2025, 11, 31, 0, 0, 0); // 2025-12-31

function getCountdown() {
    const now = new Date();
    if (now >= nextNewYear) nextNewYear = getNextNewYear();
    return breakdown(nextNewYear - now);
}
function getElapsed() {
    const now = new Date();
    const diff = now - projectStart;
    return { diff, ...breakdown(diff) };
}

/* ---------- Drawing helpers ---------- */
function roundRect(ctx, x, y, w, h, r) {
    if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
    ctx.beginPath();
    ctx.moveTo(x + r.tl, y);
    ctx.lineTo(x + w - r.tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
    ctx.lineTo(x + w, y + h - r.br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
    ctx.lineTo(x + r.bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
    ctx.lineTo(x, y + r.tl);
    ctx.quadraticCurveTo(x, y, x + r.tl, y);
    ctx.closePath();
    ctx.fill();
}

/* ---------- Visual layers ---------- */
function drawHeadline(nowMs) {
    const now = new Date();
    const hue = (now.getSeconds() * 6 + (nowMs * 0.01)) % 360;
    const title = "Happy New Year";
    const year = String(now.getFullYear() + 1);

    // glow layer
    ctx.save();
    ctx.font = `900 ${titleSize}px "Playfair Display", serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = `hsl(${hue},95%,62%)`;
    ctx.shadowColor = `hsl(${hue},95%,70%)`;
    ctx.shadowBlur = Math.max(18, Math.round(titleSize * 0.28));
    ctx.globalAlpha = 0.92;
    ctx.fillText(title, W / 2, titleY);
    ctx.font = `900 ${yearSize}px "Playfair Display", serif`;
    ctx.shadowBlur = Math.max(18, Math.round(yearSize * 0.28));
    ctx.fillText(year, W / 2, yearY);
    ctx.restore();

}

function drawCountdown(nowMs) {
    const cd = getCountdown();
    const text = `Countdown to ${nextNewYear.getFullYear()}: ${cd.days}d ${pad(cd.hours)}h ${pad(cd.mins)}m ${pad(cd.secs)}s`;
    ctx.save();
    ctx.font = `700 ${countdownSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const metrics = ctx.measureText(text);
    const padX = Math.round(countdownSize * 0.6);
    const padY = Math.round(countdownSize * 0.45);
    const boxW = metrics.width + padX * 2;
    const boxH = Math.round(countdownSize) + padY * 2;
    const boxX = Math.round(W / 2 - boxW / 2);
    const boxY = topBoxY;
    ctx.fillStyle = 'rgba(0,0,0,0.34)';
    roundRect(ctx, boxX, boxY, boxW, boxH, Math.max(8, Math.round(countdownSize * 0.5)));
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.fillText(text, W / 2, boxY + padY);
    ctx.restore();
}

function updateElapsed() {
    const elapsed = getElapsed();
    const dateStr = `${projectStart.getFullYear()}-${String(projectStart.getMonth() + 1).padStart(2, '0')}-${String(projectStart.getDate()).padStart(2, '0')}`;
    if (elapsed.diff < 0) {
        const until = breakdown(-elapsed.diff);
        elapsedDiv.innerText =
            `Project starts: ${dateStr}\n` +
            `Starts in: ${until.days}d ${pad(until.hours)}h ${pad(until.mins)}m ${pad(until.secs)}s`;
    } else {
        elapsedDiv.innerText =
            `Project started: ${dateStr}\n` +
            `Time since project started: ${elapsed.days}d ${pad(elapsed.hours)}h ${pad(elapsed.mins)}m ${pad(elapsed.secs)}s`;
    }
}

/* ---------- Main render loop ---------- */
function render(nowMs) {
    // background gradient
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, `hsl(${(nowMs * 0.02) % 360},70%,12%)`);
    g.addColorStop(1, `hsl(${((nowMs * 0.02) + 160) % 360},70%,6%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // vignette
    ctx.save();
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H));
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // fireworks
    for (let i = fireworks.length - 1; i >= 0; i--) {
        const p = fireworks[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.04;
        p.life *= 0.97;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${(i * 12 + nowMs * 0.06) % 360},100%,60%,${p.life})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        if (p.life < 0.04 || p.y > H + 24) fireworks.splice(i, 1);
    }

    // confetti
    for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i];
        c.x += c.vx; c.y += c.vy; c.rot += c.vr;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
        ctx.restore();
        if (c.y > H + 40) confetti.splice(i, 1);
    }

    drawHeadline(nowMs);
    drawCountdown(nowMs);
    updateElapsed();

    requestAnimationFrame(render);
}

/* ---------- Initialization ---------- */
function start() {
    
    setCanvasSize();

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => { computeLayout(); requestAnimationFrame(render); });
    } else {
        computeLayout();
        requestAnimationFrame(render);
    }
}

// debounce resize
let resizeTimer = null;
addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(setCanvasSize, 120); });

// start
start();