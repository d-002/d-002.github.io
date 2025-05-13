export default class vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    length() {
        return Math.sqrt(this.dot(this));
    }

    normalize() {
        const m = 1/this.length();
        return new vec3(this.x*m, this.y*m, this.z*m);
    }

    add(v) {
        if (v instanceof vec3)
            return new vec3(this.x+v.x, this.y+v.y, this.z+v.z);
        return new vec3(this.X+v, this.y+v, this.z+v);
    }

    sub(v) {
        if (v instanceof vec3)
            return new vec3(this.x-v.x, this.y-v.y, this.z-v.z);
        return new vec3(this.X-v, this.y-v, this.z-v);
    }

    dot(v) {
        return this.x*v.x + this.y*v.y + this.z*v.z;
    }

    mul(a) {
        return new vec3(this.x*a, this.y*a, this.z*a);
    }
}

