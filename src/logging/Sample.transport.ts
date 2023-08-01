import * as Transport from "winston-transport";
import { clone } from "@/utils";

// Batching adapted from https://github.com/winstonjs/winston/blob/master/lib/winston/transports/http.js
export class SampleTransport extends Transport {
  // Batch
  private batchEntries: any[] = [];
  private batchInterval = 2000;
  private batchCount = 10;
  private batchTimeoutID = -1;

  constructor(opts = {}) {
    super(opts);
  }

  log(info: any, callback: () => void): void {
    if (callback) {
      setImmediate(callback);
    }

    const cb = (err?: any) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        this.emit("warn", err);
      } else {
        this.emit("logged", info);
      }
    };

    this.batchEntries.push(info);

    if (this.batchEntries.length === 1) {
      // @ts-expect-error Similar type?
      this.batchTimeoutID = setTimeout(() => {
        this.batchTimeoutID = -1;
        this.doBatchRequest(cb);
      }, this.batchInterval);
    } else if (this.batchEntries.length === this.batchCount) {
      this.doBatchRequest(cb);
    }
  }

  doBatchRequest(cb: (err?: any) => void) {
    // Reset timeout ID
    if (this.batchTimeoutID > 0) {
      clearTimeout(this.batchTimeoutID);
      this.batchTimeoutID = -1;
    }

    const entriesCopy = clone(this.batchEntries);
    this.batchEntries = [];

    // eslint-disable-next-line no-console
    // console.log(entriesCopy.map(e => e.message));
    cb();
  }
}
