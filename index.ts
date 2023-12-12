/* eslint-disable @typescript-eslint/ban-types */
type ValueOf<T> = T[keyof T];
type NullableKeys<T> = ValueOf<{[K in keyof T]: T[K] extends ModelType<ModelTypeName, false, unknown> ? K : never}>;
type RequiredKeys<T> = ValueOf<{
  [K in keyof T]: T[K] extends
    | ModelType<ModelTypeName, true, unknown>
    | (new (...args: unknown[]) => Model)
    | Function & {prototype: Model} ?
      K : never
}>;
type Join<T> = unknown & {[K in keyof T]: T[K]};
type Objectize<T> = Join<{[K in RequiredKeys<T>]-?: Infer<T[K]>} & {[K in NullableKeys<T>]+?: Infer<T[K]>}>;
type InferPrimitive<T> =
    T extends "string" ? string :
    T extends "number" ? number :
    T extends "boolean" ? boolean :
    never;

type ModelTypeName = "primitive" | "array" | "tuple" | "object" | "literal" | "enum" | "model";

interface ModelType<TypeName extends ModelTypeName, Required extends boolean, Type> {
  readonly type: TypeName;
  readonly required: Required;
  readonly value: Type;
}

type InferRequired<T, B extends boolean> = B extends true ? T : T | null | undefined;
type Infer<T> =
  T extends ModelType<infer Name, infer Required, infer Type> ?
    Name extends "literal" ? Type extends readonly unknown[] ? InferRequired<Type[number], Required> : never :
    Name extends "primitive" ? InferRequired<InferPrimitive<Type>, Required> :
    Name extends "array" ? Type extends (infer i)[] ? InferRequired<Infer<i>[], Required> : never :
    Name extends "tuple" ? InferRequired<{[K in keyof Type]: Infer<Type[K]>}, Required> :
    Name extends "enum" ? Type extends readonly string[] ? Type[number] : never :
    Name extends "model" ?
      Type extends Function & {prototype: infer i} ? Objectize<i> | null | undefined : never :
      never :
  T extends Function & {prototype: infer i} ? Objectize<i> :
  T extends object ? Objectize<T> :
  never;

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class Model {
  static get number(): ModelType<"primitive", true, "number"> {
    return Object.freeze({
      type: "primitive",
      required: true,
      value: "number"
    });
  }
  static get string(): ModelType<"primitive", true, "string"> {
    return Object.freeze({
      type: "primitive",
      required: true,
      value: "string"
    });
  }
  static get boolean(): ModelType<"primitive", true, "boolean"> {
    return Object.freeze({
      type: "primitive",
      required: true,
      value: "boolean"
    });
  }
  static literal<
    T extends readonly (string | number | boolean)[]>(...value: T): ModelType<"literal", true, T> {
    return Object.freeze({
      type: "literal",
      required: true,
      value
    });
  }
  static array<T extends unknown[]>(...value: T): ModelType<"array", true, T> {
    return Object.freeze({
      type: "array",
      required: true,
      value
    });
  }
  static tuple<T extends readonly unknown[]>(...value: T): ModelType<"tuple", true, T> {
    return Object.freeze({
      type: "tuple",
      required: true,
      value
    });
  }
  static enum<T extends readonly string[]>(...value: T): ModelType<"enum", true, T> {
    return Object.freeze({
      type: "enum",
      required: true,
      value
    });
  }
  static readonly optional = Object.assign(
    <T extends Function & {prototype: Model}>(value: T): ModelType<"model", false, T> => ({
      type: "model" as const,
      value,
      required: false as const,
    }),
    Object.freeze({
      number: {...this.number, required: false as const},
      string: {...this.string, required: false as const},
      boolean: {...this.boolean, required: false as const},
      array: <T>(...value: T[]) => {
        return Object.freeze({
          ...this.array(...value),
          required: false as const
        });
      },
      tuple: <T extends readonly unknown[]>(...value: T) => {
        return Object.freeze({
          ...this.tuple(...value),
          required: false as const
        });
      },
      enum: <T extends readonly string[]>(...value: T) => {
        return Object.freeze({
          ...this.enum(...value),
          required: false as const
        });
      },
      literal: <T extends | readonly string[] | readonly number[] | readonly boolean[]>(...value: T) => {
        return Object.freeze({
          ...this.literal(...value),
          required: false as const
        });
      }
    })
  );
  static [Symbol.hasInstance](value: unknown) {
    return !!value && typeof value === "object" && this.keys().every(k => k in value);
  }
  static new<T extends Model, M extends Infer<T>>(this: Function & {prototype: T}, model: M) {
    const inst = Object.create(this.prototype);
    return Object.assign(inst, model) as M;
  }
  static keys<T extends Model>(this: Function & {prototype: T}) {
    //@ts-expect-error Construct only internally
    return Object.freeze(Object.keys(new this())) as readonly (keyof T)[];
  }
  static shape<T extends Model>(this: Function & {prototype: T}) {
    //@ts-expect-error Construct only internally
    return new this() as T;
  }
  protected constructor() {
    // Make the class only instantiable via static methods
  }
}

