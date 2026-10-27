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

const isDev = process.env.NODE_ENV !== 'production'

function formatMessage(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
): LogMessage {
  return {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  }
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  // 開發環境全部輸出；生產環境只輸出 warn / error（還沒接監控服務前，console 是線上唯一看得到問題的地方，
  // 例如「API 不可用、改用 Mock 資料」這種 warn 在線上最需要被看見）
  if (isDev || level === 'warn' || level === 'error') {
    const consoleFn =
      level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
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
