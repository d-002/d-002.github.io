import get_dtime from "/v3/scripts/fps.js";
import is_active from "/v3/scripts/sleep.js";

// in seconds
const delta_time = get_dtime();
// from 0 to 1
const target_y = .38;

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

function get_percentage() {
    const rect = tiles_elt.getBoundingClientRect();
    const scroll = target_y - rect.top / window.innerHeight;
    const t = scroll * window.innerHeight / rect.height;
    return t < 0 ? 0 : t > 1 ? 100 : t*100; 
}

function is_tile_lower(tile) {
    const rect = tile.getBoundingClientRect();
    return rect.top + rect.height/2 > target_y * window.innerHeight;
}

function update() {
    if (!is_active(education_elt)) return;

    // update point position
    const percent = get_percentage();
    point.update(percent);

    line.style = "--top: " + point.pos + "%";

    // update tiles
    const to_remove = [];
    let i = -1;
    inactive_tiles.forEach(tile => {
        i++;
        if (tile.classList.contains("active")) return;
        if (is_tile_lower(tile)) return;

        tile.classList.add("active");
        to_remove.unshift(i);
    });
    to_remove.forEach(i => inactive_tiles.splice(i, 1));
}

const education_elt = document.getElementById("education");
const tiles_elt = education_elt.querySelector(".tiles-container");
const line = education_elt.querySelector(".line");

const point = new SmoothPoint(get_percentage());
const inactive_tiles = Array.from(tiles_elt.children);

window.setInterval(update, 1000 * delta_time);
