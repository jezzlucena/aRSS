import { env } from '../config/env.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogPayload {
  message: string;
  [key: string]: unknown;
}

/**
 * Simple structured logger for the API.
 * In production, outputs JSON for easy parsing.
 * In development, outputs human-readable formatted logs.
 */
class Logger {
  private context: string;

  constructor(context: string = 'App') {
    this.context = context;
  }

  private formatMessage(level: LogLevel, payload: LogPayload): string {
    const timestamp = new Date().toISOString();
    const { message, ...data } = payload;

    if (env.NODE_ENV === 'production') {
      return JSON.stringify({
        timestamp,
        level,
        context: this.context,
        message,
        ...data,
      });
    }

    // Human-readable format for development
    const dataStr = Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}${dataStr}`;
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (env.NODE_ENV === 'production') return; // Skip debug in production
    console.log(this.formatMessage('debug', { message, ...data }));
  }

  info(message: string, data?: Record<string, unknown>): void {
    console.log(this.formatMessage('info', { message, ...data }));
  }

  warn(message: string, data?: Record<string, unknown>): void {
    console.warn(this.formatMessage('warn', { message, ...data }));
  }

  error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const errorData: Record<string, unknown> = { ...data };

    if (error instanceof Error) {
      errorData.errorMessage = error.message;
      errorData.errorStack = error.stack;
    } else if (error) {
      errorData.error = error;
    }

    console.error(this.formatMessage('error', { message, ...errorData }));
  }

  /**
   * Create a child logger with a different context.
   */
  child(context: string): Logger {
    return new Logger(`${this.context}:${context}`);
  }
}

// Default logger instance
export const logger = new Logger('API');

// Factory to create named loggers
export function createLogger(context: string): Logger {
  return new Logger(context);
}
