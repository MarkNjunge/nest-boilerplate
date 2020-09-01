import * as Transport from "winston-transport";

export class BlankTransport extends Transport {
  constructor(opts = {}) {
    super(opts);
  }

  async log(info, callback) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    callback();
  }
}
