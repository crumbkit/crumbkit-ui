import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, useEffect, useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { defineAddress, manyOf, oneOf } from "./address.ts";
import { useAddressState, useFocusReturn, useGrid, usePressed, useSortHeader } from "./react.ts";
import type { Direction, Sort } from "./table.ts";

const codec = defineAddress({
  view: oneOf(["rules", "repositories"], "rules"),
  state: manyOf(["fail", "pass"]),
});

function AddressView({ search, navigate }: { search: string; navigate: (s: string) => void }) {
  const [value, change] = useAddressState(codec, { search, navigate });
  return (
    <>
      <p>view {value.view}</p>
      <p>state {value.state.join(" ")}</p>
      <button type="button" onClick={() => change({ view: "repositories" })}>
        Repositories
      </button>
      <button type="button" onClick={() => change({ view: "rules", state: [] })}>
        Reset
      </button>
      <button
        type="button"
        onClick={() => {
          change({ view: "repositories" });
          change({ state: ["pass"] });
        }}
      >
        Both
      </button>
    </>
  );
}

describe("useAddressState", () => {
  it("reads its value from the search the app passes", () => {
    render(<AddressView search="?view=repositories&state=pass" navigate={() => undefined} />);
    expect(screen.getByText("view repositories")).toBeInTheDocument();
    expect(screen.getByText("state pass")).toBeInTheDocument();
  });

  it("navigates to the address of a change and keeps the other fields", async () => {
    const navigate = vi.fn();
    render(<AddressView search="?state=fail" navigate={navigate} />);
    await userEvent.click(screen.getByRole("button", { name: "Repositories" }));
    expect(navigate).toHaveBeenLastCalledWith("?view=repositories&state=fail");
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(navigate).toHaveBeenLastCalledWith("");
  });

  it("applies every change made in one handler, each on top of the last", async () => {
    const navigate = vi.fn();
    render(<AddressView search="" navigate={navigate} />);
    await userEvent.click(screen.getByRole("button", { name: "Both" }));
    expect(navigate).toHaveBeenLastCalledWith("?view=repositories&state=pass");
  });
});

type Column = "command" | "runs";
const first = (key: Column): Direction => (key === "command" ? "ascending" : "descending");

function SortTable() {
  const [sort, setSort] = useState<Sort<Column>>({ key: "runs", direction: "descending" });
  const headers = useSortHeader({ sort, onSort: setSort, firstDirection: first });
  return (
    <table>
      <thead>
        <tr>
          {(["command", "runs"] as const).map((key) => (
            <th key={key} {...headers.getHeaderProps(key)}>
              <button {...headers.getButtonProps(key)}>{key}</button>
            </th>
          ))}
        </tr>
      </thead>
    </table>
  );
}

describe("useSortHeader", () => {
  it("marks only the sorted column with aria-sort and flips it when chosen again", async () => {
    render(<SortTable />);
    const runs = screen.getByRole("columnheader", { name: "runs" });
    const command = screen.getByRole("columnheader", { name: "command" });
    expect(runs).toHaveAttribute("aria-sort", "descending");
    expect(runs).toHaveAttribute("scope", "col");
    expect(command).not.toHaveAttribute("aria-sort");

    await userEvent.click(screen.getByRole("button", { name: "runs" }));
    expect(runs).toHaveAttribute("aria-sort", "ascending");

    await userEvent.click(screen.getByRole("button", { name: "command" }));
    expect(command).toHaveAttribute("aria-sort", "ascending");
    expect(runs).not.toHaveAttribute("aria-sort");
  });
});

function OneChips() {
  const [value, setValue] = useState<"all" | "heavy">("all");
  const chips = usePressed({ mode: "one", value, onChange: setValue });
  return (
    <>
      <button {...chips.getButtonProps("all")}>All</button>
      <button {...chips.getButtonProps("heavy")}>Heavy</button>
    </>
  );
}

function ManyChips() {
  const [value, setValue] = useState<readonly ("fail" | "pass")[]>(["fail"]);
  const chips = usePressed({ mode: "many", value, onChange: setValue, order: ["fail", "pass"] });
  return (
    <>
      <button {...chips.getButtonProps("fail")}>Fail</button>
      <button {...chips.getButtonProps("pass")}>Pass</button>
    </>
  );
}

describe("usePressed", () => {
  it("presses one chip at a time when a chip chooses one value", async () => {
    render(<OneChips />);
    const all = screen.getByRole("button", { name: "All" });
    const heavy = screen.getByRole("button", { name: "Heavy" });
    expect(all).toHaveAttribute("aria-pressed", "true");
    expect(heavy).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(heavy);
    expect(all).toHaveAttribute("aria-pressed", "false");
    expect(heavy).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(heavy);
    expect(heavy).toHaveAttribute("aria-pressed", "true");
  });

  it("toggles each chip when the chips choose many values, keeping the given order", async () => {
    const user = userEvent.setup();
    render(<ManyChips />);
    const fail = screen.getByRole("button", { name: "Fail" });
    const pass = screen.getByRole("button", { name: "Pass" });
    await user.click(pass);
    expect(fail).toHaveAttribute("aria-pressed", "true");
    expect(pass).toHaveAttribute("aria-pressed", "true");
    await user.click(fail);
    expect(fail).toHaveAttribute("aria-pressed", "false");
    expect(pass).toHaveAttribute("aria-pressed", "true");
    expect(pass).toHaveAttribute("type", "button");
  });
});

