import { describe, expect, it } from "vitest";
import { type Direction, filterRows, groupRows, nextSort, rollUp, sortRows } from "./table.ts";

type Figure = { command: string; runs: number | null; p95: number | null; counted: boolean };

function figure(command: string, runs: number | null, p95: number | null): Figure {
  return { command, runs, p95, counted: true };
}

// The rows of Flightdeck's sortedRows tests: a command the figures do not
// count goes last, then a row with no figure for the key.
const figures: Figure[] = [
  figure("books show", 5, 90),
  figure("books add", null, null),
  figure("books list", 9, null),
  figure("loans list", 5, 40),
  { command: "about", runs: null, p95: null, counted: false },
];

function order(key: "command" | "runs" | "p95", direction: Direction): string[] {
  const counted = {
    value: (row: Figure) => (row.counted ? 0 : 1),
    direction: "ascending",
  } as const;
  const by = {
    value: (row: Figure) => (key === "command" ? row.command : row[key]),
    direction,
  };
  return sortRows(figures, [counted, by], (row) => row.command).map((row) => row.command);
}

describe("sortRows", () => {
  it("sorts by runs, most first, with ties in the caller's key order", () => {
    expect(order("runs", "descending")).toEqual([
      "books list",
      "books show",
      "loans list",
      "books add",
      "about",
    ]);
  });

  it("puts a row with no value last in either direction", () => {
    expect(order("p95", "descending")).toEqual([
      "books show",
      "loans list",
      "books add",
      "books list",
      "about",
    ]);
    expect(order("p95", "ascending")).toEqual([
      "loans list",
      "books show",
      "books add",
      "books list",
      "about",
    ]);
  });

  it("sorts text in either direction", () => {
    expect(order("command", "ascending")).toEqual([
      "books add",
      "books list",
      "books show",
      "loans list",
      "about",
    ]);
    expect(order("command", "descending")).toEqual([
      "loans list",
      "books show",
      "books list",
      "books add",
      "about",
    ]);
  });

  it("keeps rows that tie on every key and on the tie key in their given order", () => {
    const rows = [
      { id: "b", n: 1 },
      { id: "a", n: 1 },
      { id: "c", n: 1 },
    ];
    const sorted = sortRows(rows, [{ value: (row) => row.n, direction: "descending" }], () => "");
    expect(sorted.map((row) => row.id)).toEqual(["b", "a", "c"]);
  });

  it("leaves the rows it was given unchanged", () => {
    const rows = [figure("b", 1, 1), figure("a", 2, 2)];
    sortRows(rows, [{ value: (row) => row.runs, direction: "descending" }], (row) => row.command);
    expect(rows.map((row) => row.command)).toEqual(["b", "a"]);
  });
});

describe("nextSort", () => {
  const first = (key: string): Direction => (key === "command" ? "ascending" : "descending");

  it("flips the direction when the same column is chosen again", () => {
    expect(nextSort({ key: "runs", direction: "descending" }, "runs", first)).toEqual({
      key: "runs",
      direction: "ascending",
    });
    expect(nextSort({ key: "runs", direction: "ascending" }, "runs", first)).toEqual({
      key: "runs",
      direction: "descending",
    });
  });

  it("gives a newly chosen column its first direction", () => {
    expect(nextSort({ key: "runs", direction: "ascending" }, "command", first)).toEqual({
      key: "command",
      direction: "ascending",
    });
    expect(nextSort({ key: "command", direction: "ascending" }, "p95", first)).toEqual({
      key: "p95",
      direction: "descending",
    });
  });
});

describe("filterRows", () => {
  it("keeps the rows that pass every test, in their order", () => {
    const rows = [1, 2, 3, 4, 5, 6];
    expect(filterRows(rows, [(n) => n % 2 === 0, (n) => n > 2])).toEqual([4, 6]);
    expect(filterRows(rows, [])).toEqual(rows);
  });
});

describe("groupRows", () => {
  type Rule = { id: string; languages: string[] };
  const rules: Rule[] = [
    { id: "node", languages: ["typescript"] },
    { id: "licence", languages: ["rust", "typescript"] },
    { id: "rust", languages: ["rust"] },
    { id: "none", languages: [] },
  ];

  it("lists a row in two groups under both and counts it once in the total", () => {
    const grouped = groupRows(rules, (rule) => rule.languages);
    expect(grouped.groups).toEqual([
      { key: "typescript", rows: [rules[0], rules[1]] },
      { key: "rust", rows: [rules[1], rules[2]] },
    ]);
    expect(grouped.total).toBe(3);
  });

  it("puts the groups in the caller's order, then any others in the order they first appear", () => {
    const grouped = groupRows(rules, (rule) => rule.languages, ["rust", "go"]);
    expect(grouped.groups.map((group) => group.key)).toEqual(["rust", "typescript"]);
  });

  it("lists a row once in a group that it names twice", () => {
    const grouped = groupRows([{ id: "x", languages: ["go", "go"] }], (rule) => rule.languages);
    expect(grouped.groups).toEqual([{ key: "go", rows: [{ id: "x", languages: ["go", "go"] }] }]);
    expect(grouped.total).toBe(1);
  });
});

describe("rollUp", () => {
  const worstFirst = ["fail", "warn", "pass"] as const;

  it("gives the worst state by the caller's ranking", () => {
    expect(rollUp(["pass", "warn", "pass"], worstFirst)).toBe("warn");
    expect(rollUp(["pass", "fail", "warn"], worstFirst)).toBe("fail");
    expect(rollUp(["pass"], worstFirst)).toBe("pass");
  });

  it("gives nothing for no states", () => {
    expect(rollUp([], worstFirst)).toBeUndefined();
  });
});
