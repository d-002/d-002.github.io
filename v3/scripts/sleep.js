export default function is_active(elt) {
    const rect = elt.getBoundingClientRect();
    return rect.bottom >= 0 && rect.top <= self.innerHeight;
}
