import { config } from "../Config";

export function removeSensitiveParams(data: any) {
  return scanAndRemove(data, config.logging.sensitiveParams);
}

function scanAndRemove(data, sensitive) {
  const cleanedData: typeof data = {};
  Object.keys(data).forEach((k) => {
    if (data[k] instanceof Object) {
      cleanedData[k] = scanAndRemove(data[k], sensitive);
    } else {
      if (sensitive.includes(k)) {
        cleanedData[k] = config.logging.replacementString;
      } else {
        cleanedData[k] = data[k];
      }
    }
  });

  return cleanedData;
}
