export function clone<T = any>(obj: T, checkCyclic = true): T {
  // It's faster to check if the object is cyclic and switch, than to always use JSON
  if (checkCyclic && isCyclic(obj)) {
    return cloneJson<T>(obj);
  }

  if (obj == null || typeof obj != "object") {
    return obj;
  }

  const temp = new (obj as any).constructor();
  for (const key in obj) {
    temp[key] = clone(obj[key]);
  }

  return temp;
}

function cloneJson<T = any>(obj: T): T {
  const cache: any[] = [];
  const str = JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (cache.indexOf(value) !== -1) {
        // Circular reference found, discard key
        return;
      }
      // Store value in our collection
      cache.push(value);
    }
    return value;
  });

  return JSON.parse(str);
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
