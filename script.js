let style, canvas, ctx;
let particles, W, H;
let FPS = 60;
let start = Date.now() + Math.random()*8000;

let mousePos = [0, 0];
let prevPos = [0, 0]; // position of the mouse last frame
let mouseMove = 0;
let prevMove = []; // movement over last few frames
for (let i = 0; i < FPS; i++) {
	prevMove.push(0);
}

let stars = [];
let lastParticle = start;

let repos = [
	[["hardest", "Hardest game ever. Truly."],
	 ["maze", "Doom-like maze with randomly generated levels"],
	 ["finesse", "A modern Tetris, customizable finesse training webpage"],
	 ["mandelbrot", "Javascript Mandelbrot set visualization"]],
	[["install-wizard", "Rudimentary tkinter installer"],
	 ["jstris-plus", "Jstris+ storage for soundpacks I created"],
	 ["textbox", "A simple textbox, which can be used with pygame"],
	 ["2048", "2048 game, created in 1 hour. Maybe some bugs."],
	 ["smooth-movement", "A PyGame smooth x movement, which can be used to move a sprite with friction"],
	 ["camera-scrolling", "The camera follows the player, to make it stay in an area in the center of the screen"]]
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

	mult(a) {
		this.x *= a;
		this.y *= a;
	}
}

class Particle {
	constructor() {
		this.x = Math.random()*W;
		this.y = Math.random()*H;
		this.z = Math.random()*5;
		this.speed = Math.random()*10 + (3-this.z)**2;
		this.movement = new Vector2(1, 0);
		this.movement.rotate(Math.random()*2*Math.PI);

		let r = Math.random()*50;
		this.color = "rgb(" + (205 + r) + ", " + 205 + ", " + (255-r) + ")";
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
		let s = 2.5 - this.z/2;
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
		x = (0.5 - (mousePos[0]+window.scrollX*3)/W) * 50;
		y = (0.5 - (mousePos[1]+window.scrollY*3)/H) * 50;
		/* ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(this.x + x/this.z, this.y + y/this.z, s, 0, 2*Math.PI);
		ctx.fill(); */
		s *= 5;
		ctx.drawImage(stars[0], this.x + x/this.z - s, this.y + y/this.z - s, s*2, s*2);
	}
}

class MouseParticle {
	constructor() {
		let offset = this.getOffset();
		this.x = mousePos[0] - offset[0];
		this.y = mousePos[1] - offset[1];
		this.movement = new Vector2(mouseMove/10, 0);
		this.movement.rotate(Math.random()*2*Math.PI);
		this.z = Math.random()*3;
		this.spawn = Date.now()
	}

	getOffset() {
		let x = (0.5 - window.scrollX*3/W) * 50;
		let y = (0.5 - window.scrollY*3/H) * 50;
		return [x, y];
	}

	update() {
		// move
		this.movement.mult(0.99);
		this.x += this.movement.x/FPS;
		this.y += this.movement.y/FPS;

		// draw
		let offset = this.getOffset();
		let s = 7.5 - this.z*2.5;
		ctx.drawImage(stars[1], this.x + offset[0]/this.z - s, this.y + offset[1]/this.z - s, s*2, s*2);

		// despawn
		return (Date.now()-this.spawn > 3000);
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
		title.className = "slide";
		if (i == 0) {
			title.innerHTML = "<h2>GitHub Pages repositories</h2>";
		} else {
			title.innerHTML = "<h2>Other notable repositories</h2>";
		}
		document.body.appendChild(title);

		section = document.createElement("section");
		document.body.appendChild(section);
		for (let j = 0; j < repos[i].length; j++) {
			repo = repos[i][j];

			a = document.createElement("a");
			a.href = "https://github.com/d-002/" + repo[0];
			a.className = "button";
			a.innerHTML = `
			<img src="https://avatars.githubusercontent.com/u/69427207">
			<div>
				<h3>TITLE</h3>
				<p>DESC</p>
			</div>
			<div class="over-left"></div>`.replace("TITLE", repo[0]).replace("DESC", repo[1]);
			section.appendChild(a);
			
			a.style.animationDelay = "" + (2 + count/5) + "s";
			count++;
		}
	}
}

function sum(array) {
	let sum = 0;
	for (let i = 0; i < array.length; i++) {
		sum += array[i];
	}
	return sum;
}

function animate() {
	W = window.innerWidth;
	H = window.innerHeight;
	canvas.setAttribute("width", W);
	canvas.setAttribute("height", H);

	// get mouse pos and movement
	let move = new Vector2(mousePos[0]-prevPos[0], mousePos[1]-prevPos[1]);
	mouseMove = FPS * sum(prevMove) / prevMove.length;
	prevMove.push(move.length());
	prevMove.shift();
	prevPos = [...mousePos];

	// animate background
	let angle = (Date.now()-start)/1000*45;
	style.innerHTML = ":root{--background-angle: ANGLEdeg;}".replace("ANGLE", angle);

	// set up particles
	if (particles == undefined) {
		particles = [];
		for (let i = 0; i < 100; i++) {
			particles.push(new Particle());
		}
	}

	// add mouse particles (if mouseMove is 0, no particles will be created);
	if (Date.now() - lastParticle > 10000/mouseMove) {
		particles.push(new MouseParticle());
		lastParticle = Date.now();
	}

	// animate particles canvas
	ctx.clearRect(0, 0, W, H);
	let toRemove = []; // despawning particles
	for (let i = 0; i < particles.length; i++) {
		if (particles[i].update()) {
			toRemove.push(particles[i]);
		}
	}
	for (let i = 0; i < toRemove.length; i++) {
		particles.splice(particles.indexOf(toRemove[i]), 1);
	}
}

function init() {
	style = document.createElement("style");
	document.head.appendChild(style);

	canvas = document.getElementById("particles")
	ctx = canvas.getContext("2d");

	stars.push(document.getElementById("star"));
	stars.push(document.getElementById("mouse-star"));

	addRepos();

	setInterval(animate, 1000/FPS);
	document.addEventListener("mousemove", updateMousePos);
}