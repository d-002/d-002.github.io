import vec3 from "/v3/scripts/vector3.js";
import is_active from "/v3/scripts/sleep.js";
import get_dtime from "/v3/scripts/fps.js";

// in seconds
const delta_time = get_dtime();
// speed at which the points react
const rotation_speed = .2;
// node animation times (ms): show/hide, spawn
const anim_duration = [1500, 500];
// sphere radius with respect to the size of the screen
const sphere_radius = .45;
// degrees
const fov_deg = 60;
// distance to consider a node hovered
const hover_dist = 50;
// force strength when selecting a node
const front_force = 100;

const smoothstep = x => (3 - 2*x) * x * x;

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
    constructor(master, anim_time, entry, image, type) {
        this.master = master;
        this.entry = entry;
        this.image = image;
        this.type = type;

        this.anim_time = anim_time;
        this.next_state = true;
        this.animation_index = 0;

        this.pos = new vec3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1).normalize();
        this.projected = [0, 0];

        this.active = false;

        this.hover = false;
        this.clicked = false;

        this.z = 0; // for sorting later
    }

    // returns true if an action was made, false otherwise
    show(anim_time) {
        if (this.next_state) return false;

        this.anim_time = anim_time;
        this.next_state = true;

        return true;
    }

    hide(anim_time) {
        if (!this.next_state) return false;

        this.anim_time = anim_time;
        this.next_state = false;

        this.animation_index = 1; // from now on, use the faster animation

        return true;
    }

    update(trig) {
        // show/hide animation
        if (this.active != this.next_state) {
            // hide the nodes after their hiding animation to prevent them from freezing
            const delay = this.next_state ? 0 : anim_duration[this.animation_index];

            if (Date.now() > this.anim_time + delay) this.active = this.next_state;
        }
        if (!this.active) return;

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

        let scale = this.master.image_scale;
        // animation scale
        const now = Date.now();
        const duration = anim_duration[this.animation_index];
        if (now <= this.anim_time+duration) {
            let t = (now-this.anim_time) / duration;
            if (t < 0) t = 0; // avoid weird scaling for planned hide animations
            if (!this.next_state) t = 1-t;

            scale *= smoothstep(t);
        }
        // 3d scale
        const cam_z = this.master.camera.pos.z;
        scale *= 1 / (1 - this.z/cam_z);
        // hover scale
        if (this.hover || this.clicked) scale *= 1.05;

        // draw image
        const brightness = this.clicked ? 1.5 : this.hover ? 1.2 : 1;
        this.master.ctx.filter = "brightness(" + brightness + ")";

        try {
            this.master.ctx.drawImage(
                this.image,
                this.projected[0]-scale, this.projected[1]-scale,
                scale*2, scale*2
            );
        } catch {}
    }
}

function compare_nodes(a, b) {
    a = a.z;
    b = b.z;
    return a < b ? -1 : a > b ? 1 : 0;
}

class Graph {
    constructor(canvas, data) {
        this.is_init = false;
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.data = data;

        this.nodes = [];

        this.camera = new Camera();
    }

    init() {
        this.is_init = true;
        this.on_resize();

        let delay = Date.now();
        Object.entries(this.data).forEach(([key, value]) => {
            this.nodes.push(new Node(this, delay, key, value.image, value.type));
            delay += 300;
        });

        // this will trigger invisible animations for things that are hidden, which shouldn't matter
        // and the animations for nodes to be shown will be ignored
        this.update_visible(0);
    }

    on_resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.w = rect.width;
        this.h = rect.height;
        this.canvas.width = this.w;
        this.canvas.height = this.h;

        const min_size = Math.min(this.w, this.h)
        this.image_scale = min_size * .05;
        this.camera.set_d(min_size);
    }

    on_click() {
        let node_entry = null;
        this.nodes.forEach(node => {
            if (!node.active) return;

            node.clicked = node.hover;
            if (node.clicked) node_entry = node.entry;
        });

        let entry;
        if (node_entry == null)
            entry = {
                "title": "",
                "description": "Select an element in the graph to discover more about it"
            };
        else entry = this.data[node_entry];

        title_elt.textContent = entry.title;
        description_elt.textContent = entry.description;
    }

    update_visible(type) {
        let delay = Date.now();

        // update ul
        let i = -1;
        Array.from(ul.children).forEach(li => li.className = i++ == type ? "selected" : "");

        // update nodes
        this.nodes.forEach(node => {
            let action;
            if (type === -1 || type == node.type) action = node.show(delay);
            else action = node.hide(delay);
            
            // only show a delay for affected nodes, don't delay because of hidden ones
            if (action) delay += 30;

            node.hover = false;
        });

        // deselect everything
        this.on_click();
    }

    update() {
        if (!is_active(this.canvas)) return;

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
    const rect = graph.canvas.getBoundingClientRect();
    mouse_pos = [evt.x-rect.x, evt.y-rect.top];
}

function on_ul_click(evt) {
    if (evt.target.tagName.toUpperCase() != 'LI') return;

    graph.update_visible(Array.from(evt.target.parentNode.children).indexOf(evt.target) - 1);
}

let mouse_pos = [-1, -1];
let graph;
const container = document.getElementById("languages");
const canvas = container.querySelector("canvas");
const title_elt = container.querySelector("h3");
const description_elt = container.querySelector("p");
const ul = container.querySelector("ul");

fetch('/v3/languages.json')
    .then(response => response.json())
    .then(data => {
        Object.values(data).forEach(value => {
            const image = new Image("img");
            image.src = value.image;
            value.image = image;
        });

        graph = new Graph(canvas, data);

        window.addEventListener("resize", resize_handler);
        canvas.addEventListener("click", () => graph.on_click());
        canvas.addEventListener("mousemove", get_mouse_pos);
        ul.addEventListener("click", on_ul_click);

        window.setInterval(() => graph.update(), 1000 * delta_time);
    });
