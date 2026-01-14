import { useEffect, useState } from "react"
import { useMessageStore, Message } from "../../store/messageStore"
import { Mail, MailOpen, AlertTriangle, ChevronRight, X } from "lucide-react"

export default function MessagesTab() {
  const { messages, loading, loadMessages, markAsRead } = useMessageStore()
  const [selected, setSelected] = useState<Message | null>(null)

  useEffect(() => {
    loadMessages()
  }, [])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Hier'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    }
  }

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleSelect = (msg: Message) => {
    setSelected(msg)
    if (!msg.lu) {
      markAsRead(msg.id)
    }
  }

  const handleClose = () => {
    setSelected(null)
  }

  // Vue détail d'un message
  if (selected) {
    return (
      <div className="flex flex-col h-full">
        {/* Header avec bouton retour */}
        <div className="bg-card border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground truncate">
                {selected.sujet || "(Sans sujet)"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {formatFullDate(selected.created_at)}
              </p>
            </div>
            {selected.priorite === 'urgente' && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                Urgent
              </span>
            )}
          </div>
        </div>

        {/* Contenu du message */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
              {selected.contenu}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Vue liste des messages
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Messages</h2>
        {messages.filter(m => !m.lu).length > 0 && (
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
            {messages.filter(m => !m.lu).length} non lu(s)
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
            <Mail className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium mb-1">Aucun message</p>
          <p className="text-sm text-muted-foreground">Vos messages apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map(m => (
            <button
              key={m.id}
              onClick={() => handleSelect(m)}
              className={`w-full text-left bg-card rounded-xl p-4 border transition-colors active:scale-[0.98] ${
                !m.lu
                  ? 'border-primary shadow-sm'
                  : 'border-border'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Icône */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  m.priorite === 'urgente'
                    ? 'bg-red-100'
                    : !m.lu
                      ? 'bg-primary/10'
                      : 'bg-muted'
                }`}>
                  {!m.lu ? (
                    <Mail className={`w-6 h-6 ${m.priorite === 'urgente' ? 'text-red-600' : 'text-primary'}`} />
                  ) : (
                    <MailOpen className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`font-semibold truncate ${!m.lu ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {m.sujet || "(Sans sujet)"}
                    </p>
                    {m.priorite === 'urgente' && (
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-1">
                    {m.contenu}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {formatDate(m.created_at)}
                  </p>
                </div>

                {/* Chevron */}
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
