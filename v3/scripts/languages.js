import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import is_active from "/v3/scripts/sleep.js";

const rotationSpeed = .1;
let prevTime = -1;
const maxDt = .1;
// node animation times (ms)
const animDuration = { spawn: 1500, showHide: 500 };
const fovDeg = 60;
// force strength when selecting a node
const frontForce = 100;
// radius of the sphere
const sphereRadius = 5;
// margin around the sphere, in units
const margin = 1;

const raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

function onMouseMove(evt) {
    const rect = graph.elt.getBoundingClientRect();
    mouse.x = (evt.clientX - rect.left) / rect.width * 2 - 1;
    mouse.y = -(evt.clientY - rect.top) / rect.height * 2 + 1;
}

const smoothstep = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

const container = document.getElementById("languages");
const titleElt = container.querySelector("h3");
const descriptionElt = container.querySelector("p");
const ul = container.querySelector("ul");

class Node {
    constructor(master, anim_time, id, image, type) {
        this.texture = new THREE.TextureLoader().load(image);
        this.texture.colorSpace = THREE.SRGBColorSpace;
        this.material = new THREE.SpriteMaterial({map: this.texture});
        this.sprite = new THREE.Sprite(this.material);
        this.pos = new THREE.Vector3(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1).normalize().multiplyScalar(sphereRadius);

        this.sprite.userData = {node: this};

        this.master = master;
        this.anim_time = anim_time;
        this.id = id;
        this.type = type;
        this.next_state = true;
        this.animation_name = "spawn";

        this.active = false;
        this.hover = false;
        this.clicked = false;
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

        // from now on, use the faster animation
        this.animation_name = "showHide";

        return true;
    }

    update(dt) {
        // movement
        let movement = new THREE.Vector3(0, 0, 0);
        this.master.nodes.forEach(node => {
            if (node === this || !node.active) return;

            const diff = new THREE.Vector3().subVectors(this.pos, node.pos);
            let dist2 = diff.dot(diff);
            if (dist2 == 0)
                dist2 = 1;

            movement = movement.add(diff.multiplyScalar(1/dist2));
        });

        if (this.clicked) {
            movement = movement.add(new THREE.Vector3(
                -frontForce * Math.sin(-this.master.rotation),
                0,
                frontForce * Math.cos(-this.master.rotation)
            ));
        }

        // update position
        this.pos = this.pos.add(movement.multiplyScalar(sphereRadius * dt));
        this.pos = this.pos.normalize().multiplyScalar(sphereRadius);
        this.sprite.position.set(this.pos.x, this.pos.y, this.pos.z);
    }
}

class Graph {
    constructor(data) {
        this.scene = new THREE.Scene();
        // aspect ratio and position will be set in this.init
        this.camera = new THREE.PerspectiveCamera(fovDeg, null, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});

        this.elt = this.renderer.domElement;
        this.elt.id = "three";
        this.elt.className = "light-container animate-on-scroll";
        container.insertBefore(this.elt, container.firstChild);

        this.is_init = false;
        this.data = data;

        this.nodes = [];
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // base position, before rotation and shift
        this.pos = new THREE.Vector3(0, 0, 0);
        this.distance = 0;
        this.rotation = 0;

        let delay = Date.now();
        Object.entries(this.data).forEach(([key, value]) => {
            const node = new Node(this, delay, key, value.image, value.type);
            this.group.add(node.sprite);
            this.nodes.push(node);
            delay += 300;
        });

