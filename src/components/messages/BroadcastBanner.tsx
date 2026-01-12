import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"

export default function BroadcastBanner() {
  const [message, setMessage] = useState<any>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    loadUrgent()
  }, [])

  const loadUrgent = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("destinataire_id", user.id)
      .eq("priorite", "urgente")
      .eq("lu", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (data) setMessage(data)
  }

  if (!message || hidden) return null

  return (
    <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span>📢</span>
        <span className="text-sm">{message.contenu}</span>
      </div>
      <button onClick={() => setHidden(true)} className="text-white/80 hover:text-white">✕</button>
    </div>
  )
}