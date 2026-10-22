export function toMs(time, unit) {
    switch (unit) {
        case "seconds":
            return time * 1000;
        case "minutes":
            return time * 1000 * 60;
        case "hours":
            return time * 1000 * 60 * 60;
        case "days":
            return time * 1000 * 60 * 60 * 24;
        default:
            return time;
    }
}

export function toSeconds(time, unit) {
    switch (unit) {
        case "milliseconds":
            return Math.floor(time / 1000);
        case "minutes":
            return time * 60;
        case "hours":
            return time * 60 * 60;
        case "days":
            return time * 60 * 60 * 24;
        default:
            return time;
    }
}

export function addTime(time, unit, from = new Date()) {
    return new Date(from.getTime() + toMs(time, unit));
}
