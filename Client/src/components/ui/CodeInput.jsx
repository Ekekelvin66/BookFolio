import { useRef, useEffect } from 'react'
import clsx from 'clsx'

const CodeInput = ({
  value = '',
  onChange,
  onComplete,
  length = 6,
  error,
  disabled = false,
  className,
}) => {
  const inputRefs = useRef([])

  const digits = value.split('').slice(0, length)
  while (digits.length < length) digits.push('')

  const focusBox = (index) => {
    inputRefs.current[index]?.focus()
    inputRefs.current[index]?.select()
  }

  const handleChange = (index, rawVal) => {
    const char = rawVal.replace(/\D/g, '').slice(-1)
    const nextDigits = [...digits]
    nextDigits[index] = char
    const nextValue = nextDigits.join('')
    onChange?.(nextValue)

    if (char && index < length - 1) {
      focusBox(index + 1)
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      focusBox(index - 1)
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      focusBox(index - 1)
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault()
      focusBox(index + 1)
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    onChange?.(pasted)
    const focusIndex = pasted.length === length ? length - 1 : pasted.length
    setTimeout(() => {
        focusBox(focusIndex)
    }, 0)
  }

  return (
    <div className={clsx('code-input-wrapper', className)}>
      <div className={clsx('code-input', error && 'code-input--error')}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className="code-input__box"
            aria-label={`Digit ${i + 1} of ${length}`}
          />
        ))}
      </div>
      {error && <span className="input-error">{error}</span>}
    </div>
  )
}

export default CodeInput