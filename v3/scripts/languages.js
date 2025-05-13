import vec3 from "/v3/scripts/vector3.js";

// in seconds
const delta_time = 1/60;
// speed at which the points react
const rotation_speed = .5;
// node spawn animation time
const spawn_anim_time = 1500;
// sphere radius with respect to the size of the screen
const sphere_radius = .45;
// degrees
const fov_deg = 60;

class Camera {
    constructor() {
        this.pos = new vec3(0, 0, 0); // dummy, will be changed later
        this.d = 0;
        this.rotation = 0;

        this.fov = fov_deg * Math.PI / 180;
    }

    set_d(screen_size) {
        this.d = -screen_size * .5 / Math.tan(this.fov/2);
        this.pos.z = Math.cos(this.fov/2) / Math.tan(this.fov/2) * .5 / sphere_radius + Math.sin(this.fov/2);
    }
}

class Node {
    constructor(master, spawn) {
        this.master = master;
        this.pos = new vec3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1).normalize();

        this.spawn = spawn;
        this.active = false;
    }

    update() {
        if (!this.active) {
            if (Date.now() > this.spawn) this.active = true;
            else return;
        }

        let movement = new vec3(0, 0, 0);
        this.master.nodes.forEach(node => {
            if (node === this || !node.active) return;

            const diff = this.pos.sub(node.pos);
            const dist2 = diff.dot(diff);

            movement = movement.add(diff.mul(1/dist2));
        });

        this.pos = (this.pos.add(movement.mul(.1 * delta_time))).normalize();
    }

    draw(trig) {
        if (!this.active) return;

        const rotated = new vec3(
            this.pos.x*trig[0] - this.pos.z*trig[1],
            this.pos.y,
            this.pos.x*trig[1] + this.pos.z*trig[0]
        ).sub(this.master.camera.pos);

        const m = this.master.camera.d / rotated.z;

        const projected = [
            rotated.x*m + this.master.w*.5,
            -rotated.y*m + this.master.h*.5
        ];

        const now = Date.now();
        let scale = now > this.spawn+spawn_anim_time ? 1 : (now-this.spawn) / spawn_anim_time;
        scale *= 5;

        this.master.ctx.fillStyle = "#fff";
        this.master.ctx.beginPath();
        this.master.ctx.arc(projected[0], projected[1], scale, 0, 359);
        this.master.ctx.fill();
    }
}

class Graph {
    constructor(elt) {
        this.is_init = false;
        this.elt = elt;
        this.ctx = elt.getContext("2d");

        this.nodes = [];

        this.camera = new Camera();
    }

    init() {
        this.is_init = true;
        this.on_resize();

        let delay = Date.now();
        for (let i = 0; i < 20; i++) {
            this.nodes.push(new Node(this, delay));
            delay += 300;
        }
    }

    on_resize() {
        const rect = this.elt.getBoundingClientRect();
        this.w = rect.width;
        this.h = rect.height;
        this.elt.width = this.w;
        this.elt.height = this.h;

        this.camera.set_d(Math.min(this.w, this.h));
    }

    update() {
        const rect = this.elt.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight)
            return;

        if (!this.is_init)
            this.init();

        this.camera.rotation += rotation_speed * delta_time;

        this.nodes.forEach(node => node.update());

        this.ctx.clearRect(0, 0, this.w, this.h);

        const trig = [Math.cos(this.camera.rotation), Math.sin(this.camera.rotation)];
        this.nodes.forEach(node => node.draw(trig));
    }
}

// don't resize every frame, wait a little to prevent lag from multiple resizes
let target_time;
function resizer(time) {
    if (target_time == time) graph.on_resize();
}

function resize_handler() {
    const time = Date.now();
    target_time = time;
    window.setTimeout(resizer, 100, time);
}

const graph = new Graph(document.getElementById("languages").querySelector("canvas"));

window.addEventListener("resize", resize_handler);

window.setInterval(() => graph.update(), 1000 * delta_time);
