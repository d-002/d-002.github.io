let style, canvas, ctx;
let particles, W, H;
let FPS = 60;
let start = Date.now();

let mousePos = [0, 0];
let prevPos = [0, 0]; // position of the mouse last frame
let mouseMove = 0;
let prevMove = []; // movement over last few frames
for (let i = 0; i < FPS; i++) {
	prevMove.push(0);
}

let stars = [];
let lastParticle = start;

let musics = [];
let audioReady = 0; // number of audio files ready to be played
let volumes = [0, 0, 0];

// name, description, image (true / false)
let repos = [
	[["hardest", "Hardest game ever. Truly.", true],
	 ["dumb-questions", "Dumb questions, website with about 99% CSS.", false],
	 ["finesse", "A modern Tetris, customizable finesse training webpage", true],
	 ["mandelbrot", "Javascript Mandelbrot set visualization", true],
	 ["hanoi", "Hanoi towers game", true],
	 ["jstolist", "Javascript Eisenhower Matrix", true]],
	[["dikc-8", "DIKC-8 and DIKC-8 2 Minecraft CPUs utilities", true],
	 ["python", "Random small python projects I made", true],
	 ["2048", "2048 game, created in 1 hour. Maybe some bugs.", true],
	 ["maze", "Doom-like maze with randomly generated levels", true],
	 ["cpp-renderer", "C++ 3D renderer, using SDL2", true],
	 ["install-wizard", "Rudimentary tkinter installer", false],
	 ["smooth-movement", "A PyGame smooth movement, which can be used to move a sprite with friction", false],
	 ["camera-scrolling", "The camera follows the player, to make it stay in an area in the center of the screen", false],
	 ["textbox", "A simple textbox, which can be used with pygame", false],
	 ["jstris-plus", "Jstris+ storage for soundpacks I created", true]]
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

class BaseParticle {
	getOffset() {
		// returns offset that is only applied to the display position
		let x = -(mousePos[0]/2 + window.scrollX*5) / W * 50;
		let y = -(mousePos[1]/2 + window.scrollY*5) / H * 50;
		return [x, y];
	}

	getDisplay() {
		let space = 10; // room around the window
		let offset = this.getOffset();

		// at the start, scroll down
		let progress = (Date.now()-start) / 4000;
		if (progress <= 1) {
			offset[1] += 3000 * (1+Math.cos(progress*Math.PI))**2 / 4;
		}

		let x = this.x + offset[0]*2/this.z**2 + space;
		let y = this.y + offset[1]*2/this.z**2 + space;
		let w = W + 2*space;
		let h = H + 2*space;

		return [(x % w + w) % w - space, (y % h + h) % h - space];
	}
}

class Particle extends BaseParticle {
	constructor() {
		super();
		this.x = Math.random()*W;
		this.y = Math.random()*H;
		this.z = Math.random()*5 + 1;

		this.speed = Math.random()*10 + (6-this.z)**2;
		this.movement = new Vector2(1, 0);
		this.movement.rotate(Math.random()*2*Math.PI);
	}
	
	update() {
		// move away from mouse the faster it gets
		let pos = this.getDisplay();
		let toMouse = new Vector2(pos[0]-mousePos[0], pos[1]-mousePos[1]);
		let power = 0.5/toMouse.length(); // let's pretend the length will never be 0
		toMouse.normalize();

		let x = toMouse.x*mouseMove*power;
		let y = toMouse.y*mouseMove*power;

		this.x += (this.movement.x+x) * this.speed / FPS;
		this.y += (this.movement.y+y) * this.speed / FPS;

		let s = 15/this.z;
		pos = this.getDisplay();
		ctx.drawImage(stars[0], pos[0]-s, pos[1]-s, s*2, s*2);
	}
}

class MouseParticle extends BaseParticle {
	constructor() {
		super();
		this.x = mousePos[0];
		this.y = mousePos[1];
		this.z = Math.random()*5 + 1;

		// substract the offset to spawn where the mouse is
		let offset = this.getOffset();
		this.x -= offset[0]*2/this.z**2;
		this.y -= offset[1]*2/this.z**2;

		this.movement = new Vector2(mouseMove/10, 0);
		this.movement.rotate(Math.random()*2*Math.PI);

		this.spawn = Date.now()
	}

	update() {
		// move
		this.movement.mult(0.99);
		this.movement.y += 10/FPS;
		this.x += this.movement.x/FPS;
		this.y += this.movement.y/FPS;

		// draw
		let delay = Date.now()-this.spawn;
		let s = 15/this.z;
		if (delay > 2000) {
			// shrink before despawning
			s *= 1 - (delay-2000)/1000;
		}
		let pos = this.getDisplay();
		ctx.drawImage(stars[1], pos[0] - s, pos[1] - s, s*2, s*2);

		// despawn
		return (delay > 3000);
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
			title.innerHTML = "<h2><strong>GitHub Pages repositories</strong> - go visit them now!</h2>";
		} else {
			title.innerHTML = "<h2><strong>Other repositories</strong></h2>";
		}
		document.body.appendChild(title);

		section = document.createElement("section");
		document.body.appendChild(section);
		for (let j = 0; j < repos[i].length; j++) {
			repo = repos[i][j];

			a = document.createElement("a");
			a.href = "https://github.com/d-002/" + repo[0];
			a.className = "button";
			
			let name;
			if (i == 0) {
				name = '<a href="' + a.href + '">' + repo[0] + "</a>";
				a.href = "https://d-002.github.io/" + repo[0];
			}
			else name = repo[0];

			let src;
			if (repo[2]) {
				src = "/v1/images/repos/" + repo[0] + ".png";
			} else {
				src = "https://avatars.githubusercontent.com/u/69427207";
			}
			a.innerHTML = `
			<img src="SRC">
			<div>
				<h3>NAME</h3>
				<p>DESC</p>
			</div>
			<div class="over-left"></div>`.replace("SRC", src).replace("NAME", name).replace("DESC", repo[1]);
			section.appendChild(a);
			
			a.style.animationDelay = "" + (2 + count/5) + "s";
			count++;
		}
	}

	let footer = document.createElement("div");
	footer.id = "footer";
	document.body.appendChild(footer);
}

