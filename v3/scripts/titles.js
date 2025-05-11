class Typer {
    constructor(elt) {
        this.elt = elt;

        this.state = 0; // 0: typing, 1: erasing
        this.index = 0;
        this.cursor = 0; // 0: normal mode, 1: insert mode, 2: visual line mode
        this.text = "";

        this.wait_long();
        this.update_cursor();

        // - typing animation:
        //  enter insert mode, then type, then go back to normal mode
        // - erasing animation:
        //  select everything, then delete all
    }

    wait_short() {
        this.next_action = Date.now() + Math.random()*80 + 20;
    }

    wait_mid() {
        this.next_action = Date.now() + Math.random()*50 + 200;
    }

    wait_long() {
        const base = this.text.length ? 2500 : 1500;
        this.next_action = Date.now() + Math.random()*500 + base;
    }

    update_cursor() {
        this.elt.className = ["normal", "insert", "visual"][this.cursor];
    }

    update_text() {
        this.elt.innerHTML = this.text;
    }

    update() {
        if (Date.now() > this.next_action) {
            if (this.state === 0) {
                const target = titles[this.index];

                if (this.text === target) {
                    if (this.cursor === 1) {
                        // go to normal mode
                        this.cursor = 0;
                        this.update_cursor();
                        this.wait_short();
                    }
                    else {
                        // start erasing
                        this.state = 1;
                        this.wait_long();
                    }
                }
                else {
                    if (this.cursor === 0) {
                        // go to insert mode
                        this.cursor = 1;
                        this.update_cursor();
                        this.wait_mid();
                    }
                    else {
                        // write a character
                        this.text += target[this.text.length];
                        this.update_text();
                        this.wait_short();
                    }
                }
            }

            else {
                if (this.cursor == 0) {
                    // select the whole line
                    this.cursor = 2;
                    this.update_cursor();
                    this.wait_mid();
                }
                else {
                    // delete the title
                    this.cursor = 0;
                    this.text = "";
                    this.update_cursor();
                    this.update_text();

                    // write a new title
                    this.index = (this.index+1) % titles.length;
                    this.state = 0;
                    this.wait_long();
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
