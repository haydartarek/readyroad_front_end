// ─── Types ───────────────────────────────────────────────

type LogLevel   = 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, unknown>;

// ─── Constants ───────────────────────────────────────────

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'authorization',
  'auth',
  'secret',
  'apikey',
  'api_key',
  'credit_card',
  'ssn',
  'email',
]);

const DEV_ONLY_LEVELS = new Set<LogLevel>(['debug', 'info']);

const CONSOLE_METHOD: Record<LogLevel, (...args: unknown[]) => void> = {
  debug: console.debug,
  info:  console.info,
  warn:  console.warn,
  error: console.error,
};

// ─── Logger ──────────────────────────────────────────────

class Logger {
  private readonly isProd = process.env.NODE_ENV === 'production';

  private sanitize(data: unknown): unknown {
    if (data === null || typeof data !== 'object') return data;

    if (Array.isArray(data)) return data.map(item => this.sanitize(item));

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = SENSITIVE_KEYS.has(key.toLowerCase())
        ? '[REDACTED]'
        : this.sanitize(value);
    }
    return result;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (this.isProd && DEV_ONLY_LEVELS.has(level)) return;

    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context) entry.context = this.sanitize(context);

    CONSOLE_METHOD[level](JSON.stringify(entry));
  }

  debug(message: string, context?: LogContext): void { this.log('debug', message, context); }
  info (message: string, context?: LogContext): void { this.log('info',  message, context); }
  warn (message: string, context?: LogContext): void { this.log('warn',  message, context); }
  error(message: string, context?: LogContext): void { this.log('error', message, context); }
}

// ─── Singleton ───────────────────────────────────────────

export const logger = new Logger();
