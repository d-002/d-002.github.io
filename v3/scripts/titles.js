class Typer {
    constructor(elt) {
        this.elt = elt;

        this.state = 0; // 0: typing, 1: erasing
        this.next_action = Date.now() + 1000;
        this.index = 0;
        this.text = "";
    }

    wait_short(now, is_erasing) {
        if (is_erasing)
            this.next_action = now + Math.random()*30 + 60;
        else
            this.next_action = now + Math.random()*80 + 20;
    }

    wait_long(now) {
        this.next_action = now + Math.random()*500 + 2000;
    }

    update() {
        const now = Date.now();

        if (now > this.next_action) {
            if (this.state === 0) {
                const target = titles[this.index];

                if (this.text === target) {
                    // start erasing
                    this.state = 1;
                    this.wait_long(now);
                }
                else {
                    // write a character
                    this.text += target[this.text.length];
                    this.elt.innerHTML = this.text;
                    this.wait_short(now, false);
                }
            }

            else {
                if (this.text.length) {
                    // erase a character
                    this.text = this.text.substring(0, this.text.length-1);
                    this.elt.innerHTML = this.text;
                    this.wait_short(now, true);
                }
                else {
                    // write a new title
                    this.index = (this.index+1) % titles.length;
                    this.state = 0;
                    this.wait_long(now);
                }
            }
        }
    }
}

const titles = [
    "Hi, I'm Léo!",
    "French Student",
    "Python enthusiast",
    "Graduating 2028",
    "Vim enjoyer",
    "I'm D_00 online",
    "Epita Student",
    "Computational redstoner"
];

const typer = new Typer(document.getElementById("subtitle"));
const title_interval = window.setInterval(() => typer.update(), 16);
