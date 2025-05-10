function create_style(keys, values) {
    let s = "";

    for (let i = 0, I = keys.length; i < I; i++) {
        if (i) s += ";";
        s += "--" + keys[i] + ":" + values[i];
    }

    return s;
}

class Gradient {
    constructor(angle, col1, col2) {
        this.angle = angle;
        this.colors = [col1, col2];
    }
}

class Flare {
    constructor(left, top, size, opacity, border_opacity, blur, border_blur, gradient) {
        // format arguments to strings
        this.pos = [left + "%", top + "%"];
        this.size = size + "px";
        this.opacity = [opacity, border_opacity];
        this.blur = [blur + "px", border_blur + "px"];
        this.gradient_angle = gradient.angle+"deg";
        this.gradient = gradient.colors.map(col => "#" + col.toString(16).padStart(6, '0'));
    }

    build(parent) {
        let transform = document.createElement("div");
        transform.className = "flare-transform";
        transform.style = create_style(["t", "l"], [this.pos[1], this.pos[0]]);

        let speed = Math.round(Math.random()*20 + 5) + "s";
        let direction = Math.random() < .5 ? "normal" : "reverse";

        let flare = document.createElement("div");
        flare.className = "flare";
        flare.style = create_style(
            ["s", "o1", "o2", "b1", "b2", "speed", "direction", "angle", "bg1", "bg2"],
            [this.size, ...this.opacity, ...this.blur, speed, direction, this.gradient_angle, ...this.gradient]
        );

        let border = document.createElement("div");
        border.className = "flare-border";

        flare.appendChild(border);
        transform.appendChild(flare);
        parent.appendChild(transform);
    }
}

let data = [
    new Flare(40, 5, 700, .5, .7, 20, 0, new Gradient(90, 0x19130b, 0x3f2a18)),
    new Flare(41, 74, 600, .1, .1, 50, 10, new Gradient(90, 0x19130b, 0x3f2a18)),
    new Flare(17, 87, 500, .8, .9, 20, 0, new Gradient(135, 0x231e2f, 0x090c4b)),
    new Flare(87, 9, 200, .5, .7, 40, 30, new Gradient(135, 0x66cfe7, 0x66c9de)),
    new Flare(7, 52, 250, .5, .7, 10, 0, new Gradient(135, 0x332446, 0x21284f)),
    new Flare(53, 49, 600, .2, .15, 20, 5, new Gradient(135, 0x7d6970, 0x6b5376)),
    new Flare(78, 64, 800, .6, .9, 30, 0, new Gradient(10, 0x1e1c3d, 0x876c78))
];

let container = document.getElementById("flare-container-inner");

data.forEach(flare => flare.build(container));
