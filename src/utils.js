/**
 * @param {Array<string>} array
 * @returns {Array<string>}
 **/
const trimArray = (array) =>
    array.filter((str) => typeof str == "string" && str.trim() !== "");

/**
 * @param {number} time
 * @returns {Promise<>}
 **/
const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));

/**
 * @param {number} start
 * @param {number} goal
 * @param {number} alpha
 * @returns {number}
 **/
const lerp = (start, goal, alpha) => start + (goal - start) * alpha;

/** @returns {number} **/
const semiBelievableDelay = () => lerp(527, 1354, Math.random());

/**
 * @template T
 * @param {Array<T>}
 * @returns {T}
 **/
const getRandomElementOfArray = (array) => {
    const index = Math.floor(Math.random() * array.length);
    if (index >= array.length) index = array.length - 1;
    return array[index];
};

/**
 * @param {Array} array
 * @returns {Array}
 **/
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * @param {any[]} args
 * @returns {string}
 */
function format(...args) {
    const f = args[0];
    let i = 1;

    if (typeof f !== "string") {
        if (args.length === 0) return "";
        return args
            .map((arg) =>
                typeof arg === "object" ? JSON.stringify(arg) : String(arg),
            )
            .join(" ");
    }

    if (args.length === 1) return f;

    let str = f.replace(/%[sdifjoO%]/g, (match) => {
        if (match === "%%") return "%";
        if (i >= args.length) return match;

        const val = args[i++];
        switch (match) {
            case "%s":
                return String(val);
            case "%d":
            case "%i":
                return String(parseInt(val, 10));
            case "%f":
                return String(parseFloat(val));
            case "%j":
                try {
                    return JSON.stringify(val);
                } catch (_) {
                    return "[Circular]";
                }
            case "%o":
            case "%O":
                try {
                    return JSON.stringify(val, null, 2);
                } catch (_) {
                    return String(val);
                }
            default:
                return match;
        }
    });

    while (i < args.length) {
        const val = args[i++];
        if (val === null || typeof val !== "object") {
            str += " " + val;
        } else {
            try {
                str += " " + JSON.stringify(val);
            } catch (_) {
                str += " " + String(val);
            }
        }
    }

    return str;
}

const letras = "ABCDE".split("");

// algo que poderia ser:
// export { trimArray, letras, format, shuffle, delay, lerp, semiBelievableDelay };

// vs como é:
const utils = {
    trimArray,
    letras,
    letters: letras,
    format,
    shuffle,
    delay,
    lerp,
    semiBelievableDelay,
};

// eu AMO WebExtensions 🥹✌️❤️
