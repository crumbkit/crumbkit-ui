// Sorting, filtering and grouping the rows of a table. Every function takes
// the rows and returns new ones, and leaves the rows it was given unchanged.
/** Returns the rows that pass every one of `tests`, in their order. */
export function filterRows(rows, tests) {
    return rows.filter((row) => tests.every((test) => test(row)));
}
function compareValues(left, right) {
    if (typeof left === "number" && typeof right === "number")
        return left - right;
    return String(left).localeCompare(String(right), "en");
}
/**
 * Returns `rows` sorted by each of `keys` in turn. A row with no value for a
 * key goes after every row with one, in either direction. Rows that tie on
 * every key go in the order of `tie`, such as their names, and rows that tie
 * on that too keep their given order.
 */
export function sortRows(rows, keys, tie) {
    return [...rows].sort((a, b) => {
        for (const key of keys) {
            const left = key.value(a);
            const right = key.value(b);
            if (left === null || right === null) {
                const missing = Number(left === null) - Number(right === null);
                if (missing !== 0)
                    return missing;
                continue;
            }
            const order = compareValues(left, right);
            if (order !== 0)
                return key.direction === "ascending" ? order : -order;
        }
        return tie(a).localeCompare(tie(b), "en");
    });
}
/**
 * Returns the sort after the reader chooses the column `key`. Choosing the
 * sorted column again flips its direction. A newly chosen column takes the
 * direction `firstDirection` gives it, such as names A to Z and figures
 * most first.
 */
export function nextSort(current, key, firstDirection) {
    if (key === current.key) {
        return { key, direction: current.direction === "ascending" ? "descending" : "ascending" };
    }
    return { key, direction: firstDirection(key) };
}
/**
 * Returns `rows` grouped by the keys `groupsOf` gives each row. A row in
 * several groups shows under each of them, and once in the total. A row in
 * no group shows nowhere. The groups go in the order of `order`, then any
 * others in the order they first appear; a group with no rows is left out.
 */
export function groupRows(rows, groupsOf, order = []) {
    const groups = new Map(order.map((key) => [key, []]));
    let total = 0;
    for (const row of rows) {
        const keys = new Set(groupsOf(row));
        if (keys.size > 0)
            total += 1;
        for (const key of keys) {
            const group = groups.get(key);
            if (group === undefined)
                groups.set(key, [row]);
            else
                group.push(row);
        }
    }
    return {
        groups: [...groups]
            .filter(([, members]) => members.length > 0)
            .map(([key, members]) => ({ key, rows: members })),
        total,
    };
}
/**
 * Returns the worst of `states` by `worstFirst`, which lists every state
 * from the worst to the best, or undefined when there are no states.
 */
export function rollUp(states, worstFirst) {
    let worst;
    for (const state of states) {
        const rank = worstFirst.indexOf(state);
        if (rank !== -1 && (worst === undefined || rank < worst))
            worst = rank;
    }
    return worst === undefined ? undefined : worstFirst[worst];
}
