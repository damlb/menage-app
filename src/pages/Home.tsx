import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useThemeStore } from '../store/themeStore'
import { useMenageStore } from '../store/menageStore'
import MenageCalendar from '../components/menage/MenageCalendar'
import MenageVerification from '../components/menage/MenageVerification'
import MessagesTab from '../components/messages/MessagesTab'
import BroadcastBanner from '../components/messages/BroadcastBanner'
import { Home as HomeIcon, MessageSquare, Sun, Moon, LogOut } from 'lucide-react'

type Tab = 'menages' | 'messages'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('menages')
  const [user, setUser] = useState<any>(null)
  const [userPrenom, setUserPrenom] = useState<string>('')
  const [selectedMenageId, setSelectedMenageId] = useState<string | null>(null)
  const { isDark, toggle: toggleTheme } = useThemeStore()
  const { loadMenages } = useMenageStore()

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)
      if (user) {
        loadMenages(user.id)
        // Récupérer le prénom de l'utilisateur
        const { data: userData } = await supabase
          .from('users')
          .select('prenom')
          .eq('auth_id', user.id)
          .single()
        if (userData?.prenom) {
          setUserPrenom(userData.prenom)
        }
      }
    })
  }, [])

  const handleLogout = () => supabase.auth.signOut()

  const handleMenageClick = (menageId: string) => {
    setSelectedMenageId(menageId)
  }

  const handleCloseVerification = () => {
    setSelectedMenageId(null)
    // Reload menages after update
    if (user) loadMenages(user.id)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BroadcastBanner />

      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors">
            {isDark ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
          </button>

          <img src="/icons/logo.svg" alt="Ciel de Case" className="h-10" />

          <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        {userPrenom && (
          <p className="text-center text-sm text-muted-foreground mt-2">
            Bonjour {userPrenom}
          </p>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'menages' ? (
          <div className="p-4">
            <MenageCalendar onMenageClick={handleMenageClick} />
          </div>
        ) : (
          <MessagesTab />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('menages')}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'menages' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs font-medium">Ménages</span>
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'messages' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-xs font-medium">Messages</span>
          </button>
        </div>
      </nav>

      {/* Modal Vérification */}
      {selectedMenageId && (
        <MenageVerification
          menageId={selectedMenageId}
          onClose={handleCloseVerification}
        />
      )}
    </div>
  )
}