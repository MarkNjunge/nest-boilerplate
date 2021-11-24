import * as Transport from "winston-transport";
import { removeSensitiveParams } from "./remove-sensitive";

export class SampleTransport extends Transport {
  constructor(opts = {}) {
    super(opts);
  }

  log(info: any, callback: () => void): void {
    setImmediate(() => {
      this.emit("logged", info);
    });

    info = removeSensitiveParams(info);
    // console.log(JSON.stringify(info));

    callback();
  }
}