        // this will trigger invisible animations for things that are hidden,
        // which shouldn't matter, and the animations for nodes to be shown will
        // be ignored
        this.updateVisible(0);
    }

    init() {
        this.is_init = true;
        this.onResize();
    }

    getScale() {
    }

    onResize() {
        // update resolution
        const rect = this.elt.getBoundingClientRect();
        this.w = rect.width;
        this.h = rect.height;

        this.camera.aspect = this.w / this.h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.w, this.h);

        const fovRad = (this.camera.fov * Math.PI) / 180;
        const d = (sphereRadius + margin) / Math.sin(fovRad / 2);
        this.distance = d;
    }

    onClick() {
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
                "description": "Select an element in the graph to discover " +
                "more about it"
            };
        else entry = this.data[node_entry];

        titleElt.textContent = entry.title;
        descriptionElt.textContent = entry.description;
    }

    updateVisible(type) {
        let delay = Date.now();

        // update ul
        let i = -1;
        Array.from(ul.children).forEach(
            li => li.className = i++ == type ? "selected" : "");

        // update nodes
        this.nodes.forEach(node => {
            const action = type === -1 || type == node.type
                ? node.show(delay)
                : node.hide(delay);

            // only show a delay for affected nodes,
            // don't delay because of hidden ones
            if (action)
                delay += 30;

            node.hover = false;
        });

        // deselect everything
        this.onClick();
    }

    // returns the hovered node as well as a scalar between 0 and 1
    // (0 is "completely" hovered, while 1 is no hover)
    getHovered() {
        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObjects(this.scene.children);
        if (intersects.length > 0) {
            const sprite = intersects[0].object;
            const hovered = sprite.userData.node;

            const worldPos = new THREE.Vector3();
            sprite.getWorldPosition(worldPos);
            const edgePos = worldPos.clone().add(new THREE.Vector3(.5, 0, 0));

            const projected = worldPos.project(this.camera);
            const radius = projected.distanceTo(edgePos.project(this.camera));

            const dist = mouse.distanceTo(
                new THREE.Vector2(projected.x, projected.y)) / radius;
            console.log(mouse, projected, dist);

            return [hovered, dist];
        }

        return [null, 1];
    }

    update() {
        requestAnimationFrame(() => this.update());

        const now = Date.now();
        if (prevTime == -1)
            prevTime = now;
        let dt = (now - prevTime) / 1000;
        if (dt > maxDt)
            dt = maxDt;

        if (is_active(this.elt)) {
            const [hovered, dist] = this.getHovered();

            this.nodes.forEach(node => { node.hover = node === hovered });

            if (!this.is_init)
                this.init();

            // compute final camera variables after revolution
            const trig = [
                Math.cos(-this.camera.rotation.y),
                Math.sin(-this.camera.rotation.y)];
            const pos = new THREE.Vector3(
                this.pos.x,
                this.pos.y,
                this.pos.z + this.distance);
            pos.set(
                pos.x*trig[0] - pos.z*trig[1],
                pos.y,
                pos.x*trig[1] + pos.z*trig[0]
            );

            // camera rotation: slower if hovering a node
            const speed = rotationSpeed * Math.pow(dist, 1.5);
            this.camera.rotation.y += speed * dt;
            this.camera.position.set(pos.x, pos.y, pos.z);

            // update and render
            this.nodes.forEach(node => node.update(dt));
            this.renderer.render(this.scene, this.camera);
        }

        prevTime = now;
    }
}

// don't resize every frame, wait a little to prevent lag from multiple resizes
let targetTime;
function resizer(time) {
    if (targetTime == time) graph.onResize();
}

function resizeHandler() {
    const time = Date.now();
    targetTime = time;
    self.setTimeout(resizer, 100, time);
}

function onUlClick(evt) {
    if (evt.target.tagName.toUpperCase() != "LI") return;

    graph.updateVisible(
        Array.from(evt.target.parentNode.children).indexOf(evt.target) - 1);

    // update ul
    let i = -1;
    Array.from(ul.children).forEach(
        li => li.className = i++ == type ? "selected" : "");
}

let graph;
fetch("/v3/languages.json")
    .then(response => response.json())
    .then(response => {
        graph = new Graph(response);
        graph.update();

        self.addEventListener("resize", resizeHandler);
        graph.elt.addEventListener("click", () => graph.onClick());
        graph.elt.addEventListener("mousemove", onMouseMove);
        ul.addEventListener("click", onUlClick);
    });

