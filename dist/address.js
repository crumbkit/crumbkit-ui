// Filter state held in the page address. A codec reads the fields it defines
// from a query string and writes them back, leaving out every field that
// holds its default, so a shared link carries only what the reader chose.
// It reads and writes only the string the app passes and stores nothing.
/** A field that holds one of `values`, and `fallback` for any other text. */
export function oneOf(values, fallback) {
    return {
        fallback,
        read: (raw) => values.find((each) => each === raw),
        write: (value) => (value === fallback ? undefined : value),
    };
}
/**
 * A field that holds any of `values`, written as one key with commas, such
 * as "state=fail,warn". It reads them in the order `values` lists them,
 * once each, and drops a value it does not know. The default holds none.
 */
export function manyOf(values) {
    const known = (raw) => values.filter((each) => raw.includes(each));
    return {
        fallback: [],
        read: (raw) => known(raw.split(",")),
        write: (value) => {
            const kept = known(value);
            return kept.length === 0 ? undefined : kept.join(",");
        },
    };
}
/** A field that holds any text, such as a search, and `fallback` when the address lacks it. */
export function text(fallback = "") {
    return {
        fallback,
        read: (raw) => raw,
        write: (value) => (value === fallback ? undefined : value),
    };
}
/** A field that names one item, such as the selected rule, or null when the address names none. */
export function id() {
    return {
        fallback: null,
        read: (raw) => (raw === "" ? undefined : raw),
        write: (value) => (value === null || value === "" ? undefined : value),
    };
}
/** Returns `raw` decoded as a form encodes it, or undefined when it is not valid percent-encoding. */
function decode(raw) {
    try {
        return decodeURIComponent(raw.replaceAll("+", " "));
    }
    catch {
        return undefined;
    }
}
/** Returns each key of `search` with every text given for it, in order. */
function entries(search) {
    const found = new Map();
    const query = search.startsWith("?") ? search.slice(1) : search;
    for (const pair of query.split("&")) {
        if (pair === "")
            continue;
        const at = pair.indexOf("=");
        const key = decode(at === -1 ? pair : pair.slice(0, at));
        const value = decode(at === -1 ? "" : pair.slice(at + 1));
        if (key === undefined || value === undefined)
            continue;
        found.set(key, [...(found.get(key) ?? []), value]);
    }
    return found;
}
/**
 * Returns the codec of `fields`. A field the address lacks, names twice or
 * gives a value it does not know takes its default. `format` writes the
 * fields in the order `fields` defines them, except that a key that is a
 * number, such as "2", comes first, because a JavaScript object lists such
 * keys first and the order they were written in is lost.
 */
export function defineAddress(fields) {
    // A field's type is erased here, because a key and its field travel
    // together and each field reads and writes only its own value.
    const list = Object.entries(fields);
    return {
        parse: (search) => {
            const found = entries(search);
            const value = {};
            for (const [key, field] of list) {
                const raw = found.get(key);
                const read = raw?.length === 1 && raw[0] !== undefined ? field.read(raw[0]) : undefined;
                value[key] = read === undefined ? field.fallback : read;
            }
            return fromRecord(value);
        },
        format: (value) => {
            const values = value;
            const parts = [];
            for (const [key, field] of list) {
                const written = field.write(values[key]);
                if (written !== undefined) {
                    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(written).replaceAll("%2C", ",")}`);
                }
            }
            return parts.length === 0 ? "" : `?${parts.join("&")}`;
        },
    };
}
/** Returns `record` as the codec's value type, which its fields built key by key. */
function fromRecord(record) {
    // biome-ignore lint/nursery/noUnsafeTypeAssertion: parse fills every key of V with its field's value.
    return record;
}
