const smoothstep = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

export default class SmoothValue {
    constructor(startValue, duration = 1000) {
        this.startValue = startValue;
        this.endValue = startValue;

        // times are in milliseconds
        this.duration = duration;
        this.startTime = 0;
    }

    transitionTo(value, duration = null, delay = null) {
        if (value === this.endValue)
            return;

        this.startValue = this.get().value;
        this.endValue = value;

        this.duration = duration == null ? this.duration : duration;
        this.startTime = Date.now() + (delay == null ? 0 : delay);

        return this;
    }


    set(value) {
        this.startValue = value;
        this.endValue = value;

        return this;
    }

    getT() {
        const t = (Date.now() - this.startTime) / this.duration;
        return t < 0 ? 0 : t > 1 ? 1 : smoothstep(t);
    }

    get() {
        let t = this.getT();

        // check if the animation stopped playing
        const done = t >= 1;
        if (done) {
            t = 0;
            this.startValue = this.endValue;
        }

        const value = this.startValue + (this.endValue - this.startValue) * t;
        const changed = value != this.endValue;

        return { value: value, changed: changed, done: done };
    }
}
