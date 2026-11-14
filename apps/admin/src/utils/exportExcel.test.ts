import { describe, expect, it } from 'vitest'
import { escapeCsvCell } from './exportExcel'

describe('escapeCsvCell', () => {
  it.each([
    ['=HYPERLINK("http://evil.com","點我")', `"'=HYPERLINK(""http://evil.com"",""點我"")"`],
    ['+1+1', "'+1+1"],
    ['-2+3', "'-2+3"],
    ['@SUM(A1)', "'@SUM(A1)"],
    ['\t=1', "'\t=1"],
  ])('neutralizes formula-like string %j', (input, expected) => {
    expect(escapeCsvCell(input)).toBe(expected)
  })

  it('keeps negative numbers numeric', () => {
    expect(escapeCsvCell(-50)).toBe('-50')
  })

  it.each(['+5.2%', '-3.1%', '-50', '+12'])(
    'leaves report-built signed numbers %j alone',
    (value) => {
      expect(escapeCsvCell(value)).toBe(value)
    },
  )

  it('leaves ordinary text alone', () => {
    expect(escapeCsvCell('王小明')).toBe('王小明')
  })

  it('quotes commas, newlines and quotes', () => {
    expect(escapeCsvCell('a,b')).toBe('"a,b"')
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"')
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""')
  })
})
