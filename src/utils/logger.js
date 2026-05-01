const DEBUG_FLAG = "startProductiveDebug";

export function shouldLogDebug({ dev, debugFlag }) {
  return Boolean(dev || debugFlag === "1");
}

function readDebugFlag() {
  try {
    return globalThis.localStorage?.getItem(DEBUG_FLAG);
  } catch {
    return null;
  }
}

function isDebugEnabled() {
  return shouldLogDebug({
    dev: import.meta.env.DEV,
    debugFlag: readDebugFlag(),
  });
}

function formatNamespace(namespace) {
  return `[start-productive:${namespace}]`;
}

export function createLogger(namespace) {
  const prefix = formatNamespace(namespace);

  return {
    debug(...args) {
      if (isDebugEnabled()) console.debug(prefix, ...args);
    },
    info(...args) {
      if (isDebugEnabled()) console.info(prefix, ...args);
    },
    warn(...args) {
      console.warn(prefix, ...args);
    },
    error(...args) {
      console.error(prefix, ...args);
    },
  };
}
