import * as Transport from "winston-transport";

export class SampleTransport extends Transport {
  constructor(opts = {}) {
    super(opts);
  }

  async log(info, callback) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    // console.log(JSON.stringify(info));

    callback();
  }
}
