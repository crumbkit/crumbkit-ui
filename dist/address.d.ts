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
export declare function oneOf<const T extends string>(values: readonly T[], fallback: NoInfer<T>): Field<T>;
/**
 * A field that holds any of `values`, written as one key with commas, such
 * as "state=fail,warn". It reads them in the order `values` lists them,
 * once each, and drops a value it does not know. The default holds none.
 */
export declare function manyOf<const T extends string>(values: readonly T[]): Field<readonly T[]>;
/** A field that holds any text, such as a search, and `fallback` when the address lacks it. */
export declare function text(fallback?: string): Field<string>;
/** A field that names one item, such as the selected rule, or null when the address names none. */
export declare function id(): Field<string | null>;
/**
 * Returns the codec of `fields`. A field the address lacks, names twice or
 * gives a value it does not know takes its default. `format` writes the
 * fields in the order `fields` defines them.
 */
export declare function defineAddress<const F extends Record<string, Field<unknown>>>(fields: F): Codec<{
    readonly [K in keyof F]: FieldValue<F[K]>;
}>;
