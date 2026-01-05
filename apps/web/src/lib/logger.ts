/**
 * 前端 Logger（簡化版）
 * 在開發環境輸出到 console，生產環境可配置發送到後端
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogMessage {
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  timestamp: string
}

const isDev = import.meta.env.DEV

function formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): LogMessage {
  return {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  }
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (isDev) {
    const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    consoleFn(`[${level.toUpperCase()}] ${message}`, context || '')
  }

  // 在生產環境可以發送到後端日誌服務
  if (!isDev && level === 'error') {
    const logMessage = formatMessage(level, message, context)
    // TODO: 發送 logMessage 到監控服務
    void logMessage // 暫時避免 unused variable 警告
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
}

export default logger
