
import Input from './Input'
import { Search, X } from 'lucide-react'

function SearchBar({ onSearch, placeholder, defaultValue='', className,value, onChange,...rest}) {

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value.trim()) onSearch?.(value.trim())
  }

  return (
    <Input
      placeholder={placeholder}
      value={value??defaultValue}
      leftIcon={<Search size={15} />}
       rightIcon={value ? <X size={13} onClick={() => { onChange?.(''); onSearch?.('') }} /> : null}
      onChange={(e) => onChange?.(e.target.value)}
      onKeyDown={handleKeyDown}
      className={className}
      {...rest}
    />
  )
}
export default SearchBar