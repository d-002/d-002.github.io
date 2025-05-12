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

const graph = new Graph(document.getElementById("languages").querySelector("canvas"));

window.addEventListener("scroll", scroll_handler);
window.addEventListener("resize", () => graph.on_resize());
scroll_handler();

const interval = window.setInterval(() => graph.update(), 0.17);
