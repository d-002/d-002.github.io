let style, canvas, ctx;
let W, H;
let images, particles, prev, interval, sbwidth;
let dt = 0, fps = 60;
let mouse = [0, 0];

let colT = [[0, 0, 50], [0, 0, 0]];
let colB = [[20, 20, 70], [30, 0, 0]];

// name, description, image (boolean), base color, dark background (boolean)[, background color]
let repos = [
    [["hanoi", "Hanoi towers game", true, [193, 253, 249], true],
        ["hardest", "Hardest game ever. Truly.", true, [217, 50, 50], false],
        ["dumb-questions", "Dumb questions, website with about 99% CSS.", false, [237, 177, 38], true, [35, 30, 20]],
        ["tic-tac-doh", "Tic-tac-toe AI and variants, but The Simpsons-themed...", true, [252, 237, 154], false],
        ["download-ram", "Free and legit online RAM downloading service", true, [247, 252, 252], false]],
    //["minesweeper", "Minesweeper game [UPCOMING]", false, [200, 200, 200], true]],
    //["lucky-numbers", "Play against a smart AI in this thinking-ahead game! [UPCOMING]", false, [0, 200, 50], false]],
    [["finesse", "A customizable Tetris finesse trainer", true, [228, 119, 241], true],
        ["mandelbrot", "Javascript Mandelbrot set visualizer", true, [109, 163, 71], true],
        ["jstolist", "Javascript Eisenhower Matrix", true, [248, 248, 248], false],
        ["password", "Advanced secure password maker", true, [234, 134, 137], true, [32, 49, 69]],
        ["isocraft-story-website", "Website for IsoCrat Story", true, [223, 132, 58], false]],
    [["dikc-8", "DIKC-8 and DIKC-8 2 Minecraft CPUs utilities", true, [239, 242, 239], false],
        ["tetris-ai-2", "Python tetris AI. It can beat me.", true, [170, 170, 170], true, [30, 30, 30]],
        ["2048", "2048 game, created in 1 hour. Maybe some bugs.", true, [187, 173, 160], false],
        ["python", "Random small python projects I made", true, [230, 242, 245], false],
        ["maze", "Doom-like maze with randomly generated levels", true, [95, 105, 80], false],
        ["cpp-renderer", "C++ 3D renderer, using SDL2", true, [187, 212, 255], false],
        ["jstris-plus", "Jstris+ storage for soundpacks I created", true, [229, 92, 191], true, [10, 10, 10]],
        ["install-wizard", "Rudimentary tkinter installer", false, [192, 192, 192], true],
        ["smooth-movement", "pygame smooth character movement with friction", false, [192, 192, 192], true],
        ["camera-scrolling", "Smooth camera following script", false, [192, 192, 192], true],
        ["textbox", "A simple pygame textbox", false, [192, 192, 192], true]]
];

// from SO/q/13382516
function getScrollbarWidth() {
    // Creating invisible container
    const outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.overflow = "scroll"; // forcing scrollbar to appear
    outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps
    document.body.appendChild(outer);

    // Creating inner element and placing it in the container
    const inner = document.createElement("div");
    outer.appendChild(inner);

    // Calculating difference between container's full width and the child width
    const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);

    // Removing temporary elements from the DOM
    outer.parentNode.removeChild(outer);

    return scrollbarWidth;
}

class Particle {
    constructor(node) {
        let z = Math.random()*3+2;
        this.z = z; // square to increase the fov idk
        this.x = Math.random()*W*this.z;
        this.y = Math.random()*H*this.z;
        this.flatX = this.x, this.flatY = this.y; // once projected in 2D
        if (z < 3) this.i = 0;
        else if (z < 4) this.i = 1;
        else this.i = 2;
        this.size = 3 - this.i;

        let a = Math.random()*Math.PI;
        this.dx = Math.cos(a)*20;
        this.dy = Math.sin(a)*20;

        this.node = node;
    }

    update() {
        this.x += this.dx*dt;
        this.y += this.dy*dt;

        let m = 1/this.z;
        this.flatX = (this.x*m % W + W) % W;
        this.flatY = ((this.y-window.scrollY*2*m*m)*m % H + H) % H;

        if (this.node)
            // line from neighboring particles to this
            drawLines(this.flatX, this.flatY);
        else
            ctx.drawImage(images[this.i], this.flatX-this.size, this.flatY-this.size, this.size*2, this.size*2);
    }
}

