import { MessageSquare } from "lucide-react"

const EmptyCenter = () => (
  <div className="messages-layout__empty">
    <MessageSquare size={36} className="messages-layout__empty-icon" />
    <p className="messages-layout__empty-title">No conversation selected</p>
    <p className="messages-layout__empty-sub">
      Pick a conversation from the list to start reading.
    </p>
  </div>
)
export default EmptyCenter