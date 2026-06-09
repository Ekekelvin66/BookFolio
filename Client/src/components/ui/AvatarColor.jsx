import { useState } from "react"
import Avatar from "./Avatar"
import { Edit2 } from "lucide-react"
const AVATAR_COLORS = [
  '#C4873A', '#123012', '#6B6355', '#A05050',
  '#4A7A9B', '#8B6FAE', '#C4A035', '#5A8A8A',
  '#A07850', '#7A5A8A', '#4A8A6A', '#C47A5A',
]

const AvatarColorPicker = ({ currentColor, onSelect }) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="avatar-picker">
      <button 
        className="avatar-picker__trigger"
        onClick={() => setOpen(p => !p)}
      >
        <Avatar color={currentColor} size="xl" />
        <span className="avatar-picker__edit-icon"><Edit2 size={14} /></span>
      </button>

      {open && (
        <div className="avatar-picker__popover">
          <p className="avatar-picker__label">Choose a colour</p>
          <div className="avatar-picker__grid">
            {AVATAR_COLORS.map((color) => (
              <button
                key={color}
                className={`avatar-picker__swatch ${currentColor === color ? 'avatar-picker__swatch--active' : ''}`}
                style={{ background: color }}
                onClick={() => {
                  onSelect(color)
                  setOpen(false)
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
export default AvatarColorPicker