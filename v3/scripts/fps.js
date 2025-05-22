const storage_item = "fps";

function check_fps(input) {
    const output = parseInt(input) || 60;
    return output < 10 ? 10 : output > 1000 ? 1000 : output;
}

export function get_fps() {
    return check_fps(localStorage.getItem(storage_item));
}

export function set_fps(fps) {
    localStorage.setItem(storage_item, check_fps(fps));
}

export default function get_dtime() {
    return 1 / get_fps();
}