function drawLines(x, y) {
    // draw lines from close enough particles to (x, y)
    particles.forEach(p => {
        let dx = p.flatX-x, dy = p.flatY-y;
        let d = dx*dx+dy*dy;
        if (d < 100000) {
            let col = 1 - Math.sqrt(d/100000);
            ctx.strokeStyle = "rgba(255, 255, 255, " + col*col*0.5 + ")";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p.flatX, p.flatY);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    });
}

function update() {
    ctx.clearRect(0, 0, W, H);

    particles.forEach(p => p.update());
    drawLines(mouse[0], mouse[1]);

    dt = (Date.now()-prev) / 1000;
    prev = Date.now();
}

function styleBody() {
    let cols = getScrollCols();
    canvas.style = "--grad1: "+listCol(cols[0])+"; --grad2: "+listCol(cols[1]);
}

function getScrollCols() {
    let t = window.scrollY/(document.body.parentNode.offsetHeight-window.innerHeight);
    if (t == NaN) t = 1;
    return [lerpCol(...colT[0], ...colT[1], t), lerpCol(...colB[0], ...colB[1], t)];
}

function lerpCol(r1, g1, b1, r2, g2, b2, t) {
    return [r1+(r2-r1)*t, g1+(g2-g1)*t, b1+(b2-b1)*t];
}

function listCol(l, a=1) {
    if (a == 1) return "rgb("+l[0]+", "+l[1]+", "+l[2]+")";
    return "rgba("+l[0]+", "+l[1]+", "+l[2]+", "+a+")";
}

function mouseEvt(e) {
    mouse = [e.x * (W+sbwidth)/W, e.y];
}

function multColor(col, m, a=1) {
    let s = parseInt(col[0]*m) + ", " + parseInt(col[1]*m) + ", " + parseInt(col[2]*m);
    if (a == 1) return "rgb("+s+")";
    return "rgba("+s+", "+a+")";
}

function toggleInterval() {
    if (interval == null) interval = window.setInterval(update, 1000/fps);
    else {
        window.clearInterval(interval);
        interval = null;
        ctx.clearRect(0, 0, W, H);
    }
}

function toggleMusic() {
    alert("Upcoming feature, stay tuned for updates");
}

function addRepos() {
    let sections = document.getElementsByTagName("section");
    for (let i = 0; i < 3; i++) {
        let container = sections[i].children[1];
        for (let j = 0; j < repos[i].length; j++) {
            repo = repos[i][j];

            let title = repo[0], desc = repo[1], col = repo[3], dark = repo[4], col2 = repo[5];
            let src;
            if (repo[2]) src = "images/repos/" + repo[0] + ".png";
            else src = "https://avatars.githubusercontent.com/u/69427207";

            let block = document.createElement("a");
            if (i < 2) block.href = "https://d-002.github.io/"+title;
            else block.href = "https://github.com/d-002/"+title;
            block.className = "block";

            let A, B, C, D, E;
            if (dark) {
                if (col2 == null) col2 = [10, 0, 30];
                A = multColor(col2, 1), B = multColor(col, 0.8), C = multColor(col, 0.6), D = multColor(col, 1), E = multColor(col, 0.8);
            }
            else A = multColor(col, 1), B = multColor(col, 0.8), C = multColor(col, 0.5), D = "#000", E = multColor(col, 0.3);
            block.style = "--bg1: "+A+"; --bg2: "+B+"; --border: "+C+"; --text1: "+D+"; --text2: "+E;
            block.innerHTML = `
<img src="SRC">
<div></div>
<div class="content">
<strong>TITLE</strong>
<span>DESC</span>
</div>
`.replace("SRC", src).replace("TITLE", title).replace("DESC", desc);
            container.appendChild(block);
        }
    }
}

function init() {
    style = document.createElement("style");
    document.head.appendChild(style);

    W = window.innerWidth;
    H = window.innerHeight;
    canvas = document.getElementById("canvas");
    canvas.setAttribute("width", W);
    canvas.setAttribute("height", H);
    ctx = canvas.getContext("2d");

    addRepos();

    images = document.getElementById("images").children;

    particles = [];
    for (let i = 0; i < 50; i++) particles.push(new Particle(i%10 == 0));
    prev = Date.now();

    sbwidth = getScrollbarWidth();
    document.addEventListener("mousemove", mouseEvt);
    document.addEventListener("scroll", styleBody);
    toggleInterval();
    styleBody();
}
