import * as winston from "winston";
import { BlankTransport } from "./Blank.transport";

winston.configure({
  level: "debug",
  format: winston.format.simple(),
  transports: [new BlankTransport()],
});
