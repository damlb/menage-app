import { useEffect } from "react"
import { useMessageStore } from "../../store/messageStore"
import { Mail, MailOpen, AlertTriangle, Clock, X } from "lucide-react"
import { useState } from "react"

export default function MessagesTab() {
  const { messages, loading, loadMessages, markAsRead } = useMessageStore()
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    loadMessages()
  }, [])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Hier'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'long' })
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    }
  }

  const handleSelect = (msg: any) => {
    setSelected(msg)
    if (!msg.lu) {
      markAsRead(msg.id)
    }
  }

  const getPriorityBadge = (priorite: string) => {
    if (priorite === 'urgente') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
          <AlertTriangle className="w-3 h-3" />
          Urgent
        </span>
      )
    }
    return null
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Messages</h2>
        <span className="text-sm text-muted-foreground">
          {messages.filter(m => !m.lu).length} non lu(s)
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">Aucun message</p>
          <p className="text-sm text-muted-foreground mt-1">Vos messages apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map(m => (
            <button
              key={m.id}
              onClick={() => handleSelect(m)}
              className={`w-full text-left bg-card rounded-xl p-4 border transition-all duration-200 ${
                !m.lu
                  ? 'border-primary/50 shadow-sm'
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  !m.lu ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  {!m.lu ? (
                    <Mail className={`w-5 h-5 ${m.priorite === 'urgente' ? 'text-red-500' : 'text-primary'}`} />
                  ) : (
                    <MailOpen className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className={`font-medium truncate ${!m.lu ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {m.sujet || "(Sans sujet)"}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatDate(m.created_at)}
                    </div>
                  </div>

                  <p className={`text-sm truncate ${!m.lu ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                    {m.contenu}
                  </p>

                  {m.priorite === 'urgente' && (
                    <div className="mt-2">
                      {getPriorityBadge(m.priorite)}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal de lecture */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative bg-card rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {selected.priorite === 'urgente' && getPriorityBadge(selected.priorite)}
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {selected.sujet || "(Sans sujet)"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(selected.created_at).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="flex-shrink-0 p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {selected.contenu}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
