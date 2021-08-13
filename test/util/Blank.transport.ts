/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as Transport from "winston-transport";

export class BlankTransport extends Transport {
  constructor(opts = {}) {
    super(opts);
  }

  log(info, callback): void {
    setImmediate(() => {
      this.emit("logged", info);
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    callback();
  }
}
