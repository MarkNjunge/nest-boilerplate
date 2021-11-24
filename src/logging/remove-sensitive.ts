import { config } from "../config";
import { flatten, unflatten } from "flat";

export function removeSensitiveParams<T>(data: T): T {
  return scanAndRemove(data, config.logging.sensitiveParams);
}

function scanAndRemove<T>(data: T, sensitive: string[]): T {
  const cleanedData: any = flatten(data);
  const sensitiveRegex = new RegExp(sensitive.join("|"));

  Object.keys(cleanedData).forEach(k => {
    if (k.match(sensitiveRegex)) {
      cleanedData[k] = config.logging.replacementString;
    } else {
      cleanedData[k] = cleanedData[k];
    }
  });

  return unflatten(cleanedData);
}
