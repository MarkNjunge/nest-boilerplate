import * as _ from "lodash";

export function clone<T = any>(obj: T): T {
  return _.cloneDeep(obj);
}

/**
 * Check if an object has cyclic dependencies
 * @see https://stackoverflow.com/a/41292020
 * @param obj
 */
export function isCyclic(obj: any): boolean {
  const stackSet = new Set();
  let detected = false;

  function detect(obj: any) {
    if (!(obj instanceof Object)) {
      return;
    }

    if (stackSet.has(obj)) {
      detected = true;
      return;
    }

    stackSet.add(obj);
    for (const k in obj) {
      // eslint-disable-next-line no-prototype-builtins
      if (obj.hasOwnProperty(k)) {
        detect(obj[k]);
      }
    }

    stackSet.delete(obj);
    return;
  }

  detect(obj);

  return detected;
}
