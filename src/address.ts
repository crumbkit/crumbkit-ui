// Filter state held in the page address. A codec reads the fields it defines
// from a query string and writes them back, leaving out every field that
// holds its default, so a shared link carries only what the reader chose.
// It reads and writes only the string the app passes and stores nothing.

/** One field of an address: its default, how to read its text and how to write its value. */
export interface Field<T> {
  readonly fallback: T;
  /** Returns the value `raw` names, or undefined when the field does not know it. */
  readonly read: (raw: string) => T | undefined;
  /**
   * Returns the text of `value`, or undefined when it is the default and the
   * address leaves it out. It is a method, so a field of any value type is a
   * `Field<unknown>` that `defineAddress` takes.
   */
  write(value: T): string | undefined;
}

/** The value a field holds. */
export type FieldValue<F> = F extends Field<infer T> ? T : never;

/** Reads an address into values and writes values back into an address. */
export interface Codec<V> {
  /** Returns the values `search` holds, such as "?view=rules&state=fail", with a default for each field it lacks. */
  readonly parse: (search: string) => V;
  /** Returns the query string of `value`, with a leading "?", or "" when every field holds its default. */
  readonly format: (value: V) => string;
}

/** A field that holds one of `values`, and `fallback` for any other text. */
export function oneOf<const T extends string>(
  values: readonly T[],
  fallback: NoInfer<T>,
): Field<T> {
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
export function manyOf<const T extends string>(values: readonly T[]): Field<readonly T[]> {
  const known = (raw: readonly string[]) => values.filter((each) => raw.includes(each));
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
export function text(fallback = ""): Field<string> {
  return {
    fallback,
    read: (raw) => raw,
    write: (value) => (value === fallback ? undefined : value),
  };
}

/** A field that names one item, such as the selected rule, or null when the address names none. */
export function id(): Field<string | null> {
  return {
    fallback: null,
    read: (raw) => (raw === "" ? undefined : raw),
    write: (value) => (value === null || value === "" ? undefined : value),
  };
}

/** Returns `raw` decoded as a form encodes it, or undefined when it is not valid percent-encoding. */
function decode(raw: string): string | undefined {
  try {
    return decodeURIComponent(raw.replaceAll("+", " "));
  } catch {
    return undefined;
  }
}

/** Returns each key of `search` with every text given for it, in order. */
function entries(search: string): Map<string, string[]> {
  const found = new Map<string, string[]>();
  const query = search.startsWith("?") ? search.slice(1) : search;
  for (const pair of query.split("&")) {
    if (pair === "") continue;
    const at = pair.indexOf("=");
    const key = decode(at === -1 ? pair : pair.slice(0, at));
    const value = decode(at === -1 ? "" : pair.slice(at + 1));
    if (key === undefined || value === undefined) continue;
    found.set(key, [...(found.get(key) ?? []), value]);
  }
  return found;
}

/**
 * Returns the codec of `fields`. A field the address lacks, names twice or
 * gives a value it does not know takes its default. `format` writes the
 * fields in the order `fields` defines them.
 */
export function defineAddress<const F extends Record<string, Field<unknown>>>(
  fields: F,
): Codec<{ readonly [K in keyof F]: FieldValue<F[K]> }> {
  type V = { readonly [K in keyof F]: FieldValue<F[K]> };
  // A field's type is erased here, because a key and its field travel
  // together and each field reads and writes only its own value.
  const list: [string, Field<unknown>][] = Object.entries(fields);
  return {
    parse: (search) => {
      const found = entries(search);
      const value: Record<string, unknown> = {};
      for (const [key, field] of list) {
        const raw = found.get(key);
        const read = raw?.length === 1 && raw[0] !== undefined ? field.read(raw[0]) : undefined;
        value[key] = read === undefined ? field.fallback : read;
      }
      return fromRecord<V>(value);
    },
    format: (value) => {
      const values: Record<string, unknown> = value;
      const parts: string[] = [];
      for (const [key, field] of list) {
        const written = field.write(values[key]);
        if (written !== undefined) {
          parts.push(
            `${encodeURIComponent(key)}=${encodeURIComponent(written).replaceAll("%2C", ",")}`,
          );
        }
      }
      return parts.length === 0 ? "" : `?${parts.join("&")}`;
    },
  };
}

/** Returns `record` as the codec's value type, which its fields built key by key. */
function fromRecord<V>(record: Record<string, unknown>): V {
  // biome-ignore lint/nursery/noUnsafeTypeAssertion: parse fills every key of V with its field's value.
  return record as V;
}
