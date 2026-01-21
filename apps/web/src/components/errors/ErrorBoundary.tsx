'use client'

import React, { Component, type ReactNode, type ErrorInfo } from 'react'
import { ErrorFallback } from './ErrorFallback'

interface ErrorBoundaryProps {
  children: ReactNode
  /** 自訂 fallback 元件 */
  fallback?: ReactNode
  /** 錯誤發生時的回調 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * React Error Boundary
 *
 * 捕獲子元件樹中的 JavaScript 錯誤，
 * 顯示 fallback UI 而非白屏。
 *
 * 注意事項：
 * - 只能捕獲子元件 render 階段的錯誤
 * - 無法捕獲：事件處理器、異步代碼、SSR、自身錯誤
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 記錄錯誤到監控服務（如 Sentry）
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)

    // 呼叫自訂錯誤處理
    this.props.onError?.(error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}