function sum(array) {
	let sum = 0;
	for (let i = 0; i < array.length; i++) {
		sum += array[i];
	}
	return sum;
}

function update() {
	animate();
	handleMusic();
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
	} else {
		// add mouse particles (if mouseMove is 0, no particles will be created);
		if (Date.now() - lastParticle > 10000/mouseMove) {
			particles.push(new MouseParticle());
			lastParticle = Date.now();
		}
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

function handleMusic() {
	if (audioReady != -1) {
		return; // don't update sounds if not yet playing
	}

	let n;
	if (mouseMove > 2000) {
		n = 2;
	} else if (mouseMove > 200) {
		n = 1;
	} else {
		n = 0;
	}

	// update volume
	for (let i = 0; i < 3; i++) {
		if (i > n) {
			// slowly fade out
			volumes[i] = Math.max(volumes[i] - 0.2/FPS, 0);
		} else {
			// fade in
			volumes[i] = Math.min(volumes[i] + 1/FPS, 1);
		}
		musics[i].volume = volumes[i];
	}
}

function startMusic() {
	if (audioReady == 3) {
		for (let i = 0; i < 3; i++) {
			musics[i].play();
		}

		audioReady = -1;
		document.getElementById("info-music").parentElement.remove();
		window.removeEventListener("click", startMusic);
	}
}

function init() {
	style = document.createElement("style");
	document.head.appendChild(style);

	canvas = document.getElementById("particles");
	ctx = canvas.getContext("2d");

	stars.push(document.getElementById("star"));
	stars.push(document.getElementById("mouse-star"));

	addRepos();

	for (let i = 0; i < 3; i++) {
		let audio = document.createElement("audio");
		audio.src = "/v1/music/" + (i+1) + ".mp3";
		audio.loop = true;
		document.body.appendChild(audio);

		audio.addEventListener("canplaythrough", () => {if (audioReady != -1) {audioReady++}});
		musics.push(audio);
	}

	setInterval(update, 1000/FPS);
	document.addEventListener("mousemove", updateMousePos);
	document.addEventListener("click", startMusic);
}
