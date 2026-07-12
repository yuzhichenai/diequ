(function () {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    const startScreen = document.getElementById('start-screen');
    const hud = document.getElementById('hud');
    const gameOverScreen = document.getElementById('game-over-screen');
    const scoreEl = document.getElementById('score');
    const comboEl = document.getElementById('combo');
    const finalScoreEl = document.getElementById('final-score');
    const perfectCountEl = document.getElementById('perfect-count');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');

    const GAME_WIDTH = 400;
    const GAME_HEIGHT = 600;
    const BLOCK_HEIGHT = 25;
    const BASE_SIZE = 220;
    const PERFECT_THRESHOLD = 3;
    const MIN_BLOCK_SIZE = 15;

    let width, height, scale;
    let game = null;
    let particles = [];
    let ambientParticles = [];
    let lastTime = 0;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        scale = Math.min(width / GAME_WIDTH, height / GAME_HEIGHT);
        canvas.width = width;
        canvas.height = height;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(scale, scale);
    }

    function hsl(h, s, l) {
        return `hsl(${h}, ${s}%, ${l}%)`;
    }

    function project(x, y, z) {
        const cos30 = 0.866;
        const sin30 = 0.5;
        return {
            x: (x - z) * cos30,
            y: (x + z) * sin30 - y
        };
    }

    function toScreen(x, y) {
        return {
            x: x + GAME_WIDTH / 2,
            y: y + GAME_HEIGHT * 0.72
        };
    }

    class AmbientParticle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = (Math.random() - 0.5) * GAME_WIDTH * 1.5;
            this.z = (Math.random() - 0.5) * GAME_WIDTH * 1.5;
            this.y = Math.random() * GAME_HEIGHT * 0.8;
            this.size = 1 + Math.random() * 2;
            this.speed = 0.2 + Math.random() * 0.3;
            this.alpha = 0.1 + Math.random() * 0.2;
            this.hue = 340 + Math.random() * 60;
        }

        update() {
            this.y -= this.speed;
            if (this.y < -GAME_HEIGHT) {
                this.reset();
                this.y = GAME_HEIGHT * 0.8;
            }
        }

        draw() {
            const p = project(this.x, this.y, this.z);
            const s = toScreen(p.x, p.y);
            ctx.fillStyle = hsl(this.hue, 80, 70);
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(s.x, s.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    class Particle {
        constructor(x, y, z, hue) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.vx = (Math.random() - 0.5) * 6;
            this.vy = -2 - Math.random() * 4;
            this.vz = (Math.random() - 0.5) * 6;
            this.life = 1;
            this.decay = 0.01 + Math.random() * 0.02;
            this.hue = hue + (Math.random() - 0.5) * 30;
            this.size = 2 + Math.random() * 3;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.z += this.vz;
            this.vy += 0.15;
            this.life -= this.decay;
        }

        draw() {
            if (this.life <= 0) return;
            const p = project(this.x, this.y, this.z);
            const s = toScreen(p.x, p.y);
            ctx.globalAlpha = this.life;
            ctx.fillStyle = hsl(this.hue, 90, 65);
            ctx.beginPath();
            ctx.arc(s.x, s.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    function createParticles(x, y, z, hue, count = 15) {
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(x, y, z, hue));
        }
    }

    function drawFace(points, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        const start = toScreen(points[0].x, points[0].y);
        ctx.moveTo(start.x, start.y);
        for (let i = 1; i < points.length; i++) {
            const p = toScreen(points[i].x, points[i].y);
            ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fill();
    }

    class Block {
        constructor(x, z, width, depth, y, hue) {
            this.x = x;
            this.z = z;
            this.width = width;
            this.depth = depth;
            this.y = y;
            this.hue = hue;
            this.color = hsl(hue, 75, 65);
            this.topColor = hsl(hue, 75, 70);
            this.rightColor = hsl(hue, 80, 58);
            this.leftColor = hsl(hue, 80, 50);
        }

        draw() {
            const w = this.width / 2;
            const d = this.depth / 2;
            const h = BLOCK_HEIGHT;
            const x = this.x;
            const z = this.z;
            const y = this.y;

            const topFace = [
                project(x - w, y + h, z - d),
                project(x + w, y + h, z - d),
                project(x + w, y + h, z + d),
                project(x - w, y + h, z + d)
            ];

            const rightFace = [
                project(x + w, y, z - d),
                project(x + w, y, z + d),
                project(x + w, y + h, z + d),
                project(x + w, y + h, z - d)
            ];

            const leftFace = [
                project(x - w, y, z + d),
                project(x + w, y, z + d),
                project(x + w, y + h, z + d),
                project(x - w, y + h, z + d)
            ];

            drawFace(rightFace, this.rightColor);
            drawFace(leftFace, this.leftColor);
            drawFace(topFace, this.topColor);
        }
    }

    class Game {
        constructor() {
            this.reset();
        }

        reset() {
            this.state = 'menu';
            this.score = 0;
            this.combo = 0;
            this.perfectCount = 0;
            this.level = 0;
            this.blocks = [];
            this.currentBlock = null;
            this.cameraY = 0;
            this.time = 0;
            this.direction = 'x';
            this.speed = 0;
            this.amplitude = 0;
            this.phase = 0;
            this.lastPlaceTime = 0;

            this.blocks.push(new Block(0, 0, BASE_SIZE, BASE_SIZE, 0, 340));
            this.spawnNextBlock();
        }

        spawnNextBlock() {
            this.level++;
            const prev = this.blocks[this.blocks.length - 1];
            const hue = (340 + this.level * 22) % 360;
            const y = this.level * BLOCK_HEIGHT;
            this.direction = this.level % 2 === 1 ? 'x' : 'z';
            this.speed = 1.5 + this.level * 0.25;

            let x = prev.x;
            let z = prev.z;
            let width = prev.width;
            let depth = prev.depth;

            if (this.direction === 'x') {
                this.amplitude = prev.width / 2;
                x = prev.x + this.amplitude;
            } else {
                this.amplitude = prev.depth / 2;
                z = prev.z + this.amplitude;
            }

            this.currentBlock = new Block(x, z, width, depth, y, hue);
            this.phase = Math.PI / 2;
            const topY = y + BLOCK_HEIGHT;
            const targetScreenY = GAME_HEIGHT * 0.3;
            const neededOffset = Math.max(0, targetScreenY + topY - GAME_HEIGHT * 0.72);
            this.targetCameraY = neededOffset * 2;
        }

        place() {
            if (this.state !== 'playing' || !this.currentBlock) return;
            const now = performance.now();
            if (now - this.lastPlaceTime < 120) return;
            this.lastPlaceTime = now;

            const curr = this.currentBlock;
            const prev = this.blocks[this.blocks.length - 1];
            let overlap, newCenter, axis;

            if (this.direction === 'x') {
                const prevMin = prev.x - prev.width / 2;
                const prevMax = prev.x + prev.width / 2;
                const currMin = curr.x - curr.width / 2;
                const currMax = curr.x + curr.width / 2;
                overlap = Math.min(prevMax, currMax) - Math.max(prevMin, currMin);
                newCenter = (Math.max(prevMin, currMin) + Math.min(prevMax, currMax)) / 2;
                axis = 'width';
            } else {
                const prevMin = prev.z - prev.depth / 2;
                const prevMax = prev.z + prev.depth / 2;
                const currMin = curr.z - curr.depth / 2;
                const currMax = curr.z + curr.depth / 2;
                overlap = Math.min(prevMax, currMax) - Math.max(prevMin, currMin);
                newCenter = (Math.max(prevMin, currMin) + Math.min(prevMax, currMax)) / 2;
                axis = 'depth';
            }

            if (overlap < MIN_BLOCK_SIZE) {
                this.gameOver();
                return;
            }

            const oldSize = axis === 'width' ? curr.width : curr.depth;
            const isPerfect = Math.abs(overlap - oldSize) < PERFECT_THRESHOLD;

            if (axis === 'width') {
                curr.width = overlap;
                curr.x = newCenter;
            } else {
                curr.depth = overlap;
                curr.z = newCenter;
            }

            this.blocks.push(curr);

            if (isPerfect) {
                this.combo++;
                this.perfectCount++;
                this.score += 10 + this.level * 2 + this.combo * 10;
                createParticles(curr.x, curr.y + BLOCK_HEIGHT, curr.z, curr.hue, 25);
            } else {
                this.combo = 0;
                this.score += 10 + this.level;
                createParticles(curr.x, curr.y + BLOCK_HEIGHT, curr.z, curr.hue, 8);
            }

            this.updateUI();
            this.spawnNextBlock();
        }

        gameOver() {
            this.state = 'over';
            createParticles(this.currentBlock.x, this.currentBlock.y, this.currentBlock.z, this.currentBlock.hue, 40);
            setTimeout(() => {
                showScreen('game-over');
                finalScoreEl.textContent = this.score;
                perfectCountEl.textContent = `完美次数: ${this.perfectCount}`;
            }, 800);
        }

        start() {
            this.reset();
            this.state = 'playing';
            showScreen('hud');
            this.updateUI();
        }

        updateUI() {
            scoreEl.textContent = this.score;
            if (this.combo > 1) {
                comboEl.textContent = `x${this.combo} 连击`;
                comboEl.classList.add('show');
            } else {
                comboEl.classList.remove('show');
            }
        }

        update(dt) {
            this.time += dt;

            if (this.state === 'playing' && this.currentBlock) {
                this.phase += dt * this.speed * 2;
                const offset = Math.sin(this.phase) * this.amplitude;
                if (this.direction === 'x') {
                    this.currentBlock.x = this.blocks[this.blocks.length - 1].x + offset;
                } else {
                    this.currentBlock.z = this.blocks[this.blocks.length - 1].z + offset;
                }
            }

            this.cameraY += (this.targetCameraY - this.cameraY) * 0.25;

            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update();
                if (particles[i].life <= 0) {
                    particles.splice(i, 1);
                }
            }

            for (let p of ambientParticles) {
                p.update();
            }
        }

        draw() {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.restore();

            ctx.save();
            const cameraOffset = this.cameraY * 0.5;
            ctx.translate(0, cameraOffset);

            for (let p of ambientParticles) {
                p.draw();
            }

            for (let block of this.blocks) {
                block.draw();
            }

            if (this.currentBlock && this.state !== 'over') {
                this.currentBlock.draw();
            }

            for (let p of particles) {
                p.draw();
            }

            ctx.restore();
        }
    }

    function showScreen(name) {
        startScreen.classList.remove('active');
        hud.classList.remove('active');
        gameOverScreen.classList.remove('active');

        if (name === 'start') startScreen.classList.add('active');
        if (name === 'hud') hud.classList.add('active');
        if (name === 'game-over') gameOverScreen.classList.add('active');
    }

    function onInput(e) {
        if (e.type === 'keydown') {
            if (e.code !== 'Space' || e.repeat) return;
        }
        if (e.type !== 'keydown') e.preventDefault();

        if (game.state === 'menu') {
            game.start();
        } else if (game.state === 'playing') {
            game.place();
        } else if (game.state === 'over') {
            game.start();
        }
    }

    function loop(timestamp) {
        const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
        lastTime = timestamp;

        game.update(dt);
        game.draw();

        requestAnimationFrame(loop);
    }

    function init() {
        resize();
        window.addEventListener('resize', resize);

        for (let i = 0; i < 40; i++) {
            ambientParticles.push(new AmbientParticle());
        }

        game = new Game();
        showScreen('start');

        startBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            startBtn.blur();
            game.start();
        });

        restartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            restartBtn.blur();
            game.start();
        });

        canvas.addEventListener('pointerdown', onInput);
        document.addEventListener('keydown', onInput);

        requestAnimationFrame(loop);
    }

    init();
})();
