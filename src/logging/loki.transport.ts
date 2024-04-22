import * as Transport from "winston-transport";
import * as dayjs from "dayjs";
import { default as axios } from "axios";
import { clone } from "@/utils";

interface LogStream {
  stream: {
    service: string;
    level: string;
    trace_id: string;
    tag: string;
  };
  values: [
    [
      string,
      string,
    ]
  ];
}

type LoggingCb = (err?: any) => void;

export class LokiTransport extends Transport {
  // Batch
  private batchEntries: LogStream[] = [];
  private batchInterval = 2000;
  private batchCount = 100;
  private batchTimeoutID = -1;

  private lokiUrl: string;

  constructor(private host: string) {
    super({});
    this.lokiUrl = `${host}/loki/api/v1/push`;
  }

  log(info: any, callback: () => void): void {
    setImmediate(callback);

    const cb: LoggingCb = (err?: any) => {
      if (err) {
        console.error("LokiTransport", err);
        this.emit("warn", err);
      } else {
        this.emit("logged", info);
      }
    };

    this.processInfo(info);

    if (this.batchEntries.length === 1) {
      // @ts-expect-error Similar type?
      this.batchTimeoutID = setTimeout(() => {
        this.batchTimeoutID = -1;
        this.doBatchRequest(cb);
      }, this.batchInterval);
    } else if (this.batchEntries.length >= this.batchCount) {
      this.doBatchRequest(cb);
    }
  }

  doBatchRequest(cb: LoggingCb) {
    // Reset timeout ID
    if (this.batchTimeoutID > 0) {
      clearTimeout(this.batchTimeoutID);
      this.batchTimeoutID = -1;
    }

    const entriesCopy = clone(this.batchEntries);
    this.batchEntries = [];

    axios({
      url: this.lokiUrl,
      method: "POST",
      data: {
        streams: entriesCopy
      }
    })
      .then(() => cb())
      .catch(e => {
        if (e.response) {
          cb(JSON.stringify(e.response.data));
        } else {
          cb(e.message);
        }
      });
  }

  processInfo(info: any) {
    const stream: LogStream = {
      stream: {
        service: "nest-boilerplate",
        level: info.level,
        trace_id: info.trace_id,
        tag: info.data.tag,
      },
      values: [
        [
          (dayjs().valueOf() * 1000000).toString(),
          info.message,
          // JSON.stringify({ message: info.message, data: info.data })
        ],
      ],
    };

    this.batchEntries.push(stream);
  }
}
