import * as winston from "winston";

winston.configure({
  level: "debug",
  format: winston.format.simple(),
  transports: new winston.transports.Console(),
});
