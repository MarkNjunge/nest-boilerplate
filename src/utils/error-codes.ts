/* eslint-disable @typescript-eslint/lines-between-class-members */
export class ErrorCodes {
  static INVALID_AUTHENTICATION = "InvalidAuthentication";
  static INTERNAL_ERROR = "InternalError";
  static CLIENT_ERROR = "ClientError";
  static NOT_FOUND = "NotFound";
  static VALIDATION_ERROR = "ValidationError";
  static INVALID_USER = "InvalidUser";
  static TOO_MANY_REQUESTS = "TooManyRequests";
}

export function getErrorCode(status: number | string): string {
  status = status.toString();
  if (status === "401" || status === "403") {
    return ErrorCodes.INVALID_AUTHENTICATION;
  } else if (status === "404") {
    return ErrorCodes.NOT_FOUND;
  } else if (status === "429") {
    return ErrorCodes.TOO_MANY_REQUESTS;
  } else if (status.match(/4\d\d/)) {
    return ErrorCodes.CLIENT_ERROR;
  } else {
    return ErrorCodes.INTERNAL_ERROR;
  }
}
