import { apply_profile } from "/v3/scripts/performance-utils.js";
apply_profile();

function scroll_handler() {
    const rect = flares_container.getBoundingClientRect();
    const target = rect.bottom > 0 && rect.top < window.innerHeight;

    if (visible != target) {
        visible = target;
        flares_container.className = visible ? null : "sleeping";
    }
}

let visible = true;
const flares_container = document.getElementById("flare-container");
document.addEventListener("scroll", scroll_handler);
