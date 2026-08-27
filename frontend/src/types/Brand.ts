declare const __brand: unique symbol;

export type Brand<T, B> = T & { readonly [__brand]: B };

export type Unbrand<T> = T extends Brand<infer U, unknown> ? U : T;

export function brand<T extends Brand<any, any>>(value: any): T {
  return value;
}
