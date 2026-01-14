import { useMessageStore } from "../../store/messageStore"
import { AlertTriangle, X } from "lucide-react"
import { useState } from "react"

export default function BroadcastBanner() {
  const { messages } = useMessageStore()
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  // Trouver le message urgent non lu et non masqué
  const urgentMessage = messages.find(
    m => m.priorite === 'urgente' && !m.lu && !dismissedIds.includes(m.id)
  )

  if (!urgentMessage) return null

  const handleDismiss = () => {
    setDismissedIds(prev => [...prev, urgentMessage.id])
  }

  return (
    <div className="bg-red-500 text-white px-4 py-3 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">
            {urgentMessage.sujet || "Message urgent"}
          </p>
          <p className="text-sm text-white/90 mt-0.5 line-clamp-2">
            {urgentMessage.contenu}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
