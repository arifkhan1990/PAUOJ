type LogMeta = Record<string, unknown>;

function write(level: "info" | "warn" | "error", message: string, meta?: LogMeta): void {
  if (process.env.NODE_ENV === "test") return;
  const line = JSON.stringify({
    level,
    message,
    time: new Date().toISOString(),
    ...meta,
  });
  process.stdout.write(`${line}\n`);
}

export const logger = {
  info: (message: string, meta?: LogMeta) => write("info", message, meta),
  warn: (message: string, meta?: LogMeta) => write("warn", message, meta),
  error: (message: string, meta?: LogMeta) => write("error", message, meta),
};
