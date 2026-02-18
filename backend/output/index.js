var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// node_modules/unenv/dist/runtime/_internal/utils.mjs
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
__name(PerformanceEntry, "PerformanceEntry");
var PerformanceMark = /* @__PURE__ */ __name(class PerformanceMark2 extends PerformanceEntry {
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
}, "PerformanceMark");
var PerformanceMeasure = class extends PerformanceEntry {
  entryType = "measure";
};
__name(PerformanceMeasure, "PerformanceMeasure");
var PerformanceResourceTiming = class extends PerformanceEntry {
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
__name(PerformanceResourceTiming, "PerformanceResourceTiming");
var PerformanceObserverEntryList = class {
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
__name(PerformanceObserverEntryList, "PerformanceObserverEntryList");
var Performance = class {
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
__name(Performance, "Performance");
var PerformanceObserver = class {
  __unenv__ = true;
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
__name(PerformanceObserver, "PerformanceObserver");
__publicField(PerformanceObserver, "supportedEntryTypes", []);
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
import { Socket } from "node:net";
var ReadStream = class extends Socket {
  fd;
  constructor(fd) {
    super();
    this.fd = fd;
  }
  isRaw = false;
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
  isTTY = false;
};
__name(ReadStream, "ReadStream");

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
import { Socket as Socket2 } from "node:net";
var WriteStream = class extends Socket2 {
  fd;
  constructor(fd) {
    super();
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  columns = 80;
  rows = 24;
  isTTY = false;
};
__name(WriteStream, "WriteStream");

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class extends EventEmitter {
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return "";
  }
  get versions() {
    return {};
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  ref() {
  }
  unref() {
  }
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: () => 0 });
  mainModule = void 0;
  domain = void 0;
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};
__name(Process, "Process");

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var { exit, platform, nextTick } = getBuiltinModule(
  "node:process"
);
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  nextTick
});
var {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  finalization,
  features,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  on,
  off,
  once,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// src/index.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}
__name(jsonResponse, "jsonResponse");
function getUserId(request) {
  return request.headers.get("X-Encrypted-Yw-ID") || "anonymous";
}
__name(getUserId, "getUserId");
var src_default = {
  async fetch(request, env2) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    const userId = getUserId(request);
    try {
      if (url.pathname === "/api/departments" && request.method === "GET") {
        const { results } = await env2.DB.prepare(
          "SELECT * FROM departments ORDER BY name"
        ).all();
        return jsonResponse({ success: true, data: results });
      }
      if (url.pathname === "/api/departments" && request.method === "POST") {
        const body = await request.json();
        const { name, custodian_name } = body;
        const result = await env2.DB.prepare(
          "INSERT INTO departments (name, custodian_name, created_by) VALUES (?, ?, ?)"
        ).bind(name, custodian_name || null, userId).run();
        return jsonResponse({ success: true, id: result.meta.last_row_id });
      }
      if (url.pathname.startsWith("/api/departments/") && request.method === "PUT") {
        const id = url.pathname.split("/").pop();
        const body = await request.json();
        const { name, custodian_name } = body;
        await env2.DB.prepare(
          "UPDATE departments SET name = ?, custodian_name = ? WHERE id = ?"
        ).bind(name, custodian_name || null, id).run();
        return jsonResponse({ success: true });
      }
      if (url.pathname.startsWith("/api/departments/") && request.method === "DELETE") {
        const id = url.pathname.split("/").pop();
        await env2.DB.prepare("DELETE FROM departments WHERE id = ?").bind(id).run();
        return jsonResponse({ success: true });
      }
      if (url.pathname === "/api/devices" && request.method === "GET") {
        const page = parseInt(url.searchParams.get("page") || "0");
        const limit = parseInt(url.searchParams.get("limit") || "0");
        const q = (url.searchParams.get("q") || "").trim();
        const departmentId = url.searchParams.get("department_id") || "";
        const sort = url.searchParams.get("sort") || "recent";
        if (!page && !limit) {
          const { results: results2 } = await env2.DB.prepare(`
            SELECT d.*, dep.name as department_name, dt.name_ar as device_type_name
            FROM devices d
            LEFT JOIN departments dep ON d.department_id = dep.id
            LEFT JOIN device_types dt ON d.device_type_id = dt.id
            ORDER BY d.created_at DESC
          `).all();
          return jsonResponse({ success: true, data: results2 });
        }
        const conditions = [];
        const bindings = [];
        if (q) {
          conditions.push(`(d.name LIKE ? OR d.serial LIKE ? OR d.manufacturer LIKE ? OR d.supplier LIKE ?)`);
          const likeQ = `%${q}%`;
          bindings.push(likeQ, likeQ, likeQ, likeQ);
        }
        if (departmentId) {
          conditions.push(`d.department_id = ?`);
          bindings.push(departmentId);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        let orderClause = "ORDER BY d.created_at DESC";
        if (sort === "name_asc")
          orderClause = "ORDER BY d.name ASC";
        else if (sort === "name_desc")
          orderClause = "ORDER BY d.name DESC";
        const countQuery = `SELECT COUNT(*) as total FROM devices d ${whereClause}`;
        const countStmt = env2.DB.prepare(countQuery);
        const countResult = bindings.length > 0 ? await countStmt.bind(...bindings).first() : await countStmt.first();
        const total = countResult?.total || 0;
        const actualPage = Math.max(1, page);
        const actualLimit = Math.min(Math.max(1, limit), 100);
        const offset = (actualPage - 1) * actualLimit;
        const dataQuery = `
          SELECT d.*, dep.name as department_name, dt.name_ar as device_type_name
          FROM devices d
          LEFT JOIN departments dep ON d.department_id = dep.id
          LEFT JOIN device_types dt ON d.device_type_id = dt.id
          ${whereClause}
          ${orderClause}
          LIMIT ? OFFSET ?
        `;
        const dataBindings = [...bindings, actualLimit, offset];
        const { results } = await env2.DB.prepare(dataQuery).bind(...dataBindings).all();
        return jsonResponse({
          success: true,
          data: results,
          pagination: {
            page: actualPage,
            limit: actualLimit,
            total,
            totalPages: Math.ceil(total / actualLimit)
          }
        });
      }
      if (url.pathname === "/api/devices" && request.method === "POST") {
        const body = await request.json();
        const {
          name,
          supplier,
          manufacturer,
          serial,
          department_id,
          supply_date,
          install_date,
          service_engineer,
          repair_date,
          signature_png,
          photo_url,
          manufacturer_url,
          description,
          model,
          device_type_id,
          engineer_phone,
          next_maintenance_date,
          last_maintenance_date,
          contract_photos,
          cost,
          is_under_warranty,
          warranty_expiry_date
        } = body;
        const result = await env2.DB.prepare(`
          INSERT INTO devices (
            name, supplier, manufacturer, serial, department_id, supply_date,
            install_date, service_engineer, repair_date, signature_png,
            photo_url, manufacturer_url, description, model, device_type_id,
            engineer_phone, next_maintenance_date, last_maintenance_date, contract_photos,
            cost, is_under_warranty, warranty_expiry_date, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          name,
          supplier,
          manufacturer,
          serial,
          department_id,
          supply_date,
          install_date,
          service_engineer,
          repair_date,
          signature_png,
          photo_url,
          manufacturer_url,
          description,
          model,
          device_type_id || null,
          engineer_phone || null,
          next_maintenance_date || null,
          last_maintenance_date || null,
          contract_photos || null,
          cost || null,
          is_under_warranty || 0,
          warranty_expiry_date || null,
          userId
        ).run();
        if (department_id) {
          await env2.DB.prepare(
            "UPDATE departments SET devices_count = devices_count + 1 WHERE id = ?"
          ).bind(department_id).run();
        }
        return jsonResponse({ success: true, id: result.meta.last_row_id });
      }
      if (url.pathname === "/api/devices/search" && request.method === "GET") {
        const serial = url.searchParams.get("serial");
        if (!serial) {
          return jsonResponse({ error: "Serial parameter is required" }, 400);
        }
        const device = await env2.DB.prepare(`
          SELECT d.*, dep.name as department_name, dt.name_ar as device_type_name
          FROM devices d
          LEFT JOIN departments dep ON d.department_id = dep.id
          LEFT JOIN device_types dt ON d.device_type_id = dt.id
          WHERE TRIM(d.serial) = TRIM(?) COLLATE NOCASE
          LIMIT 1
        `).bind(serial.trim()).first();
        if (!device) {
          const partialDevice = await env2.DB.prepare(`
            SELECT d.*, dep.name as department_name, dt.name_ar as device_type_name
            FROM devices d
            LEFT JOIN departments dep ON d.department_id = dep.id
            LEFT JOIN device_types dt ON d.device_type_id = dt.id
            WHERE TRIM(d.serial) LIKE ? COLLATE NOCASE
            LIMIT 1
          `).bind(`%${serial.trim()}%`).first();
          if (partialDevice) {
            return jsonResponse({ success: true, data: partialDevice });
          }
          return jsonResponse({ error: "Device not found" }, 404);
        }
        return jsonResponse({ success: true, data: device });
      }
      if (url.pathname.startsWith("/api/devices/") && request.method === "GET") {
        const id = url.pathname.split("/").pop();
        const device = await env2.DB.prepare(`
          SELECT d.*, dep.name as department_name, dt.name_ar as device_type_name
          FROM devices d
          LEFT JOIN departments dep ON d.department_id = dep.id
          LEFT JOIN device_types dt ON d.device_type_id = dt.id
          WHERE d.id = ?
        `).bind(id).first();
        if (!device) {
          return jsonResponse({ error: "Device not found" }, 404);
        }
        return jsonResponse({ success: true, data: device });
      }
      if (url.pathname.startsWith("/api/devices/") && request.method === "PUT") {
        const id = url.pathname.split("/").pop();
        const body = await request.json();
        const {
          name,
          supplier,
          manufacturer,
          serial,
          department_id,
          supply_date,
          install_date,
          service_engineer,
          repair_date,
          signature_png,
          photo_url,
          manufacturer_url,
          description,
          model,
          device_type_id,
          engineer_phone,
          next_maintenance_date,
          last_maintenance_date,
          contract_photos,
          cost,
          is_under_warranty,
          warranty_expiry_date
        } = body;
        await env2.DB.prepare(`
          UPDATE devices SET
            name = ?, supplier = ?, manufacturer = ?, serial = ?, department_id = ?,
            supply_date = ?, install_date = ?, service_engineer = ?, repair_date = ?,
            signature_png = ?, photo_url = ?, manufacturer_url = ?, description = ?, model = ?,
            device_type_id = ?, engineer_phone = ?, next_maintenance_date = ?, last_maintenance_date = ?, contract_photos = ?,
            cost = ?, is_under_warranty = ?, warranty_expiry_date = ?
          WHERE id = ?
        `).bind(
          name,
          supplier,
          manufacturer,
          serial,
          department_id,
          supply_date,
          install_date,
          service_engineer,
          repair_date,
          signature_png,
          photo_url,
          manufacturer_url,
          description,
          model,
          device_type_id || null,
          engineer_phone || null,
          next_maintenance_date || null,
          last_maintenance_date || null,
          contract_photos || null,
          cost || null,
          is_under_warranty || 0,
          warranty_expiry_date || null,
          id
        ).run();
        return jsonResponse({ success: true });
      }
      if (url.pathname.startsWith("/api/devices/") && request.method === "DELETE") {
        const id = url.pathname.split("/").pop();
        const device = await env2.DB.prepare("SELECT department_id FROM devices WHERE id = ?").bind(id).first();
        await env2.DB.prepare("DELETE FROM devices WHERE id = ?").bind(id).run();
        if (device && device.department_id) {
          await env2.DB.prepare(
            "UPDATE departments SET devices_count = devices_count - 1 WHERE id = ?"
          ).bind(device.department_id).run();
        }
        return jsonResponse({ success: true });
      }
      if (url.pathname === "/api/checks" && request.method === "GET") {
        const deviceId = url.searchParams.get("device_id");
        let query = `
          SELECT c.*, d.name as device_name, d.serial as device_serial, d.department_id
          FROM routine_checks c
          LEFT JOIN devices d ON c.device_id = d.id
        `;
        if (deviceId) {
          query += " WHERE c.device_id = ?";
          const { results } = await env2.DB.prepare(query + " ORDER BY c.check_date DESC").bind(deviceId).all();
          return jsonResponse({ success: true, data: results });
        } else {
          const { results } = await env2.DB.prepare(query + " ORDER BY c.check_date DESC").all();
          return jsonResponse({ success: true, data: results });
        }
      }
      if (url.pathname === "/api/checks" && request.method === "POST") {
        const body = await request.json();
        const { device_id, check_date, state, issue, checker_name, signature_png, check_type, criteria } = body;
        const result = await env2.DB.prepare(`
          INSERT INTO routine_checks (
            device_id, check_date, state, issue, checker_name, signature_png, check_type, criteria, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(device_id, check_date, state, issue, checker_name, signature_png, check_type || "daily", criteria || null, userId).run();
        return jsonResponse({ success: true, id: result.meta.last_row_id });
      }
      if (url.pathname === "/api/templates" && request.method === "GET") {
        const { results } = await env2.DB.prepare(
          "SELECT * FROM label_templates ORDER BY name"
        ).all();
        return jsonResponse({ success: true, data: results });
      }
      if (url.pathname === "/api/templates" && request.method === "POST") {
        const body = await request.json();
        const { name, json_definition, is_default } = body;
        const result = await env2.DB.prepare(`
          INSERT INTO label_templates (name, json_definition, is_default, created_by)
          VALUES (?, ?, ?, ?)
        `).bind(name, json_definition, is_default ? 1 : 0, userId).run();
        return jsonResponse({ success: true, id: result.meta.last_row_id });
      }
      if (url.pathname === "/api/reports" && request.method === "GET") {
        const period = url.searchParams.get("period") || "month";
        const departmentId = url.searchParams.get("department_id") || "all";
        const now = /* @__PURE__ */ new Date();
        let startDate = /* @__PURE__ */ new Date();
        switch (period) {
          case "week":
            startDate.setDate(now.getDate() - 7);
            break;
          case "month":
            startDate.setMonth(now.getMonth() - 1);
            break;
          case "quarter":
            startDate.setMonth(now.getMonth() - 3);
            break;
          case "year":
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        const startDateStr = startDate.toISOString().split("T")[0];
        const deptFilter = departmentId !== "all" ? "AND d.department_id = ?" : "";
        const deptBindings = departmentId !== "all" ? [departmentId] : [];
        const summaryQuery = `
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN c.state = 'excellent' THEN 1 ELSE 0 END) as excellent,
            SUM(CASE WHEN c.state = 'good' THEN 1 ELSE 0 END) as good,
            SUM(CASE WHEN c.state = 'poor' THEN 1 ELSE 0 END) as poor
          FROM routine_checks c
          LEFT JOIN devices d ON c.device_id = d.id
          WHERE c.check_date >= ? ${deptFilter}
        `;
        const summaryStmt = env2.DB.prepare(summaryQuery);
        const summary = await summaryStmt.bind(startDateStr, ...deptBindings).first();
        const deptPerfQuery = `
          SELECT 
            dep.name,
            COUNT(DISTINCT d2.id) as devices,
            SUM(CASE WHEN c.state = 'excellent' THEN 1 ELSE 0 END) as excellent,
            SUM(CASE WHEN c.state = 'good' THEN 1 ELSE 0 END) as good,
            SUM(CASE WHEN c.state = 'poor' THEN 1 ELSE 0 END) as poor
          FROM departments dep
          LEFT JOIN devices d2 ON d2.department_id = dep.id
          LEFT JOIN routine_checks c ON c.device_id = d2.id AND c.check_date >= ?
          GROUP BY dep.id, dep.name
          ORDER BY dep.name
        `;
        const { results: deptPerf } = await env2.DB.prepare(deptPerfQuery).bind(startDateStr).all();
        const timelineQuery = `
          SELECT 
            DATE(c.check_date) as date,
            SUM(CASE WHEN c.state = 'excellent' THEN 1 ELSE 0 END) as excellent,
            SUM(CASE WHEN c.state = 'good' THEN 1 ELSE 0 END) as good,
            SUM(CASE WHEN c.state = 'poor' THEN 1 ELSE 0 END) as poor
          FROM routine_checks c
          LEFT JOIN devices d ON c.device_id = d.id
          WHERE c.check_date >= ? ${deptFilter}
          GROUP BY DATE(c.check_date)
          ORDER BY date
        `;
        const timelineStmt = env2.DB.prepare(timelineQuery);
        const { results: timeline } = await timelineStmt.bind(startDateStr, ...deptBindings).all();
        const distQuery = `
          SELECT dep.name, COUNT(d.id) as value
          FROM departments dep
          LEFT JOIN devices d ON d.department_id = dep.id
          GROUP BY dep.id, dep.name
          HAVING COUNT(d.id) > 0
          ORDER BY dep.name
        `;
        const { results: distribution } = await env2.DB.prepare(distQuery).all();
        const { results: departments } = await env2.DB.prepare("SELECT id, name FROM departments ORDER BY name").all();
        return jsonResponse({
          success: true,
          data: {
            summary: {
              total: summary?.total || 0,
              excellent: summary?.excellent || 0,
              good: summary?.good || 0,
              poor: summary?.poor || 0
            },
            departmentPerformance: deptPerf,
            timeline,
            devicesDistribution: distribution,
            departments
          }
        });
      }
      if (url.pathname === "/api/maintenance/summary" && request.method === "GET") {
        const days = parseInt(url.searchParams.get("days") || "7");
        const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const daysClamped = Math.min(Math.max(days, 1), 365);
        const summary = await env2.DB.prepare(`
          SELECT
            SUM(CASE WHEN d.next_maintenance_date IS NULL OR TRIM(d.next_maintenance_date) = '' THEN 1 ELSE 0 END) as noDate,
            SUM(CASE WHEN d.next_maintenance_date IS NOT NULL AND TRIM(d.next_maintenance_date) != '' AND d.next_maintenance_date < ? THEN 1 ELSE 0 END) as overdue,
            SUM(CASE WHEN d.next_maintenance_date IS NOT NULL AND TRIM(d.next_maintenance_date) != '' AND d.next_maintenance_date = ? THEN 1 ELSE 0 END) as dueToday,
            SUM(CASE WHEN d.next_maintenance_date IS NOT NULL AND TRIM(d.next_maintenance_date) != '' AND d.next_maintenance_date > ? AND d.next_maintenance_date <= date(?, '+' || ? || ' day') THEN 1 ELSE 0 END) as dueSoon
          FROM devices d
        `).bind(today, today, today, today, daysClamped).first();
        const data = {
          overdue: summary?.overdue || 0,
          dueToday: summary?.dueToday || 0,
          dueSoon: summary?.dueSoon || 0,
          noDate: summary?.noDate || 0,
          days: daysClamped,
          totalDue: (summary?.overdue || 0) + (summary?.dueToday || 0) + (summary?.dueSoon || 0)
        };
        return jsonResponse({ success: true, data });
      }
      if (url.pathname === "/api/maintenance/due" && request.method === "GET") {
        const days = parseInt(url.searchParams.get("days") || "7");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const offset = parseInt(url.searchParams.get("offset") || "0");
        const departmentId = url.searchParams.get("department_id") || "";
        const deviceTypeId = url.searchParams.get("device_type_id") || "";
        const status = (url.searchParams.get("status") || "").trim();
        const includeNoDate = (url.searchParams.get("include_no_date") || "0") === "1";
        const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const daysClamped = Math.min(Math.max(days, 1), 365);
        const limitClamped = Math.min(Math.max(limit, 1), 50);
        const offsetClamped = Math.max(offset, 0);
        const conditions = [];
        const bindings = [];
        const dueCondition = includeNoDate ? `( (d.next_maintenance_date IS NULL OR TRIM(d.next_maintenance_date) = '')
              OR (d.next_maintenance_date IS NOT NULL AND TRIM(d.next_maintenance_date) != '' AND d.next_maintenance_date <= date(?, '+' || ? || ' day')) )` : `( d.next_maintenance_date IS NOT NULL AND TRIM(d.next_maintenance_date) != '' AND d.next_maintenance_date <= date(?, '+' || ? || ' day') )`;
        conditions.push(dueCondition);
        bindings.push(today, daysClamped);
        if (departmentId) {
          conditions.push("d.department_id = ?");
          bindings.push(departmentId);
        }
        if (deviceTypeId) {
          conditions.push("d.device_type_id = ?");
          bindings.push(deviceTypeId);
        }
        if (status) {
          conditions.push(`(
            CASE
              WHEN d.next_maintenance_date IS NULL OR TRIM(d.next_maintenance_date) = '' THEN 'no_date'
              WHEN d.next_maintenance_date < ? THEN 'overdue'
              WHEN d.next_maintenance_date = ? THEN 'due_today'
              WHEN d.next_maintenance_date <= date(?, '+' || ? || ' day') THEN 'due_soon'
              ELSE 'not_due'
            END
          ) = ?`);
          bindings.push(today, today, today, daysClamped, status);
        }
        const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
        const countStmt = env2.DB.prepare(`SELECT COUNT(*) as total FROM devices d ${whereClause}`);
        const countRow = await countStmt.bind(...bindings).first();
        const total = countRow?.total || 0;
        const dataStmt = env2.DB.prepare(`
          SELECT
            d.id,
            d.name,
            d.serial,
            dep.name as department_name,
            dt.name_ar as device_type_name,
            d.department_id,
            d.device_type_id,
            d.next_maintenance_date,
            d.last_maintenance_date,
            d.engineer_phone,
            d.service_engineer,
            CASE
              WHEN d.next_maintenance_date IS NULL OR TRIM(d.next_maintenance_date) = '' THEN 'no_date'
              WHEN d.next_maintenance_date < ? THEN 'overdue'
              WHEN d.next_maintenance_date = ? THEN 'due_today'
              WHEN d.next_maintenance_date <= date(?, '+' || ? || ' day') THEN 'due_soon'
              ELSE 'not_due'
            END as status,
            CAST(ROUND(julianday(?) - julianday(d.next_maintenance_date)) AS INTEGER) as days_overdue
          FROM devices d
          LEFT JOIN departments dep ON d.department_id = dep.id
          LEFT JOIN device_types dt ON d.device_type_id = dt.id
          ${whereClause}
          ORDER BY
            CASE
              WHEN d.next_maintenance_date IS NULL OR TRIM(d.next_maintenance_date) = '' THEN 3
              WHEN d.next_maintenance_date < ? THEN 0
              WHEN d.next_maintenance_date = ? THEN 1
              ELSE 2
            END,
            (julianday(?) - julianday(d.next_maintenance_date)) DESC
          LIMIT ? OFFSET ?
        `);
        const dataBindings = [
          // SELECT placeholders
          today,
          today,
          today,
          daysClamped,
          today,
          // WHERE placeholders
          ...bindings,
          // ORDER BY placeholders
          today,
          today,
          today,
          // LIMIT/OFFSET
          limitClamped,
          offsetClamped
        ];
        const { results } = await dataStmt.bind(...dataBindings).all();
        return jsonResponse({
          success: true,
          data: {
            items: results,
            pagination: {
              total,
              limit: limitClamped,
              offset: offsetClamped
            }
          }
        });
      }
      if (url.pathname === "/api/stats" && request.method === "GET") {
        const devicesCount = await env2.DB.prepare("SELECT COUNT(*) as count FROM devices").first();
        const checksCount = await env2.DB.prepare("SELECT COUNT(*) as count FROM routine_checks").first();
        const departmentsCount = await env2.DB.prepare("SELECT COUNT(*) as count FROM departments").first();
        const thirtyDaysAgo = /* @__PURE__ */ new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateStr = thirtyDaysAgo.toISOString().split("T")[0];
        const recentChecks = await env2.DB.prepare(`
          SELECT state, COUNT(*) as count
          FROM routine_checks
          WHERE check_date >= ?
          GROUP BY state
        `).bind(dateStr).all();
        return jsonResponse({
          success: true,
          data: {
            devices: devicesCount.count,
            checks: checksCount.count,
            departments: departmentsCount.count,
            recentChecksByState: recentChecks.results
          }
        });
      }
      if (url.pathname === "/api/users" && request.method === "GET") {
        const { results } = await env2.DB.prepare(`
          SELECT id, username, name, email, role, status, privileges, created_at, last_login
          FROM users
          ORDER BY created_at DESC
        `).all();
        return jsonResponse({ success: true, data: results });
      }
      if (url.pathname === "/api/users" && request.method === "POST") {
        const body = await request.json();
        const { username, password, name, email, role = "user", privileges = "[]" } = body;
        const passwordHash = password;
        const result = await env2.DB.prepare(
          "INSERT INTO users (username, password_hash, name, email, role, privileges, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).bind(username, passwordHash, name, email, role, privileges, userId).run();
        return jsonResponse({ success: true, id: result.meta.last_row_id });
      }
      if (url.pathname.startsWith("/api/users/") && request.method === "PUT") {
        const id = url.pathname.split("/").pop();
        const body = await request.json();
        const { name, email, role, status, privileges } = body;
        await env2.DB.prepare(
          "UPDATE users SET name = ?, email = ?, role = ?, status = ?, privileges = ? WHERE id = ?"
        ).bind(name, email, role, status, privileges, id).run();
        return jsonResponse({ success: true });
      }
      if (url.pathname.startsWith("/api/users/") && request.method === "DELETE") {
        const id = url.pathname.split("/").pop();
        await env2.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
        return jsonResponse({ success: true });
      }
      if (url.pathname === "/api/auth/login" && request.method === "POST") {
        const body = await request.json();
        const { username, password } = body;
        const user = await env2.DB.prepare(
          "SELECT id, username, name, email, role, status, privileges FROM users WHERE username = ? AND password_hash = ?"
        ).bind(username, password).first();
        if (!user) {
          return jsonResponse({ error: "Invalid credentials" }, 401);
        }
        if (user.status !== "active") {
          return jsonResponse({ error: "Account is inactive" }, 403);
        }
        await env2.DB.prepare(
          "UPDATE users SET last_login = datetime('now') WHERE id = ?"
        ).bind(user.id).run();
        return jsonResponse({ success: true, data: { user } });
      }
      if (url.pathname === "/api/send-contact" && request.method === "POST") {
        const body = await request.json();
        const { name, email, subject, message } = body;
        if (!name || !email || !subject || !message) {
          return jsonResponse({ error: "\u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0644 \u0645\u0637\u0644\u0648\u0628\u0629" }, 400);
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return jsonResponse({ error: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D" }, 400);
        }
        console.log("Contact form submission:", {
          to: "kkaarrkkaarr@gmail.com",
          from: email,
          name,
          subject,
          message,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        return jsonResponse({
          success: true,
          message: "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0631\u0633\u0627\u0644\u062A\u0643 \u0628\u0646\u062C\u0627\u062D!"
        });
      }
      if (url.pathname === "/api/criteria" && request.method === "GET") {
        const { results } = await env2.DB.prepare(`
          SELECT * FROM check_criteria 
          WHERE is_active = 1 
          ORDER BY display_order, id
        `).all();
        return jsonResponse({ success: true, data: results });
      }
      if (url.pathname === "/api/criteria" && request.method === "POST") {
        const body = await request.json();
        const { key, label_ar, description_ar, display_order = 0 } = body;
        if (!key || !label_ar) {
          return jsonResponse({ error: "\u0627\u0644\u0645\u0641\u062A\u0627\u062D \u0648\u0627\u0644\u062A\u0633\u0645\u064A\u0629 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" }, 400);
        }
        const existing = await env2.DB.prepare(
          "SELECT id FROM check_criteria WHERE key = ? COLLATE NOCASE"
        ).bind(key).first();
        if (existing) {
          return jsonResponse({
            error: "\u0627\u0644\u0645\u0641\u062A\u0627\u062D \u0645\u0648\u062C\u0648\u062F \u0628\u0627\u0644\u0641\u0639\u0644",
            details: "\u064A\u062C\u0628 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0645\u0641\u062A\u0627\u062D \u0641\u0631\u064A\u062F \u0644\u0643\u0644 \u0645\u0639\u064A\u0627\u0631 \u0641\u062D\u0635"
          }, 409);
        }
        const result = await env2.DB.prepare(`
          INSERT INTO check_criteria (key, label_ar, description_ar, display_order, created_by)
          VALUES (?, ?, ?, ?, ?)
        `).bind(key, label_ar, description_ar, display_order, userId).run();
        return jsonResponse({ success: true, id: result.meta.last_row_id });
      }
      if (url.pathname.startsWith("/api/criteria/") && request.method === "PUT") {
        const id = url.pathname.split("/").pop();
        const body = await request.json();
        const { key, label_ar, description_ar, display_order, is_active } = body;
        const existing = await env2.DB.prepare(
          "SELECT id FROM check_criteria WHERE key = ? COLLATE NOCASE AND id != ?"
        ).bind(key, id).first();
        if (existing) {
          return jsonResponse({
            error: "\u0627\u0644\u0645\u0641\u062A\u0627\u062D \u0645\u0648\u062C\u0648\u062F \u0628\u0627\u0644\u0641\u0639\u0644",
            details: "\u064A\u062C\u0628 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0645\u0641\u062A\u0627\u062D \u0641\u0631\u064A\u062F \u0644\u0643\u0644 \u0645\u0639\u064A\u0627\u0631 \u0641\u062D\u0635"
          }, 409);
        }
        await env2.DB.prepare(`
          UPDATE check_criteria 
          SET key = ?, label_ar = ?, description_ar = ?, display_order = ?, is_active = ?
          WHERE id = ?
        `).bind(key, label_ar, description_ar, display_order, is_active, id).run();
        return jsonResponse({ success: true });
      }
      if (url.pathname.startsWith("/api/criteria/") && request.method === "DELETE") {
        const id = url.pathname.split("/").pop();
        await env2.DB.prepare(
          "UPDATE check_criteria SET is_active = 0 WHERE id = ?"
        ).bind(id).run();
        return jsonResponse({ success: true });
      }
      if (url.pathname === "/api/device-types" && request.method === "GET") {
        const { results } = await env2.DB.prepare(`
          SELECT * FROM device_types WHERE is_active = 1 ORDER BY name_ar
        `).all();
        return jsonResponse({ success: true, data: results });
      }
      if (url.pathname === "/api/device-types" && request.method === "POST") {
        const body = await request.json();
        const { name_ar, name_en, description } = body;
        if (!name_ar) {
          return jsonResponse({ error: "\u0627\u0633\u0645 \u0627\u0644\u062C\u0647\u0627\u0632 \u0628\u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0645\u0637\u0644\u0648\u0628" }, 400);
        }
        const result = await env2.DB.prepare(`
          INSERT INTO device_types (name_ar, name_en, description, created_by)
          VALUES (?, ?, ?, ?)
        `).bind(name_ar, name_en || null, description || null, userId).run();
        return jsonResponse({ success: true, id: result.meta.last_row_id });
      }
      if (url.pathname.startsWith("/api/device-types/") && request.method === "PUT") {
        const id = url.pathname.split("/").pop();
        const body = await request.json();
        const { name_ar, name_en, description } = body;
        await env2.DB.prepare(`
          UPDATE device_types SET name_ar = ?, name_en = ?, description = ? WHERE id = ?
        `).bind(name_ar, name_en || null, description || null, id).run();
        return jsonResponse({ success: true });
      }
      if (url.pathname.startsWith("/api/device-types/") && request.method === "DELETE") {
        const id = url.pathname.split("/").pop();
        await env2.DB.prepare("UPDATE device_types SET is_active = 0 WHERE id = ?").bind(id).run();
        return jsonResponse({ success: true });
      }
      if (url.pathname.match(/^\/api\/device-types\/\d+\/criteria$/) && request.method === "GET") {
        const id = url.pathname.split("/")[3];
        const { results } = await env2.DB.prepare(`
          SELECT c.* FROM check_criteria c
          JOIN device_type_criteria dtc ON c.id = dtc.criteria_id
          WHERE dtc.device_type_id = ? AND c.is_active = 1
          ORDER BY c.display_order
        `).bind(id).all();
        return jsonResponse({ success: true, data: results });
      }
      if (url.pathname.match(/^\/api\/device-types\/\d+\/criteria$/) && request.method === "POST") {
        const id = url.pathname.split("/")[3];
        const body = await request.json();
        const { criteria_ids } = body;
        await env2.DB.prepare("DELETE FROM device_type_criteria WHERE device_type_id = ?").bind(id).run();
        for (const criteriaId of criteria_ids) {
          await env2.DB.prepare(
            "INSERT INTO device_type_criteria (device_type_id, criteria_id) VALUES (?, ?)"
          ).bind(id, criteriaId).run();
        }
        return jsonResponse({ success: true });
      }
      return jsonResponse({ error: "Not found" }, 404);
    } catch (error3) {
      console.error("API Error:", error3);
      return jsonResponse({ error: error3.message || "Internal server error" }, 500);
    }
  }
};
export {
  src_default as default
};
//# sourceMappingURL=index.js.map
