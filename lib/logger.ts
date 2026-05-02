type LogLevel = "info" | "warn" | "error";

const LOG_PREFIX = "[PayTrack]";

function formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
  const timestamp = new Date().toISOString();
  return `${LOG_PREFIX} [${level.toUpperCase()}] ${timestamp} - ${message}`;
}

export const logger = {
  info(message: string, ...args: unknown[]) {
    console.log(formatMessage("info", message), ...args);
  },

  warn(message: string, ...args: unknown[]) {
    console.warn(formatMessage("warn", message), ...args);
  },

  error(message: string, error?: unknown, ...args: unknown[]) {
    console.error(formatMessage("error", message), error, ...args);
  },
};
