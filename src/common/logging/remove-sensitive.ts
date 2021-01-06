import { config } from "../Config";
import { flatten, unflatten } from "flat";

export function removeSensitiveParams<T>(data: T): T {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return scanAndRemove(data, config.logging.sensitiveParams);
}

function scanAndRemove<T>(data: T, sensitive: string[]) {
  const cleanedData = flatten(data);

  Object.keys(cleanedData).forEach(k => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (k.includes(sensitive)) {
      cleanedData[k] = config.logging.replacementString;
    } else {
      cleanedData[k] = cleanedData[k];
    }
  });

  return unflatten(cleanedData);
}
