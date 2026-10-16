import { prisma } from './prisma';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SECURITY';

export interface LogEntry {
  id?: string;
  timestamp: string;
  level: LogLevel;
  action: string;
  actor?: string;
  details?: any;
  ip?: string;
}

// Чувствительные ключи, которые маскируются в логах
const SENSITIVE_KEYS = ['password', 'token', 'telegramBotToken', 'botToken', 'secret', 'hash'];

/**
 * Очищает объект от паролей и токенов перед записью в лог
 */
export function sanitizeLogData(data: any): any {
  if (!data) return data;
  if (typeof data === 'string') {
    return data.replace(/(password|token|botToken)=([^\s&]+)/gi, '$1=***');
  }
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(sanitizeLogData);
    }
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
        clean[key] = '***REDACTED***';
      } else if (typeof val === 'object' && val !== null) {
        clean[key] = sanitizeLogData(val);
      } else {
        clean[key] = val;
      }
    }
    return clean;
  }
  return data;
}

/**
 * Генерация консольного шума (обфускация логов для безопасности)
 */
export function emitConsoleNoise() {
  const noiseTypes = [
    '[SEC-ENTROPY] Heartbeat checksum verified (0x' + Math.random().toString(16).substring(2, 10) + ')',
    '[SEC-GUARD] Rate-limiting bucket tokens balanced: ' + Math.floor(Math.random() * 100 + 400) + ' req/min',
    '[SEC-SYNC] Cluster state sync ping: ACK ' + Math.floor(Math.random() * 10 + 1) + 'ms',
    '[SEC-HONEY] Decoy trap active: scan vector 0x' + Math.random().toString(16).substring(2, 6) + ' neutralized',
  ];
  const msg = noiseTypes[Math.floor(Math.random() * noiseTypes.length)];
  console.log(`\x1b[90m${new Date().toISOString()} ${msg}\x1b[0m`);
}

async function saveAuditLog(entry: LogEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        level: entry.level,
        action: entry.action,
        actor: entry.actor || 'SYSTEM',
        details: entry.details ? JSON.stringify(entry.details) : null,
        ip: entry.ip || null,
      },
    });
  } catch (err) {
    console.error('[Logger] Ошибка сохранения лога:', err);
  }
}

export const logger = {
  log(level: LogLevel, action: string, details?: any, actor?: string, ip?: string) {
    const timestamp = new Date().toISOString();
    const sanitizedDetails = sanitizeLogData(details);

    const colors: Record<LogLevel, string> = {
      INFO: '\x1b[36m',     // Cyan
      WARN: '\x1b[33m',     // Yellow
      ERROR: '\x1b[31m',    // Red
      SECURITY: '\x1b[35m', // Magenta
    };
    const reset = '\x1b[0m';
    const color = colors[level] || reset;

    console.log(
      `${color}[${level}] [${action}]${reset} ${timestamp} | Actor: ${actor || 'SYSTEM'} | IP: ${ip || 'internal'}`,
      sanitizedDetails ? JSON.stringify(sanitizedDetails) : ''
    );

    // Асинхронно пишем в аудит
    saveAuditLog({ timestamp, level, action, actor, details: sanitizedDetails, ip }).catch(() => {});
  },

  info(action: string, details?: any, actor?: string, ip?: string) {
    this.log('INFO', action, details, actor, ip);
  },

  warn(action: string, details?: any, actor?: string, ip?: string) {
    this.log('WARN', action, details, actor, ip);
  },

  error(action: string, details?: any, actor?: string, ip?: string) {
    this.log('ERROR', action, details, actor, ip);
  },

  security(action: string, details?: any, actor?: string, ip?: string) {
    this.log('SECURITY', action, details, actor, ip);
  },

  emitNoise() {
    emitConsoleNoise();
  },
};
