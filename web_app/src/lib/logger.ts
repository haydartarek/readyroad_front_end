/**
 * Production-safe logger utility
 * Prevents sensitive data leaks and provides structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
    [key: string]: unknown;
}

class Logger {
    private isProduction = process.env.NODE_ENV === 'production';

    /**
     * Sanitize data to remove sensitive information
     */
    private sanitize(data: unknown): unknown {
        if (typeof data !== 'object' || data === null) {
            return data;
        }

        if (Array.isArray(data)) {
            return data.map(item => this.sanitize(item));
        }

        const sanitized: Record<string, unknown> = {};
        const sensitiveKeys = [
            'password',
            'token',
            'authorization',
            'auth',
            'secret',
            'apikey',
            'api_key',
            'credit_card',
            'ssn',
            'email', // Optionally sanitize email in production
        ];

        for (const [key, value] of Object.entries(data)) {
            const lowerKey = key.toLowerCase();

            if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitize(value);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    private log(level: LogLevel, message: string, context?: LogContext) {
        // In production, only log warnings and errors
        if (this.isProduction && (level === 'debug' || level === 'info')) {
            return;
        }

        const timestamp = new Date().toISOString();
        const sanitizedContext = context ? this.sanitize(context) : undefined;

        const logData: Record<string, unknown> = {
            timestamp,
            level,
            message,
        };

        if (sanitizedContext) {
            logData.context = sanitizedContext;
        }

        switch (level) {
            case 'debug':
                console.debug(JSON.stringify(logData));
                break;
            case 'info':
                console.info(JSON.stringify(logData));
                break;
            case 'warn':
                console.warn(JSON.stringify(logData));
                break;
            case 'error':
                console.error(JSON.stringify(logData));
                break;
        }
    }

    debug(message: string, context?: LogContext) {
        this.log('debug', message, context);
    }

    info(message: string, context?: LogContext) {
        this.log('info', message, context);
    }

    warn(message: string, context?: LogContext) {
        this.log('warn', message, context);
    }

    error(message: string, context?: LogContext) {
        this.log('error', message, context);
    }
}

export const logger = new Logger();
