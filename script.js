let style, canvas, ctx;
let W, H;
let images, particles, prev, interval, sbwidth;
let dt = 0, fps = 60;
let mouse = [0, 0];

// name, description, image (true / false), base color, dark background
let repos = [
	[["hanoi", "Hanoi towers game", true, [193, 253, 249], true],
	 ["hardest", "Hardest game ever. Truly.", true, [217, 141, 141], false],
	 ["dumb-questions", "Dumb questions, website with about 99% CSS.", false, [237, 177, 38], true],
	 ["tic-tac-doh", "Tic-tac-toe variants, but Homer themed... [upcoming]", false, [255, 200, 0], false]],
	 //["minesweeper", "Minesweeper game [upcoming]", false, [200, 200, 200], false],
	 //["lucky-numbers", "Play against a smart AI in this thinking-ahead game!", false, [0, 200, 50], false]],
	[["finesse", "A customizable Tetris finesse trainer", true, [228, 119, 241], true],
	 ["mandelbrot", "Javascript Mandelbrot set visualizer", true, [109, 163, 71], true],
	 ["jstolist", "Javascript Eisenhower Matrix", true, [248, 248, 248], false]],
	[["dikc-8", "DIKC-8 and DIKC-8 2 Minecraft CPUs utilities", true, [239, 242, 239], false],
	 ["tetris-ai-2", "Python tetris AI. It can beat me.", true, [150, 150, 150], true],
	 ["2048", "2048 game, created in 1 hour. Maybe some bugs.", true, [187, 173, 160], false],
	 ["python", "Random small python projects I made", true, [230, 242, 245], false],
	 ["maze", "Doom-like maze with randomly generated levels", true, [95, 105, 80], false],
	 ["cpp-renderer", "C++ 3D renderer, using SDL2", true, [187, 212, 255], false],
	 ["jstris-plus", "Jstris+ storage for soundpacks I created", true, [229, 92, 191], true],
	 ["install-wizard", "Rudimentary tkinter installer", false, [192, 192, 192], true],
	 ["smooth-movement", "pygame smooth character movement with friction", false, [192, 192, 192], true],
	 ["camera-scrolling", "Smooth camera following script", false, [192, 192, 192], true],
	 ["textbox", "A simple pygame textbox", false, [192, 192, 192], true]]
	];

// from SO/q/13382516
function getScrollbarWidth() {
	// Creating invisible container
	const outer = document.createElement('div');
	outer.style.visibility = 'hidden';
	outer.style.overflow = 'scroll'; // forcing scrollbar to appear
	outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
	document.body.appendChild(outer);

	// Creating inner element and placing it in the container
	const inner = document.createElement('div');
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

		if (this.node) {
			// line from neighboring particles to this
			drawLines(this.flatX, this.flatY);
		} else {
			ctx.drawImage(images[this.i], this.flatX-this.size, this.flatY-this.size, this.size*2, this.size*2);
		}
	}
}

function drawLines(x, y) {
	// draw lines from close enough particles to (x, y)
	particles.forEach(p => {
		let dx = p.flatX-x, dy = p.flatY-y;
		let d = dx*dx+dy*dy;
		if (d < 100000) {
			let col = 1 - Math.sqrt(d/100000);
			ctx.strokeStyle = "rgba(0, 0, 0, " + col*col*0.5 + ")";
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
	let t = window.scrollY/(document.body.parentNode.offsetHeight-window.innerHeight);
	canvas.style = "--grad1: "+lerpCol(240, 250, 255, 91, 151, 176, t)+"; --grad2: "+lerpCol(199, 227, 237, 151, 156, 242, t);
}

function lerpCol(r1, g1, b1, r2, g2, b2, t) {
	return "rgb(" + (r1+(r2-r1)*t) + ", " + (g1+(g2-g1)*t) + ", " + (b1+(b2-b1)*t) + ")";
}

function mouseEvt(e) {
	mouse = [e.x * (W+sbwidth)/W, e.y];
}

function multColor(col, m) {
	return "rgba(" + parseInt(col[0]*m) + ", " + parseInt(col[1]*m) + ", " + parseInt(col[2]*m) + ")";
}

function addRepos() {
	let sections = document.getElementsByTagName("section");
	for (let i = 0; i < 3; i++) {
		let container = sections[i].children[1];
		for (let j = 0; j < repos[i].length; j++) {
			repo = repos[i][j];

			let title = repo[0], desc = repo[1], col = repo[3], dark = repo[4];
			let src;
			if (repo[2]) src = "images/repos/" + repo[0] + ".png";
			else src = "https://avatars.githubusercontent.com/u/69427207";

			let block = document.createElement("a");
			if (i == 0) block.href = "https://d-002.github.io/"+title;
			else block.href = "https://github.com/d-002/"+title;
			block.className = "block";

			let A, B, C, D, E;
			if (dark) A = "#222", B = "#1a1a1a", C = "#000", D = multColor(col, 1), E = multColor(col, 0.8);
			else A = multColor(col, 1), B = multColor(col, 0.8), C = multColor(col, 0.5), D = "#000", E = multColor(col, 0.3);
			block.style = "--bg1: "+A+"; --bg2: "+B+"; --border: "+C+"; --text1: "+D+"; --text2: "+E;
			block.innerHTML = `
<img src="SRC">
<div>
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
	interval = window.setInterval(update, 1000/fps);
	styleBody();
}
