class Graph {
    constructor(elt) {
        this.is_init = false;
        this.elt = elt;
        this.ctx = elt.getContext("2d");
    }

    init() {
        this.is_init = true;
        this.on_resize();
    }

    on_resize() {
        const rect = this.elt.getBoundingClientRect();
        this.w = rect.width;
        this.h = rect.height;
        this.elt.width = this.w;
        this.elt.height = this.h;
    }

    update() {
    }
}

function scroll_handler() {
    if (graph.is_init) return;

    const rect = graph.elt.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight)
        graph.init();
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

window.addEventListener("scroll", scroll_handler);
window.addEventListener("resize", resize_handler);
scroll_handler();

const interval = window.setInterval(() => graph.update(), 0.17);
