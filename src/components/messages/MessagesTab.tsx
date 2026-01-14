import { useEffect, useState } from "react"
import { useMessageStore, Message } from "../../store/messageStore"
import {
  Mail,
  MailOpen,
  AlertTriangle,
  ArrowLeft,
  Clock,
  Archive,
  ArchiveRestore,
  Trash2,
  CheckCircle,
  Inbox
} from "lucide-react"

type TabType = 'actifs' | 'archives'

export default function MessagesTab() {
  const {
    messages,
    loading,
    loadMessages,
    markAsRead,
    toggleArchive,
    deleteMessage
  } = useMessageStore()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('actifs')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    loadMessages()
  }, [])

  const selectedMessage = messages.find(m => m.id === selectedId)

  const activeMessages = messages.filter(m => !m.archive)
  const archivedMessages = messages.filter(m => m.archive)
  const currentMessages = activeTab === 'actifs' ? activeMessages : archivedMessages

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
    setSelectedId(msg.id)
    if (!msg.lu) {
      markAsRead(msg.id)
    }
  }

  const handleBack = () => {
    setSelectedId(null)
    setConfirmDelete(null)
  }

  const handleArchive = (id: string) => {
    toggleArchive(id)
    if (selectedId === id) {
      setSelectedId(null)
    }
  }

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteMessage(id)
      setSelectedId(null)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(id)
    }
  }

  const unreadCount = activeMessages.filter(m => !m.lu).length

  // Vue détail d'un message
  if (selectedMessage) {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="bg-card px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground truncate text-base">
                {selectedMessage.sujet || "(Sans sujet)"}
              </h2>
            </div>
          </div>
        </div>

        {/* Badge urgent + date */}
        <div className="px-4 py-3 bg-muted/50 border-b border-border">
          <div className="flex items-center gap-2 flex-wrap">
            {selectedMessage.priorite === 'urgente' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-red-500 text-white rounded-full">
                <AlertTriangle className="w-3 h-3" />
                URGENT
              </span>
            )}
            {selectedMessage.archive && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                <Archive className="w-3 h-3" />
                Archivé
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {formatFullDate(selectedMessage.created_at)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 bg-card border-b border-border flex items-center gap-2">
          {!selectedMessage.lu && (
            <button
              onClick={() => markAsRead(selectedMessage.id)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Marquer lu
            </button>
          )}
          <button
            onClick={() => handleArchive(selectedMessage.id)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
          >
            {selectedMessage.archive ? (
              <>
                <ArchiveRestore className="w-4 h-4" />
                Restaurer
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                Archiver
              </>
            )}
          </button>
          <button
            onClick={() => handleDelete(selectedMessage.id)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              confirmDelete === selectedMessage.id
                ? 'text-white bg-red-500 hover:bg-red-600'
                : 'text-red-600 bg-red-50 hover:bg-red-100'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {confirmDelete === selectedMessage.id ? 'Confirmer' : 'Supprimer'}
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <p className="text-foreground whitespace-pre-wrap leading-relaxed text-[15px]">
              {selectedMessage.contenu}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Vue liste
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header avec onglets */}
      <div className="bg-card border-b border-border">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-foreground">Messages</h1>
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
              </span>
            )}
          </div>

          {/* Onglets */}
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('actifs')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'actifs'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Inbox className="w-4 h-4" />
                Actifs ({activeMessages.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('archives')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'archives'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Archive className="w-4 h-4" />
                Archives ({archivedMessages.length})
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : currentMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-5">
              {activeTab === 'actifs' ? (
                <Mail className="w-12 h-12 text-muted-foreground/50" />
              ) : (
                <Archive className="w-12 h-12 text-muted-foreground/50" />
              )}
            </div>
            <p className="text-lg font-medium text-foreground mb-1">
              {activeTab === 'actifs' ? 'Aucun message' : 'Aucune archive'}
            </p>
            <p className="text-sm text-muted-foreground text-center">
              {activeTab === 'actifs'
                ? 'Vos messages apparaîtront ici'
                : 'Vos messages archivés apparaîtront ici'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {currentMessages.map(msg => {
              const isUnread = !msg.lu
              const isUrgent = msg.priorite === 'urgente'

              return (
                <button
                  key={msg.id}
                  onClick={() => handleSelect(msg)}
                  className={`w-full text-left px-4 py-4 transition-colors active:bg-muted/50 ${
                    isUnread ? 'bg-primary/5' : 'bg-card'
                  } ${isUrgent && !msg.archive ? 'border-l-4 border-l-red-500' : ''}`}
                >
                  <div className="flex gap-3">
                    {/* Icône */}
                    <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${
                      isUrgent && !msg.archive
                        ? 'bg-red-100'
                        : isUnread
                          ? 'bg-primary/15'
                          : 'bg-muted'
                    }`}>
                      {isUnread ? (
                        <Mail className={`w-5 h-5 ${isUrgent ? 'text-red-600' : 'text-primary'}`} />
                      ) : (
                        <MailOpen className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      {/* Ligne 1: Sujet + badge urgent */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`flex-1 truncate text-[15px] ${
                          isUnread ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'
                        }`}>
                          {msg.sujet || "(Sans sujet)"}
                        </span>
                        {isUrgent && !msg.archive && (
                          <span className="flex-shrink-0 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded">
                            URGENT
                          </span>
                        )}
                      </div>

                      {/* Ligne 2: Aperçu du contenu */}
                      <p className={`text-sm truncate mb-1.5 ${
                        isUnread ? 'text-muted-foreground' : 'text-muted-foreground/70'
                      }`}>
                        {msg.contenu}
                      </p>

                      {/* Ligne 3: Date */}
                      <p className="text-xs text-muted-foreground/60">
                        {formatDate(msg.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
