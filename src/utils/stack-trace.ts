import * as path from "path";

export interface ParseStacktraceLine {
  file: string;
  filePath: string;
  methodName: string;
  arguments: string[];
  lineNumber: number;
  column: number | null;
}

export function parseStacktrace(stacktrace: string): ParseStacktraceLine[] {
  return stacktrace.split("\n")
    .map(s => parseStacktraceLine(s))
    .filter(p => p !== null) as ParseStacktraceLine[];
}

export function parseStacktraceLine(line: string): ParseStacktraceLine | null {
  const nodeRe = /^\s*at (?:((?:\[object object\])?[^\\/]+(?: \[as \S+\])?) )?\(?(.*?):(\d+)(?::(\d+))?\)?\s*$/i;
  const parts = nodeRe.exec(line);

  if (!parts) {
    return null;
  }

  return {
    file: parts[2].replace(new RegExp(`\\${path.sep}`, "g"), "/").split("/")
      .slice(-1)[0],
    filePath: parts[2],
    methodName: parts[1] || "<unknown>",
    arguments: [],
    lineNumber: Number(parts[3]),
    column: parts[4] ?
      Number(parts[4]) :
      null,
  };
}
