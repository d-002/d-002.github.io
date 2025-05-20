import { set_profile } from "/v3/scripts/performance-utils.js";
import { set_fps } from "/v3/scripts/fps.js";

function complete_test() {
    document.location.href = "/v3?from-benchmark=1";
}

function skip() {
    logs = ["Skipping benchmark..."];
    set_profile(0); // low profile
    complete_test();
}

function verdict() {
    set_profile((final_framerate[0] > 70) + (final_framerate[0]/final_framerate[1] < 1.5));
    set_fps(final_framerate[0]);
    complete_test();
}

function add_lag() {
    const rand = () => Math.round(Math.random()*100) + "%";

    for (let i = 0; i < 20; i++) {
        const elt = document.createElement("div");
        elt.style = "--t: " + rand() + "; --l: " + rand();
        lag.appendChild(elt);
    }
}

function show_logs() {
    info.innerHTML = logs.join("<br>");
}

function update() {
    // get monitor framerate
    new Promise(resolve =>
        requestAnimationFrame(t1 =>
            requestAnimationFrame(t2 => resolve(1000 / (t2 - t1)))
        )
    ).then(fps => {
        fps = Math.round(fps);

        // only store the framerate value when it is stable
        prev_fps.shift();
        prev_fps.push(fps);
        const average = prev_fps.reduce((a, b) => a+b, 0) / prev_fps.length;
        const variance = prev_fps.reduce((sum, elt) => sum + Math.pow(elt-average, 2), 0) / prev_fps.length;
        const deviation = Math.sqrt(variance).toFixed(2);

        if (deviation < 5) {
            final_framerate[state] = fps;
            if (++state == 1) {
                // reset fps values
                for (let i = 0, I = prev_fps.length; i < I; i++) prev_fps[i] = 0;

                // add lag
                add_lag();
            }
            if (state == 2) verdict();
        }

        // update logs
        logs = [];
        if (final_framerate[0] == null)
            logs.push("Reading framerate: " + fps + " fps, deviation " + deviation);
        else {
            logs.push("Final framerate: " + final_framerate[0] + " fps");

            if (final_framerate[1] == null)
                logs.push("Testing peak performance: " + fps + " fps");
            else
                logs.push("Peak performance tested. Redirecting...");
        }
        show_logs();

        // check again next frame if needed
        if (state < 2)
            window.setTimeout(update, 0);
    });
}

let prev_fps = Array(50);
let final_framerate = [null, null];
let state = 0; // 0: testing normal framerate, 1: with gradient background, 2: done

let logs = ["Waiting..."];
show_logs();
const lag_elt = document.getElementById("lag");
const info_elt = document.getElementById("info");
document.getElementById("skip").addEventListener("click", skip);

window.setTimeout(update, 1000);
