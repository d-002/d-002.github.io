import vec3 from "/v3/scripts/vector3.js";

// in seconds
const delta_time = 1/60;
// speed at which the points react
const rotation_speed = .2;
// node spawn animation time
const spawn_anim_time = 1500;
// sphere radius with respect to the size of the screen
const sphere_radius = .45;
// degrees
const fov_deg = 60;
// distance to consider a node hovered
const hover_dist = 50;
// force strength when selecting a node
const front_force = 100;

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
        this.projected = [0, 0];

        this.spawn = spawn;
        this.active = false;

        this.hover = false;
        this.clicked = false;

        this.z = 0; // for sorting later
    }

    update(trig) {
        // spawn
        if (!this.active) {
            if (Date.now() > this.spawn) this.active = true;
            else return;
        }

        // movement
        let movement = new vec3(0, 0, 0);
        this.master.nodes.forEach(node => {
            if (node === this || !node.active) return;

            const diff = this.pos.sub(node.pos);
            const dist2 = diff.dot(diff);

            movement = movement.add(diff.mul(1/dist2));
        });

        if (this.clicked) {
            movement = movement.add(new vec3(
                -front_force * Math.sin(-this.master.camera.rotation),
                0,
                front_force * Math.cos(-this.master.camera.rotation)
            ));
        }

        this.pos = (this.pos.add(movement.mul(.1 * delta_time))).normalize();

        // rotation
        let rotated = new vec3(
            this.pos.x*trig[0] - this.pos.z*trig[1],
            this.pos.y,
            this.pos.x*trig[1] + this.pos.z*trig[0]
        );
        this.z = rotated.z;
        rotated = rotated.sub(this.master.camera.pos);

        // projection
        const m = this.master.camera.d / rotated.z;

        this.projected = [
            rotated.x*m + this.master.w*.5,
            -rotated.y*m + this.master.h*.5
        ];

    }

    draw() {
        if (!this.active) return;

        const now = Date.now();
        let scale = 20;
        // spawn scale animation
        scale *= now > this.spawn+spawn_anim_time ? 1 : (now-this.spawn) / spawn_anim_time;
        // 3d scale
        const cam_z = this.master.camera.pos.z;
        scale *= cam_z / (cam_z*2 - this.z);

        if (this.hover || this.clicked)
            this.master.ctx.fillStyle = "white";
        else {
            const r = 255 * (this.z+1)/2;
            this.master.ctx.fillStyle = "rgba(" + r + ", 0, " + (255-r) + ")";
        }
        this.master.ctx.beginPath();
        this.master.ctx.arc(this.projected[0], this.projected[1], scale, 0, 359);
        this.master.ctx.fill();
    }
}

function compare_nodes(a, b) {
    a = a.z;
    b = b.z;
    return a < b ? -1 : a > b ? 1 : 0;
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

    on_click() {
        this.nodes.forEach(node => { node.clicked = node.hover; });
    }

    update() {
        const rect = this.elt.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight)
            return;

        if (!this.is_init)
            this.init();

        // move and project nodes
        const trig = [Math.cos(this.camera.rotation), Math.sin(this.camera.rotation)];
        this.nodes.forEach(node => node.update(trig));
        this.nodes.sort(compare_nodes);

        // get if a node is being hovered
        let closest = null;
        let closest_dist = 0;
        if (mouse_pos[0] >= 0 && mouse_pos[0] < this.w &&
            mouse_pos[1] >= 0 && mouse_pos[1] < this.h)
            this.nodes.forEach(node => {
                const dx = mouse_pos[0] - node.projected[0];
                const dy = mouse_pos[1] - node.projected[1];
                const dist = Math.sqrt(dx*dx + dy*dy);

                // hover the node closest to the mouse,
                // first in projected coords then in depth
                if (closest != null && (dist > closest_dist ||
                    (dist == closest_dist && node.z <= closest.z)))
                    return;

                closest = node;
                closest_dist = dist;
            });

        if (closest != null && closest_dist > hover_dist) closest = null;

        this.nodes.forEach(node => { node.hover = node === closest });

        // camera rotation: slower if hovering a node
        let speed = rotation_speed;
        if (closest != null) speed *= Math.pow(closest_dist/hover_dist, 1.5);
        this.camera.rotation += speed * delta_time;

        // display section
        this.ctx.clearRect(0, 0, this.w, this.h);

        this.nodes.forEach(node => node.draw());
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

function get_mouse_pos(evt) {
    const rect = graph.elt.getBoundingClientRect();
    mouse_pos = [evt.x-rect.x, evt.y-rect.top];
}

const graph = new Graph(document.getElementById("languages").querySelector("canvas"));
let mouse_pos = [-1, -1];

window.addEventListener("resize", resize_handler);
graph.elt.addEventListener("mousemove", get_mouse_pos);
graph.elt.addEventListener("click", () => graph.on_click());

window.setInterval(() => graph.update(), 1000 * delta_time);
