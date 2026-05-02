import Transport from "winston-transport";

export class BlankTransport extends Transport {
  constructor(opts = {}) {
    super(opts);
  }

  log(info: Record<string, any>, callback: () => void): void {
    setImmediate(() => {
      this.emit("logged", info);
    });

    callback();
  }
}
