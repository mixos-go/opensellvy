import type { Logger, LogLevel } from './logger';

const LEVEL_ORDER: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

export interface ConsoleLoggerOptions {
  level?: LogLevel;
  bindings?: Record<string, unknown>;
  pretty?: boolean;
  stream?: Pick<NodeJS.WritableStream, 'write'>;
}

export class ConsoleLogger implements Logger {
  private readonly level: LogLevel;
  private readonly bindings: Record<string, unknown>;
  private readonly pretty: boolean;
  private readonly stream: Pick<NodeJS.WritableStream, 'write'>;

  constructor(opts?: ConsoleLoggerOptions) {
    this.level = opts?.level ?? 'info';
    this.bindings = opts?.bindings ?? {};
    this.pretty = opts?.pretty ?? false;
    this.stream = opts?.stream ?? process.stdout;
  }

  trace(msg: string, ...args: unknown[]): void {
    this.write('trace', msg, args);
  }

  debug(msg: string, ...args: unknown[]): void {
    this.write('debug', msg, args);
  }

  info(msg: string, ...args: unknown[]): void {
    this.write('info', msg, args);
  }

  warn(msg: string, ...args: unknown[]): void {
    this.write('warn', msg, args);
  }

  error(msg: string, ...args: unknown[]): void {
    this.write('error', msg, args);
  }

  fatal(msg: string, ...args: unknown[]): void {
    this.write('fatal', msg, args);
  }

  child(bindings: Record<string, unknown>): Logger {
    return new ConsoleLogger({
      level: this.level,
      pretty: this.pretty,
      stream: this.stream,
      bindings: { ...this.bindings, ...bindings },
    });
  }

  private write(level: LogLevel, msg: string, args: unknown[]): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.level]) return;

    const time = new Date().toISOString();
    const context = this.mergeArgs(args[0], args.slice(1));

    if (this.pretty) {
      const prefix = [`${time}`, this.pad(level.toUpperCase())];
      const bindingsLine = JSON.stringify(this.bindings);
      this.stream.write(`${prefix.join(' ')} ${msg}${context ? ` ${JSON.stringify(context)}` : ''}${bindingsLine !== '{}' ? ` ${bindingsLine}` : ''}\n`);
      return;
    }

    this.stream.write(
      `${JSON.stringify({ time, level, msg, ...this.bindings, ...context })}\n`,
    );
  }

  private mergeArgs(first: unknown, rest: unknown[]): Record<string, unknown> {
    const target: Record<string, unknown> = {};
    const values = first === undefined ? rest : [first, ...rest];
    for (const value of values) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(target, value);
      } else if (value !== undefined) {
        target.args = values;
        break;
      }
    }
    return target;
  }

  private pad(text: string): string {
    return text.length < 5 ? text + ' '.repeat(5 - text.length) : text;
  }
}

export function createLogger(opts?: ConsoleLoggerOptions): Logger {
  return new ConsoleLogger(opts);
}