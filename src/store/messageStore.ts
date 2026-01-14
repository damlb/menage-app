import { create } from "zustand"
import { supabase } from "../lib/supabase"

export interface Message {
  id: string
  expediteur_id: string
  destinataire_id: string
  sujet: string | null
  contenu: string
  priorite: string
  lu: boolean
  archive: boolean
  date_affichage: string | null
  created_at: string
}

interface MessageState {
  messages: Message[]
  unreadCount: number
  loading: boolean
  error: string | null
  loadMessages: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  getUrgentMessage: () => Message | null
}

export const useMessageStore = create<MessageState>()((set, get) => ({
  messages: [],
  unreadCount: 0,
  loading: false,
  error: null,

  loadMessages: async () => {
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ loading: false })
        return
      }

      // Récupérer l'ID utilisateur depuis auth_id
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single()

      if (userError || !userData) {
        console.error("Utilisateur non trouvé:", userError)
        set({ error: "Utilisateur non trouvé", loading: false })
        return
      }

      const userId = userData.id

      const { data, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("destinataire_id", userId)
        .eq("archive", false)
        .order("created_at", { ascending: false })

      if (messagesError) {
        console.error("Erreur chargement messages:", messagesError)
        set({ error: messagesError.message, loading: false })
        return
      }

      const messagesList = (data ?? []) as Message[]
      const unreadCount = messagesList.filter(m => !m.lu).length

      set({
        messages: messagesList,
        unreadCount,
        loading: false
      })
    } catch (err) {
      console.error("Erreur:", err)
      set({ error: String(err), loading: false })
    }
  },

  markAsRead: async (id: string) => {
    const { error } = await supabase
      .from("messages")
      .update({ lu: true })
      .eq("id", id)

    if (error) {
      console.error("Erreur marquer comme lu:", error)
      return
    }

    const current = get().messages
    const updated = current.map(m => m.id === id ? { ...m, lu: true } : m)
    const unreadCount = updated.filter(m => !m.lu).length

    set({ messages: updated, unreadCount })
  },

  getUrgentMessage: () => {
    const messages = get().messages
    return messages.find(m => m.priorite === 'urgente' && !m.lu) || null
  }
}))
