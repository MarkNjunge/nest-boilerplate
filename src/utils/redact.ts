export const privateKeys = ["password", "x-api-key", "authorization", "email"];

const replaceValue = "REDACTED";

export function redact(obj: any, keys = privateKeys): any {
  Object.keys(obj).forEach(k => {
    const v = obj[k];

    if (typeof v === "object" && !Array.isArray(v)) {
      obj[k] = redact(v);
    } else if (Array.isArray(v)) {
      // If the whole array should be redacted
      if (keys.includes(k.toLowerCase())) {
        obj[k] = v.map(() => replaceValue);
        return;
      }

      v.forEach((elem, i) => {
        if (typeof elem === "object") {
          obj[k][i] = redact(elem);
        }
      });
    } else {
      if (keys.includes(k.toLowerCase())) {
        obj[k] = replaceValue;
      }
    }
  });

  return obj;
}
