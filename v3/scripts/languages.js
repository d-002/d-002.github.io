import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import is_active from "/v3/scripts/sleep.js";

const rotationSpeed = .1;
let prevTime = -1;
const maxDt = .1;
// node animation times (ms)
const animDuration = { spawn: 1500, showHide: 500 };
const innerDelay = { spawn: 150, showHide: 30 };
const fovDeg = 60;
// force strength when selecting a node
const frontForce = 30;
// radius of the sphere
const sphereRadius = 5;
// margin around the sphere, in units
const margin = 1;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-1, -1);

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
        this.nextActive = true;
        this.animationName = "spawn";

        this.active = false;
        this.hover = false;
        this.clicked = false;
    }

    // get the node's sprite scale depending on the animation as well as update
    // its active state when the animation is done playing
    getScale() {
        if (this.active != this.nextActive) {
            const now = Date.now();
            const duration = animDuration[this.animationName];
            let t = (now - this.anim_time) / duration;

            // avoid weird scaling for planned hide animations
            if (t < 0)
                t = 0;

            if (t < 1) {
                if (!this.nextActive)
                    t = 1-t;

                return smoothstep(t);
            }

            this.active = this.nextActive;
        }

        return this.active ? 1 : 0;
    }

    // returns true if an action was made, false otherwise
    show(anim_time) {
        if (this.nextActive) return false;

        this.anim_time = anim_time;
        this.nextActive = true;

        return true;
    }

    hide(anim_time) {
        if (!this.nextActive) return false;

        this.anim_time = anim_time;
        this.nextActive = false;

        // from now on, use the faster animation
        this.animationName = "showHide";

        return true;
    }

    update(dt) {
        // animations
        const s = this.getScale();
        this.sprite.scale.set(s, s, 1);
        this.material.color.setScalar(this.hover ? 2 : 1);

        // movement
        const movement = new THREE.Vector3(0, 0, 0);
        this.master.nodes.forEach(node => {
            if (node === this) return;

            const diff = new THREE.Vector3().subVectors(this.pos, node.pos);
            let dist2 = diff.dot(diff);
            if (dist2 == 0)
                dist2 = 1;

            const mul = node.getScale() / dist2;
            movement.add(diff.multiplyScalar(mul));
        });

        if (this.clicked) {
            movement.add(this.master.camera.position.clone().sub(this.pos).multiplyScalar(frontForce * dt));
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

        // updated when hovering to change the speed
        this.speedMultiplier = 1;

        let delay = Date.now();
        Object.entries(this.data).forEach(([key, value]) => {
            const node = new Node(this, delay, key, value.image, value.type);
            this.group.add(node.sprite);
            this.nodes.push(node);
            delay += innerDelay.spawn;
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
        let nodeEntry = null;
        this.nodes.forEach(node => {
            if (!node.active)
                return;

            node.clicked = node.hover;
            if (node.clicked)
                nodeEntry = node.id;
        });

        let entry;
        if (nodeEntry == null)
            entry = {
                "title": "",
                "description": "Select an element in the graph to discover " +
                "more about it"
            };
        else entry = this.data[nodeEntry];

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
                delay += innerDelay.showHide;

            node.hover = false;
        });

        // deselect everything
        this.onClick();
    }

    getHovered() {
        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObjects(this.scene.children);
        return intersects.length > 0
            ? intersects[0].object.userData.node
            : null;
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
            if (!this.is_init)
                this.init();

            const hovered = this.getHovered();

            this.nodes.forEach(node => { node.hover = node === hovered });

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
            this.speedMultiplier = ((hovered == null ? 1 : 0)
                + this.speedMultiplier * 10) / 11;
            this.camera.rotation.y += rotationSpeed * this.speedMultiplier * dt;
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

    const type = Array.from(evt.target.parentNode.children)
        .indexOf(evt.target) - 1;
    graph.updateVisible(type);

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
