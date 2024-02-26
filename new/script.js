let style, canvas, ctx;
let W, H;

// name, description, image (true / false)
let repos = [
	[["hardest", "Hardest game ever. Truly.", true, [217, 141, 141], false],
	 ["dumb-questions", "Dumb questions, website with about 99% CSS.", false, [237, 177, 38], true],
	 ["finesse", "A customizable Tetris finesse trainer", true, [228, 119, 241], true],
	 ["mandelbrot", "Javascript Mandelbrot set visualizer", true, [109, 163, 71], true],
	 ["hanoi", "Hanoi towers game", true, [193, 253, 249], true],
	 ["jstolist", "Javascript Eisenhower Matrix", true, [248, 248, 248], false]],
	[["dikc-8", "DIKC-8 and DIKC-8 2 Minecraft CPUs utilities", true, [239, 242, 239], false],
	 ["python", "Random small python projects I made", true, [230, 242, 245], false],
	 ["2048", "2048 game, created in 1 hour. Maybe some bugs.", true, [187, 173, 160], false],
	 ["maze", "Doom-like maze with randomly generated levels", true, [95, 105, 80], false],
	 ["cpp-renderer", "C++ 3D renderer, using SDL2", true, [187, 212, 255], false],
	 ["install-wizard", "Rudimentary tkinter installer", false, [192, 192, 192], true],
	 ["smooth-movement", "A PyGame smooth movement, which can be used to move a sprite with friction", false, [192, 192, 192], true],
	 ["camera-scrolling", "The camera follows the player, to make it stay in an area in the center of the screen", false, [192, 192, 192], true],
	 ["textbox", "A simple textbox, which can be used with pygame", false, [192, 192, 192], true],
	 ["jstris-plus", "Jstris+ storage for soundpacks I created", true, [229, 92, 191], true]]
	];

function multColor(col, m) {
	return "rgba(" + parseInt(col[0]*m) + ", " + parseInt(col[1]*m) + ", " + parseInt(col[2]*m) + ")";
}

function addRepos() {
	let sections = document.getElementsByTagName("section");
	for (let i = 0; i < 2; i++) {
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
			else A = multColor(col, 1), B = multColor(col, 0.8), C = multColor(col, 0.4), D = "#000", E = multColor(col, 0.3);
			block.style = "--bg1: "+A+"; --bg2: "+B+"; --border: "+C+"; --text1: "+D+"; --text2: "+E;
			block.innerHTML = `
<img src="SRC">
<div>
	<strong>TITLE</strong>
	<span>DESC</span>
</div>
`.replace("SRC", src).replace("TITLE", title).replace("DESC", desc);
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
