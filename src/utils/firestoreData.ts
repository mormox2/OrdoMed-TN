/**
 * Firestore rejects `undefined`, including when it is nested in an object.
 * Application models use optional properties extensively, so normalize plain
 * data before every write instead of relying on each form to omit them.
 */
export function withoutUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
