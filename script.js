let style, canvas, ctx;
let particles, W, H;
let FPS = 60;
let start = Date.now() + Math.random()*8000;
let mousePos = [0, 0];
let prevPos = [0, 0];
let mouseMove = 0; // average movement over 100 frames

let repos = [
	[["finesse", "A modern Tetris, customizable finesse training webpage"],
	 ["maze", "Doom-like maze with randomly generated levels"],
	 ["hardest", "Hardest game ever. Truly."],
	 ["mandelbrot", "Javascript Mandelbrot set visualization"]],
	[["install-wizard", "Rudimentary tkinter installer"],
	 ["jstris-plus", "Jstris+ storage for soundpacks I created"]]
	];

class Vector2 {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	getAngle() {
		return Math.atan2(this.y, this.x);
	}

	length() {
		return Math.sqrt(this.x*this.x + this.y*this.y);
	}

	normalize() {
		let l = this.length();
		this.x /= l;
		this.y /= l;
	}

	rotate(angle) {
		let a = this.getAngle()+angle;
		let l = this.length();
		
		this.x = Math.cos(a)*l;
		this.y = Math.sin(a)*l;
	}
}

class Particle {
	constructor() {
		this.x = Math.random()*W;
		this.y = Math.random()*H;
		this.size = Math.random()*3;
		this.speed = Math.random()*20 + 5;
		this.movement = new Vector2(1, 0);
		this.movement.rotate(Math.random()*2*Math.PI);
	}
	
	update() {
		// move away from mouse the faster it gets
		let toMouse = new Vector2(this.x-mousePos[0], this.y-mousePos[1]);
		let power = 0.5/toMouse.length(); // let's pretend the length will never be 0
		toMouse.normalize();
		let x = toMouse.x*mouseMove*power;
		let y = toMouse.y*mouseMove*power;

		this.x += (this.movement.x+x) * this.speed / FPS;
		this.y += (this.movement.y+y) * this.speed / FPS;

		// prevent going out of the screen
		let s = this.size/2;
		if (this.x < -s) {
			this.x = W+s;
		} else if (this.x > W+s) {
			this.x = -s;
		}
		if (this.y < -s) {
			this.y = H+s;
		} else if (this.y > H+s) {
			this.y = -s;
		}

		// draw
		ctx.fillStyle = "#fff";
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.size, 0, 2*Math.PI);
		ctx.fill();
	}
}

function updateMousePos(evt) {
	let bound = canvas.getBoundingClientRect();

	let x = evt.clientX - bound.left - canvas.clientLeft;
	let y = evt.clientY - bound.top - canvas.clientTop;

	mousePos = [x, y];
}

function addRepos() {
	let section, repo, a;
	let count = 0;
	for (let i = 0; i < 2; i++) {
		let title = document.createElement("div");
		if (i == 0) {
			title.innerHTML = "<h2>GitHub Pages repositories</h2>";
		} else {
			title.innerHTML = "<h2>Other repositories</h2>";
		}
		document.body.appendChild(title);

		section = document.createElement("section");
		document.body.appendChild(section);
		for (let j = 0; j < repos[i].length; j++) {
			repo = repos[i][j];

			a = document.createElement("a");
			a.href = "https://github.com/d-002/" + repo[0];
			a.innerHTML = `
			<img src="https://avatars.githubusercontent.com/u/69427207">
			<div>
				<h3>TITLE</h3>
				<p>DESC</p>
			</div>
			<div class="over-left"></div>`.replace("TITLE", repo[0]).replace("DESC", repo[1]);
			section.appendChild(a);
			
			a.style.animationDelay = "" + (2 + count/10) + "s";
			count++;
		}
	}
}

function animate() {
	W = window.innerWidth;
	H = window.innerHeight;
	canvas.setAttribute("width", W);
	canvas.setAttribute("height", H);

	let move = new Vector2(mousePos[0]-prevPos[0], mousePos[1]-prevPos[1]);
	mouseMove = (1 - 1/FPS) * (mouseMove+move.length());
	prevPos = [...mousePos];

	// set up particles
	if (particles == undefined) {
		particles = [];
		for (let i = 0; i < 50; i++) {
			particles.push(new Particle());
		}
	}

	// animate background
	let angle = (Date.now()-start)/1000*45;
	style.innerHTML = ":root{--background-angle: ANGLEdeg;}".replace("ANGLE", angle);

	// animate particles canvas
	ctx.clearRect(0, 0, W, H);
	for (let i = 0; i < particles.length; i++) {
		particles[i].update();
	}
}

function init() {
	style = document.createElement("style");
	document.head.appendChild(style);

	canvas = document.getElementById("particles")
	ctx = canvas.getContext("2d");

	addRepos();

	setInterval(animate, 1000/FPS);
	document.addEventListener("mousemove", updateMousePos);
}