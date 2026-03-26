import { useState, useRef, useEffect, useMemo, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ComboboxProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  disabled?: boolean
}

export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: ComboboxProps) {
  const id = useId()
  const listboxId = `${id}-listbox`

  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxRef = useRef<HTMLUListElement>(null)

  // 依照目前輸入值篩選選項（空值時顯示全部）
  const filteredOptions = useMemo(() => {
    if (!value.trim()) return options
    const lower = value.toLowerCase()
    return options.filter((opt) => opt.toLowerCase().includes(lower))
  }, [options, value])

  // 每次篩選結果改變時，重置 highlight
  useEffect(() => {
    setHighlightedIndex(-1)
  }, [filteredOptions])

  // 點擊外部關閉下拉
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  // 鍵盤控制
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          return
        }
        setHighlightedIndex((prev) => {
          const next = prev < filteredOptions.length - 1 ? prev + 1 : 0
          scrollOptionIntoView(next)
          return next
        })
        break

      case 'ArrowUp':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          return
        }
        setHighlightedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : filteredOptions.length - 1
          scrollOptionIntoView(next)
          return next
        })
        break

      case 'Enter':
        if (isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          e.preventDefault()
          selectOption(filteredOptions[highlightedIndex])
        }
        break

      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break

      case 'Tab':
        setIsOpen(false)
        break
    }
  }

  const scrollOptionIntoView = (index: number) => {
    const listbox = listboxRef.current
    if (!listbox) return
    const item = listbox.children[index] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }

  const selectOption = (option: string) => {
    onChange(option)
    setIsOpen(false)
    setHighlightedIndex(-1)
    inputRef.current?.focus()
  }

  const activeDescendantId =
    isOpen && highlightedIndex >= 0
      ? `${id}-option-${highlightedIndex}`
      : undefined

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={activeDescendantId}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg',
            'focus:ring-2 focus:ring-green-500 focus:border-transparent',
            'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
          )}
        />
        <ChevronDown
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform',
            isOpen && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </div>

      {/* 下拉選單 */}
      {isOpen && filteredOptions.length > 0 && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {filteredOptions.map((option, index) => (
            <li
              key={option}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
              onMouseDown={(e) => {
                // preventDefault 防止 input 失去 focus
                e.preventDefault()
                selectOption(option)
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                'px-3 py-2 text-sm cursor-pointer',
                index === highlightedIndex
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-700 hover:bg-gray-50',
              )}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
