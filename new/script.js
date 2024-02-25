let style, canvas, ctx;
let W, H;

// name, description, image (true / false)
let repos = [
	[["hardest", "Hardest game ever. Truly.", true, "#fff"],
	 ["dumb-questions", "Dumb questions, website with about 99% CSS.", false, "#fff"],
	 ["finesse", "A modern Tetris, customizable finesse training webpage", true, "#fff"],
	 ["mandelbrot", "Javascript Mandelbrot set visualization", true, "#fff"],
	 ["hanoi", "Hanoi towers game", true, "#fff"],
	 ["jstolist", "Javascript Eisenhower Matrix", true, "#fff"]],
	[["dikc-8", "DIKC-8 and DIKC-8 2 Minecraft CPUs utilities", true, "#fff"],
	 ["python", "Random small python projects I made", true, "#fff"],
	 ["2048", "2048 game, created in 1 hour. Maybe some bugs.", true, "#fff"],
	 ["maze", "Doom-like maze with randomly generated levels", true, "#fff"],
	 ["cpp-renderer", "C++ 3D renderer, using SDL2", true, "#fff"],
	 ["install-wizard", "Rudimentary tkinter installer", false, "#fff"],
	 ["smooth-movement", "A PyGame smooth movement, which can be used to move a sprite with friction", false, "#fff"],
	 ["camera-scrolling", "The camera follows the player, to make it stay in an area in the center of the screen", false, "#fff"],
	 ["textbox", "A simple textbox, which can be used with pygame", false, "#fff"],
	 ["jstris-plus", "Jstris+ storage for soundpacks I created", true, "#fff"]]
	];

function addRepos() {
	let sections = document.getElementsByTagName("section");
	for (let i = 0; i < 2; i++) {
		for (let j = 0; j < repos[i].length; j++) {
			repo = repos[i][j];

			let title = repo[0], desc = repo[1], col = repo[3];
			let src;
			if (repo[2]) {
				src = "images/repos/" + repo[0] + ".png";
			} else {
				src = "https://avatars.githubusercontent.com/u/69427207";
			}

			let block = document.createElement("div");
			block.className = "block";
			block.innerHTML = "".replace("SRC", src).replace("TITLE", title).replace("DESC", desc).replace("COL", col);
			sections[i].appendChild(block);
		}
	}
}

function init() {
	style = document.createElement("style");
	document.head.appendChild(style);

	let W = window.innerWidth;
	let H = window.innerHeight;
	canvas = document.getElementById("canvas");
	canvas.setAttribute("width", W);
	canvas.setAttribute("height", H);
	ctx = canvas.getContext("2d");

	addRepos();
}
