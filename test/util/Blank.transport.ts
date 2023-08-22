import * as Transport from "winston-transport";

export class BlankTransport extends Transport {
  constructor(opts = {}) {
    super(opts);
  }

  log(info, callback: () => void): void {
    setImmediate(() => {
      this.emit("logged", info);
    });

    callback();
  }
}
