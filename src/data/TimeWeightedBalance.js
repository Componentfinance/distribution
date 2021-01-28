/* global BigInt */
export default class TimeWeightedBalance {
    lastSeen;
    current;
    acc;

    constructor(startingBalance, startBlockNumber) {
        this.acc = BigInt(0)
        this.current = startingBalance
        this.lastSeen = startBlockNumber
    }

    add(amount, now) {
        this._update(amount, now);
        this.current += amount
    }

    _add(amount, now) {
        this.lastSeen = now
        this.current += amount
    }

    _sub(amount, now) {
        this.lastSeen = now
        this.current -= amount
    }

    sub(amount, now) {
        this._update(amount, now);
        this.current -= amount
    }

    _update(amount, now) {
        if (now < this.lastSeen) {
            throw new Error("downTime")
        }
        const timePast = now - this.lastSeen;
        this.acc += this.current * BigInt(timePast)
        this.lastSeen = now
    }

    finalize(now) {
        const timePast = now - this.lastSeen;
        return this.acc + this.current * BigInt(timePast)
    }
}