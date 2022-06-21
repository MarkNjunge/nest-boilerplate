/* eslint-disable max-len */
import { parseStacktrace } from "./stack-trace";

describe("stack-trace", () => {
  it("can parse", () => {
    const stacktrace = `Error: Something went wrong
    at Object.<anonymous> (/dev/nest-boilerplate/src/utils/stack-trace.spec.ts:6:19)
    at Promise.then.completed (/dev/nest-boilerplate/node_modules/jest-circus/build/utils.js:333:28)
    at new Promise (<anonymous>)
    at callAsyncCircusFn (/dev/nest-boilerplate/node_modules/jest-circus/build/utils.js:259:10)
    at _callCircusTest (/dev/nest-boilerplate/node_modules/jest-circus/build/run.js:277:40)
    at processTicksAndRejections (node:internal/process/task_queues:96:5)
    at _runTest (/dev/nest-boilerplate/node_modules/jest-circus/build/run.js:209:3)
    at _runTestsForDescribeBlock (/dev/nest-boilerplate/node_modules/jest-circus/build/run.js:97:9)
    at _runTestsForDescribeBlock (/dev/nest-boilerplate/node_modules/jest-circus/build/run.js:91:9)
    at run (/dev/nest-boilerplate/node_modules/jest-circus/build/run.js:31:3)`;

    const expected = {
      arguments: [],
      column: 19,
      file: "stack-trace.spec.ts",
      filePath: "/dev/nest-boilerplate/src/utils/stack-trace.spec.ts",
      lineNumber: 6,
      methodName: "Object.<anonymous>",
    };
    const res = parseStacktrace(stacktrace);
    expect(res[0]).toEqual(expected);
  });
});