function Grid({ rows, columns }: { rows: number; columns: number }) {
  const grid = useGrid({ rows, columns });
  return (
    <table {...grid.getGridProps()} aria-label="Rules">
      <tbody>
        {Array.from({ length: rows }, (_, row) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: the test's rows have no other identity.
          <tr key={row} {...grid.getRowProps()}>
            {Array.from({ length: columns }, (_, column) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: the test's cells have no other identity.
              <td key={column} {...grid.getCellProps(row, column)}>
                {`r${row}c${column}`}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

describe("useGrid", () => {
  it("gives the grid, row and cell roles and one tab stop at the first cell", () => {
    render(<Grid rows={2} columns={2} />);
    expect(screen.getByRole("grid", { name: "Rules" })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(2);
    const cells = screen.getAllByRole("gridcell");
    expect(cells.map((cell) => cell.tabIndex)).toEqual([0, -1, -1, -1]);
  });

  it("moves focus and the tab stop with the arrow keys, Home and End", async () => {
    const user = userEvent.setup();
    render(<Grid rows={3} columns={3} />);
    await user.keyboard("{Tab}");
    expect(screen.getByText("r0c0")).toHaveFocus();
    await user.keyboard("{ArrowRight}{ArrowDown}");
    expect(screen.getByText("r1c1")).toHaveFocus();
    expect(screen.getByText("r1c1")).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("r0c0")).toHaveAttribute("tabindex", "-1");
    await user.keyboard("{End}");
    expect(screen.getByText("r1c2")).toHaveFocus();
    await user.keyboard("{Control>}{Home}{/Control}");
    expect(screen.getByText("r0c0")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(screen.getByText("r0c0")).toHaveFocus();
    await user.keyboard("{Control>}{End}{/Control}");
    expect(screen.getByText("r2c2")).toHaveFocus();
  });

  it("makes a clicked cell the tab stop", async () => {
    const user = userEvent.setup();
    render(<Grid rows={2} columns={2} />);
    await user.click(screen.getByText("r1c0"));
    expect(screen.getByText("r1c0")).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("r0c0")).toHaveAttribute("tabindex", "-1");
  });

  it("keeps the tab stop inside the grid when the grid shrinks", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Grid rows={3} columns={1} />);
    await user.click(screen.getByText("r2c0"));
    rerender(<Grid rows={1} columns={1} />);
    expect(screen.getByText("r0c0")).toHaveAttribute("tabindex", "0");
  });
});

function Panel({ onClose }: { onClose: () => void }) {
  useFocusReturn();
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => close.current?.focus(), []);
  return (
    <div role="dialog" aria-label="Rule">
      <button ref={close} type="button" onClick={onClose}>
        Close
      </button>
    </div>
  );
}

function Page() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open rule
      </button>
      {open && <Panel onClose={() => setOpen(false)} />}
    </>
  );
}

function GridWithInput() {
  const grid = useGrid({ rows: 1, columns: 2 });
  return (
    <table {...grid.getGridProps()} aria-label="Edits">
      <tbody>
        <tr {...grid.getRowProps()}>
          <td {...grid.getCellProps(0, 0)}>
            <input aria-label="Name" defaultValue="abc" />
          </td>
          <td {...grid.getCellProps(0, 1)}>r0c1</td>
        </tr>
      </tbody>
    </table>
  );
}

describe("useGrid with a control in a cell", () => {
  it("leaves the arrow keys, Home and End to a text field inside a cell", async () => {
    const user = userEvent.setup();
    render(<GridWithInput />);
    const field = screen.getByRole("textbox", { name: "Name" });
    await user.click(field);
    await user.keyboard("{ArrowRight}{Home}{End}{ArrowLeft}");
    expect(field).toHaveFocus();
  });
});

describe("useFocusReturn", () => {
  it("returns focus to the element that had it when the panel opened", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole("button", { name: "Open rule" }));
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByRole("button", { name: "Open rule" })).toHaveFocus();
  });
});

function AutoFocusPanel({ onClose }: { onClose: () => void }) {
  useFocusReturn();
  return (
    <div role="dialog" aria-label="Rule">
      {/* biome-ignore lint/a11y/noAutofocus: the test checks that the hook keeps an autoFocus. */}
      <input aria-label="Note" autoFocus />
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  );
}

function AutoFocusPage() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open rule
      </button>
      {open && <AutoFocusPanel onClose={() => setOpen(false)} />}
    </>
  );
}

describe("useFocusReturn under StrictMode", () => {
  it("keeps focus on the panel's autoFocus field and still returns it when the panel closes", async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <AutoFocusPage />
      </StrictMode>,
    );
    await user.click(screen.getByRole("button", { name: "Open rule" }));
    expect(screen.getByRole("textbox", { name: "Note" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByRole("button", { name: "Open rule" })).toHaveFocus();
  });
});
