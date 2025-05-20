import get_dtime from "/v3/scripts/fps.js";
import is_active from "/v3/scripts/sleep.js";

// in seconds
const delta_time = get_dtime();

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
    const scroll = .38 - rect.top / window.innerHeight;
    const t = scroll * window.innerHeight / rect.height;
    return t < 0 ? 0 : t > 1 ? 100 : t*100; 
}

function update() {
    if (!is_active(education_elt)) return;

    const percent = get_percentage();
    point.update(percent);

    line.style = "--top: " + point.pos + "%";
}

const education_elt = document.getElementById("education");
const tiles_elt = education_elt.querySelector(".tiles-container");
const line = education_elt.querySelector(".line");

const point = new SmoothPoint(get_percentage());

window.setInterval(update, 1000 * delta_time);
