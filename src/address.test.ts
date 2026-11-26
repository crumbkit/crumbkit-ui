import { describe, expect, it } from "vitest";
import { defineAddress, id, manyOf, oneOf, text } from "./address.ts";

const states = ["fail", "warn", "pass"] as const;

const codec = defineAddress({
  view: oneOf(["rules", "repositories"], "rules"),
  state: manyOf(states),
  q: text(""),
  rule: id(),
});

type Value = ReturnType<typeof codec.parse>;

const defaults: Value = { view: "rules", state: [], q: "", rule: null };

describe("defineAddress", () => {
  it("reads an empty address as every field's default", () => {
    expect(codec.parse("")).toEqual(defaults);
    expect(codec.parse("?")).toEqual(defaults);
  });

  it("gives back every field kind after a format and a parse", () => {
    const values: Value[] = [
      defaults,
      { view: "repositories", state: ["fail"], q: "", rule: null },
      { view: "rules", state: ["fail", "pass"], q: "node & go = 100%", rule: "toolchains/node" },
      { view: "repositories", state: ["fail", "warn", "pass"], q: "a+b, c", rule: "x y" },
    ];
    for (const value of values) {
      expect(codec.parse(codec.format(value))).toEqual(value);
    }
  });

  it("leaves defaults out of the address and writes the fields in the order they were defined", () => {
    expect(codec.format(defaults)).toBe("");
    expect(
      codec.format({ rule: "r1", q: "go", state: ["pass", "fail"], view: "repositories" }),
    ).toBe("?view=repositories&state=fail,pass&q=go&rule=r1");
  });

  it("gives a field its default when the address holds a value it does not know", () => {
    expect(codec.parse("?view=charts")).toEqual(defaults);
    expect(codec.parse("?rule=")).toEqual(defaults);
  });

  it("gives a field its default when the address names it twice", () => {
    expect(codec.parse("?view=repositories&view=rules")).toEqual(defaults);
    expect(codec.parse("?q=a&q=b&rule=r1")).toEqual({ ...defaults, rule: "r1" });
  });

  it("drops a value of a many field that it does not know and keeps the rest in their defined order", () => {
    expect(codec.parse("?state=pass,maybe,fail,pass")).toEqual({
      ...defaults,
      state: ["fail", "pass"],
    });
  });

  it("ignores keys it does not define and text it cannot decode", () => {
    expect(codec.parse("?page=2&view=repositories")).toEqual({ ...defaults, view: "repositories" });
    expect(codec.parse("?q=%E0%A4%A&view=repositories")).toEqual({
      ...defaults,
      view: "repositories",
    });
  });

  it("reads a plus sign as a space, as a form writes it", () => {
    expect(codec.parse("?q=node+go").q).toBe("node go");
  });
});
