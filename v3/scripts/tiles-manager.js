import get_dtime from "/v3/scripts/fps.js";
import is_active from "/v3/scripts/sleep.js";

// in seconds
const delta_time = get_dtime();
// from 0 to 1
const target_y = .62;

class SmoothPoint {
    constructor(pos) {
        this.pos = pos;
        this.movement = 0;
    }

    update(target) {
        this.pos += this.movement * delta_time;
        this.movement *= .8; // drag
        this.movement += (target-this.pos)/2;
    }
}

function get_percentage(parent) {
    const rect = parent.getBoundingClientRect();
    const scroll = target_y - rect.top / window.innerHeight;
    const t = scroll * window.innerHeight / rect.height;
    return t < 0 ? 0 : t > 1 ? 100 : t*100; 
}

function is_tile_lower(tile) {
    const rect = tile.getBoundingClientRect();
    return rect.top + rect.height/2 > target_y * window.innerHeight;
}

class TilesManager {
    constructor(parent) {
        this.parent = parent;

        this.tiles_elt = parent.querySelector(".tiles-container");
        this.line = parent.querySelector(".line");

        this.point = new SmoothPoint(get_percentage(parent));
        this.inactive_tiles = Array.from(this.tiles_elt.children);
    }

    start() {
        this.interval = window.setInterval(() => this.update(), 1000 * delta_time);
    }

    update() {
        if (!is_active(this.parent)) return;

        // update point position
        const percent = get_percentage(this.parent);
        this.point.update(percent);

        this.line.style = "--top: " + this.point.pos + "%";

        // update tiles
        const to_remove = [];
        let i = -1;
        this.inactive_tiles.forEach(tile => {
            i++;
            if (tile.classList.contains("active")) return;
            if (is_tile_lower(tile)) return;

            tile.classList.add("active");
            to_remove.unshift(i);
        });
        to_remove.forEach(i => this.inactive_tiles.splice(i, 1));
    }
}

const education = new TilesManager(document.getElementById("education"));

education.start();
