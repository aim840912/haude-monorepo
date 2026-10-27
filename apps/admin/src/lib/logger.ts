/**
 * Admin 前端 Logger
 * 開發環境輸出到 console，生產環境可配置發送到後端
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const isDev = import.meta.env.DEV

function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (isDev) {
    const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    consoleFn(`[${level.toUpperCase()}] ${message}`, context || '')
  }

  // 生產環境：error 仍輸出到 console（還沒接監控服務前，這是線上唯一看得到錯誤的地方）
  if (!isDev && level === 'error') {
    console.error(`[ERROR] ${message}`, context || '')
    // TODO: 發送到監控服務
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
}

export default logger
