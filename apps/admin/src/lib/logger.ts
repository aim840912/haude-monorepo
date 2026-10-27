/**
 * Admin 前端 Logger
 * 開發環境輸出到 console，生產環境可配置發送到後端
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const isDev = import.meta.env.DEV

function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  // 開發環境全部輸出；生產環境只輸出 warn / error（還沒接監控服務前，console 是線上唯一看得到問題的地方）
  if (isDev || level === 'warn' || level === 'error') {
    const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    consoleFn(`[${level.toUpperCase()}] ${message}`, context || '')
  }

  // TODO: 生產環境的 error 發送到監控服務
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
}

export default logger
