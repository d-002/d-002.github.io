import { profile_names, get_profile, set_profile, apply_profile } from "/v3/scripts/performance-utils.js";
if (!apply_profile()) document.location.href = "/v3/benchmark";

// ----- flare section optimization

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

// ----- popup settings

function set_profile_visual() {
    const name = profile_names[get_profile()[0]];
    current_profile_elt.textContent = "Current profile: " + name.charAt(0).toUpperCase() + name.substring(1);

    set_popup_size();
}

function cycle_profile() {
    set_profile((get_profile()[0]+1) % 3);
    apply_profile();
    set_profile_visual();
}

const perf_popup = document.getElementById("perf-popup");
const current_profile_elt = document.getElementById("current-profile");
document.getElementById("dismiss-perf").addEventListener("click", () => { perf_popup.className = ""; });
document.getElementById("cycle-profile").addEventListener("click", cycle_profile);

// check if just came from the benchmark, in this case open a popup
const from_benchmark = new URL(document.location.href).searchParams.get("from-benchmark") != null;

set_profile_visual();

if (from_benchmark)
    window.setTimeout(() => { perf_popup.className = "focus"; }, 1000);

// ----- fix popup hover animation
function set_popup_size() {
    // trigger reflow, to avoid previous size values from being used
    perf_popup.style = "";
    perf_popup.offsetWidth;

    const rect = perf_popup.children[1].children[0].getBoundingClientRect();
    perf_popup.style = "--w: " + rect.width + "px; --h: " + rect.height + "px";
}

function resize_handler() {
    set_popup_size();
}

document.addEventListener("resize", resize_handler);
resize_handler();
