import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"

export default function MessagesTab() {
  const [messages, setMessages] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("destinataire_id", user.id)
      .order("created_at", { ascending: false })

    setMessages(data || [])
  }

  const markAsRead = async (msg: any) => {
    if (msg.lu) return
    await supabase.from("messages").update({ lu: true }).eq("id", msg.id)
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, lu: true } : m))
  }

  return (
    <div className="p-4">
      <h2 className="font-bold mb-4">Messages</h2>
      <div className="space-y-2">
        {messages.length === 0 ? (
          <p className="text-[var(--muted-foreground)]">Aucun message</p>
        ) : (
          messages.map(m => (
            <button
              key={m.id}
              onClick={() => { setSelected(m); markAsRead(m) }}
              className={`w-full text-left card p-3 ${!m.lu ? "border-[#F59E0B]" : ""}`}
            >
              <p className={`${!m.lu ? "font-bold" : ""}`}>{m.sujet || "(Sans sujet)"}</p>
              <p className="text-sm text-[var(--muted-foreground)] truncate">{m.contenu}</p>
            </button>
          ))
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
          <div className="relative bg-[var(--card)] rounded-t-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] flex justify-between">
              <h3 className="font-semibold">{selected.sujet || "(Sans sujet)"}</h3>
              <button onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="p-4">
              <p>{selected.contenu}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}