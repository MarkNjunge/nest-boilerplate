import * as Transport from "winston-transport";

export class SampleTransport extends Transport {
  constructor(opts = {}) {
    super(opts);
  }

  log(info: any, callback: () => void): void {
    setImmediate(() => {
      this.emit("logged", info);
    });

    // console.log(JSON.stringify(info));

    callback();
  }
}
