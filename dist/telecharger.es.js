function getHead(url) {
  return fetch(url, {
    method: "HEAD",
    headers: {
      Range: "bytes=0-1"
    }
  }).then((res) => res.headers);
}
async function* asyncPool(concurrency, iterable, iteratorFn) {
  const executing = /* @__PURE__ */ new Set();
  async function consume() {
    const [promise, value] = await Promise.race(executing);
    executing.delete(promise);
    return value;
  }
  for (const item of iterable) {
    const promise = (async () => await iteratorFn(item, iterable))().then((value) => [promise, value]);
    executing.add(promise);
    if (executing.size >= concurrency) {
      yield await consume();
    }
  }
  while (executing.size) {
    yield await consume();
  }
}
async function download(chunk, controller) {
  const response = await fetch(chunk.url, {
    signal: controller.signal,
    headers: {
      Range: `bytes=${chunk.head}-${chunk.end}`
    }
  });
  const reader = response.body.getReader();
  const contentType = response.headers.get("content-type") || "application/octet-stream";
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      const blob = new Blob([chunk.buffer], { type: contentType });
      chunk.done(blob);
      return chunk;
    }
    chunk.append(value);
  }
}
function mitt(n) {
  return { all: n = n || /* @__PURE__ */ new Map(), on: function(t, e) {
    var i = n.get(t);
    i ? i.push(e) : n.set(t, [e]);
  }, off: function(t, e) {
    var i = n.get(t);
    i && (e ? i.splice(i.indexOf(e) >>> 0, 1) : n.set(t, []));
  }, emit: function(t, e) {
    var i = n.get(t);
    i && i.slice().map(function(n2) {
      n2(e);
    }), (i = n.get("*")) && i.slice().map(function(n2) {
      n2(t, e);
    });
  } };
}
class TChunk {
  constructor(options) {
    this.blob = null;
    this.url = options.url;
    this.index = options.index;
    this.start = options.start;
    this.head = options.start;
    this.end = options.end;
    this.buffer = new Uint8Array(this.size);
    this.emitter = mitt();
  }
  get progress() {
    return (this.head - this.start) / this.size;
  }
  get size() {
    return this.end - this.start + 1;
  }
  append(value) {
    this.buffer.set(value, this.head - this.start);
    this.head += value.length;
    this.emitter.emit("progress", this.progress);
  }
  done(blob) {
    this.blob = blob;
  }
}
class UnsupportedRangeError extends Error {
  constructor(message) {
    super(message);
  }
}
async function telecharger(url, options = {}) {
  var _a;
  const emitter = mitt();
  const {
    threads = 8,
    chunkSize = 1024e4,
    immediate = true
  } = options;
  const headers = await getHead(url);
  const contentType = headers.get("Content-Type");
  const isSupportedRange = (_a = headers.get("Accept-Ranges")) == null ? void 0 : _a.includes("bytes");
  if (!isSupportedRange)
    throw new UnsupportedRangeError("unsupported http range");
  const contentLength = Number(headers.get("Content-Length"));
  const chunksCount = Math.ceil(contentLength / chunkSize);
  const chunks = new Array(chunksCount);
  const undone = /* @__PURE__ */ new Set();
  for (let i = 0; i < chunksCount; i++) {
    let start2 = i * chunkSize;
    let end = i + 1 == chunksCount ? contentLength - 1 : (i + 1) * chunkSize - 1;
    const chunk = new TChunk({
      url,
      index: i,
      start: start2,
      end
    });
    chunk.emitter.on("progress", (progress) => {
      const totalProgress = chunks.reduce((prev, current) => {
        return prev + current.progress;
      }, 0) / chunksCount;
      emitter.emit("progress", totalProgress);
      if (totalProgress >= 1)
        emitter.all.delete("progress");
      if (progress >= 1)
        chunk.emitter.all.delete("progress");
    });
    chunks[i] = chunk;
    undone.add(chunk);
  }
  let status = 0;
  let controller;
  async function start() {
    if (status === 1 || status === 4)
      return;
    controller = new AbortController();
    status = 1;
    try {
      for await (const chunk of asyncPool(threads, Array.from(undone), (chunk2) => download(chunk2, controller))) {
        chunk.emitter.emit("done", chunk);
        chunk.emitter.all.delete("done");
      }
      status = 4;
      emitter.emit("done", new Blob(chunks.map((chunk) => chunk.blob), { type: contentType }));
      emitter.all.delete("done");
    } catch (error) {
      if ((error == null ? void 0 : error.name) === "AbortError") {
        status = 2;
      } else {
        status = 3;
        emitter.emit("error", error);
      }
    }
  }
  if (immediate) {
    start();
  }
  function pause() {
    status = 2;
    controller.abort();
  }
  function resume() {
    start();
  }
  return {
    chunks,
    emitter,
    start,
    pause,
    resume
  };
}
export { UnsupportedRangeError, telecharger };
