import { useState } from "react"
import { supabase } from "../../lib/supabase"

interface Props {
  onClose: () => void
  onSent: () => void
}

export default function NewMessageModal({ onClose, onSent }: Props) {
  const [sujet, setSujet] = useState("")
  const [contenu, setContenu] = useState("")
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!contenu.trim()) return
    setSending(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("messages").insert({
      expediteur_id: user.id,
      destinataire_id: user.id,
      sujet: sujet || null,
      contenu: contenu.trim(),
      priorite: "normale"
    })

    setSending(false)
    onSent()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--card)] rounded-t-2xl w-full max-w-lg">
        <div className="p-4 border-b border-[var(--border)] flex justify-between">
          <h3 className="font-semibold">Nouvelle note</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="p-4 space-y-4">
          <input
            type="text"
            placeholder="Sujet (optionnel)"
            value={sujet}
            onChange={e => setSujet(e.target.value)}
            className="input"
          />
          <textarea
            placeholder="Votre message..."
            value={contenu}
            onChange={e => setContenu(e.target.value)}
            rows={4}
            className="input h-auto py-2"
          />
        </div>
        <div className="p-4 border-t border-[var(--border)] flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border border-[var(--border)] rounded-lg">Annuler</button>
          <button onClick={handleSend} disabled={sending} className="flex-1 btn-primary">
            {sending ? "..." : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  )
}