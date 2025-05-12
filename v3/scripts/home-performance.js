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
}

function cycle_profile() {
    set_profile((get_profile()[0]+1) % 3);
    apply_profile();
    set_profile_visual();
}

const perf_popup = document.getElementById("perf-popup");
const current_profile_elt = document.getElementById("current-profile");
document.getElementById("dismiss-perf").addEventListener("click", () => perf_popup.blur());
document.getElementById("cycle-profile").addEventListener("click", cycle_profile);

// check if just came from the benchmark, in this case open a popup
const from_benchmark = new URL(document.location.href).searchParams.get("from-benchmark") != null;

set_profile_visual();

if (from_benchmark)
    window.setTimeout(() => perf_popup.focus(), 1000);
