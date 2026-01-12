import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"
import Login from "./pages/Login"
import Home from "./pages/Home"

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  return user ? <Home /> : <Login />
}
