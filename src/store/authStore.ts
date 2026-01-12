import { create } from "zustand"
import { supabase } from "../lib/supabase"

interface AuthState {
  user: any
  profile: any
  loading: boolean
  initialize: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single()
      set({ user: session.user, profile, loading: false })
    } else {
      set({ loading: false })
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()
        set({ user: session.user, profile })
      } else {
        set({ user: null, profile: null })
      }
    })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  }
}))