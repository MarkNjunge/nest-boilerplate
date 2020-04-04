import { config } from "../Config";

export function removeSensitiveParams(data: any) {
  return scanAndRemove(data, config.logging.sensitiveParams);
}

function scanAndRemove(data, sensitive) {
  Object.keys(data).forEach((k) => {
    if (data[k] instanceof Object) {
      data[k] = scanAndRemove(data[k], sensitive);
    } else {
      if (sensitive.includes(k)) {
        data[k] = config.logging.replacementString;
      }
    }
  });

  return data;
}