/*
// in seconds
const delta_time = get_dtime();
const rotation_speed = .2;
// node animation times (ms)
const anim_duration = { spawn: 1500, showHide: 500 };
const fov_deg = 60;
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
        this.animation_name = "spawn";

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

        this.animation_name = "showHide"; // from now on, use the faster animation

        return true;
    }

    update(trig) {
        // show/hide animation
        if (this.active != this.next_state) {
            // hide the nodes after their hiding animation to prevent them from freezing
            const delay = this.next_state ? 0 : anim_duration[this.animation_name];

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
        const duration = anim_duration[this.animation_name];
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
        this.onResize();

        let delay = Date.now();
        Object.entries(this.data).forEach(([key, value]) => {
            this.nodes.push(new Node(this, delay, key, value.image, value.type));
            delay += 300;
        });

        // this will trigger invisible animations for things that are hidden, which shouldn't matter
        // and the animations for nodes to be shown will be ignored
        this.updateVisible(0);
    }

    onResize() {
        const rect = this.canvas.getBoundingClientRect();
        this.w = rect.width;
        this.h = rect.height;
        this.canvas.width = this.w;
        this.canvas.height = this.h;

        const min_size = Math.min(this.w, this.h)
        this.image_scale = min_size * .05;
        this.camera.set_d(min_size);
    }

    onClick() {
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

    updateVisible(type) {
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
        this.onClick();
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
        let dist = 0;
        if (mousePos[0] >= 0 && mousePos[0] < this.w &&
            mousePos[1] >= 0 && mousePos[1] < this.h)
            this.nodes.forEach(node => {
                const dx = mousePos[0] - node.projected[0];
                const dy = mousePos[1] - node.projected[1];
                const dist = Math.sqrt(dx*dx + dy*dy);

                // hover the node closest to the mouse,
                // first in projected coords then in depth
                if (closest != null && (dist > dist ||
                    (dist == dist && node.z <= closest.z)))
                    return;

                closest = node;
                dist = dist;
            });

        if (closest != null && dist > hoverDist) closest = null;

        this.nodes.forEach(node => { node.hover = node === closest });

        // camera rotation: slower if hovering a node
        let speed = rotation_speed;
        if (closest != null) speed *= Math.pow(dist/hoverDist, 1.5);
        this.camera.rotation += speed * delta_time;

        // display section
        this.ctx.clearRect(0, 0, this.w, this.h);

        this.nodes.forEach(node => node.draw());
    }
}

// don't resize every frame, wait a little to prevent lag from multiple resizes
let targetTime;
function resizer(time) {
    if (targetTime == time) graph.onResize();
}

function resizeHandler() {
    const time = Date.now();
    targetTime = time;
    self.setTimeout(resizer, 100, time);
}

function get_mouse_pos(evt) {
    const rect = graph.canvas.getBoundingClientRect();
    mousePos = [evt.x-rect.x, evt.y-rect.top];
}

function onUlClick(evt) {
    if (evt.target.tagName.toUpperCase() != "LI") return;

    graph.updateVisible(Array.from(evt.target.parentNode.children).indexOf(evt.target) - 1);
}

let mousePos = [-1, -1];
let graph;
const container = document.getElementById("languages");
const canvas = container.querySelector("canvas");
const title_elt = container.querySelector("h3");
const description_elt = container.querySelector("p");
const ul = container.querySelector("ul");

fetch("/v3/languages.json")
    .then(response => response.json())
    .then(data => {
        Object.values(data).forEach(value => {
            const image = new Image("img");
            image.src = value.image;
            value.image = image;
        });

        graph = new Graph(canvas, data);

        self.addEventListener("resize", resizeHandler);
        canvas.addEventListener("click", () => graph.onClick());
        canvas.addEventListener("mousemove", get_mouse_pos);
        ul.addEventListener("click", onUlClick);

        self.setInterval(() => graph.update(), 1000 * delta_time);
    });
*/
