const tolerance = .1; // percent of the page height

class ScrollElt {
    constructor(elt) {
        this.elt = elt;
        this.scroll_start = elt.getAttribute("scroll-start");
        this.scroll_stop = elt.getAttribute("scroll-stop");

        this.visible = !this.elt.classList.contains("disappear");
        this.hide_elt();
    }

    set_animation(previous, next) {
        this.elt.classList.remove(previous);
        this.elt.offsetHeight; // reflow
        this.elt.classList.add(next);
    }

    show_elt() {
        if (this.visible) return;

        // for elements that need to bee hidden on page load, remove this state now
        if (this.elt.classList.contains("hidden"))
            this.elt.classList.remove("hidden");

        this.set_animation("disappear", "appear");
        this.visible = true;
    }

    hide_elt() {
        if (!this.visible) return;
        this.set_animation("appear", "disappear");
        this.visible = false;
    }

    update() {
        const rect = this.elt.getBoundingClientRect();

        const target = 
            rect.bottom > tolerance * window.innerHeight &&
            rect.top < (1-tolerance) * window.innerHeight;

        if (target != this.visible) {
            if (target) this.show_elt();
            else this.hide_elt();
        }
    }
}

function scroll_handler() {
    elts.forEach(elt => elt.update(scrollY));

    // special behavior for the Scroll to top button
    if (window.scrollY > 10 && !to_top.visible)
        to_top.show_elt();
    else if (window.scrollY <= 10 && to_top.visible)
        to_top.hide_elt();
}

const elts = Array.from(document.querySelectorAll(".animate-on-scroll")).map(elt => new ScrollElt(elt));
const to_top = new ScrollElt(document.getElementById("to-top"));

const scroll_listener = window.addEventListener("scroll", scroll_handler);
scroll_handler(); // force update on load to make sure the already visible elements are animated
