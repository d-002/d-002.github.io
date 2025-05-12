const storage_item = "profile";
const profile_names = ["low", "high", "ultra"];

function check_profile(input) {
    const output = parseInt(input) || 0;
    return output < 0 ? 0 : output > 2 ? 2 : output;
}

export function get_profile() {
    return check_profile(localStorage.getItem(storage_item));
}

export function set_profile(profile) {
    localStorage.setItem(storage_item, check_profile(profile));
}

export function apply_profile() {
    const profile = get_profile();

    profile_names.forEach(name => document.body.classList.remove(name));
    document.body.classList.add(profile_names[profile]);
}
