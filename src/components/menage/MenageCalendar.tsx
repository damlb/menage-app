import { useState, useMemo } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Bed,
  MessageCircle,
  AlertTriangle,
  X,
  Clock,
  CheckCircle,
  Calendar,
  ChevronDown
} from 'lucide-react'
import { useMenageStore, Menage } from '../../store/menageStore'

type ViewMode = 'month' | 'week' | '3days'

const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const DAYS_LETTER = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateLong(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function isToday(date: Date): boolean {
  const today = new Date()
  return date.getDate() === today.getDate() && 
         date.getMonth() === today.getMonth() && 
         date.getFullYear() === today.getFullYear()
}

function isSunday(date: Date): boolean {
  return date.getDay() === 0
}

function getStatusColor(code: string | undefined): string {
  switch (code) {
    case 'a-faire': return 'bg-gray-100 border-l-gray-400'
    case 'verifie-agent': return 'bg-amber-100 border-l-amber-500'
    case 'probleme': return 'bg-red-100 border-l-red-500'
    case 'verifie-concierge': return 'bg-green-100 border-l-green-500'
    case 'rejete-concierge': return 'bg-orange-100 border-l-orange-500'
    default: return 'bg-gray-100 border-l-gray-400'
  }
}

function getStatusBadge(code: string | undefined): { label: string; className: string } {
  switch (code) {
    case 'a-faire': return { label: 'À faire', className: 'bg-gray-200 text-gray-700' }
    case 'verifie-agent': return { label: 'Vérifié', className: 'bg-amber-200 text-amber-800' }
    case 'probleme': return { label: 'Problème', className: 'bg-red-200 text-red-800' }
    case 'verifie-concierge': return { label: 'Validé', className: 'bg-green-200 text-green-800' }
    case 'rejete-concierge': return { label: 'Rejeté', className: 'bg-orange-200 text-orange-800' }
    default: return { label: 'À faire', className: 'bg-gray-200 text-gray-700' }
  }
}

function getTypeBadge(code: string | undefined): { label: string; className: string } {
  switch (code) {
    case 'sortie':
    case 'depart':
      return { label: 'S', className: 'bg-red-500 text-white' }
    case 'hebdomadaire':
      return { label: 'H', className: 'bg-amber-500 text-white' }
    case 'verification':
    case 'intermediaire':
      return { label: 'V', className: 'bg-purple-500 text-white' }
    default:
      return { label: '?', className: 'bg-gray-500 text-white' }
  }
}

interface Props {
  onMenageClick?: (menageId: string) => void
}

export default function MenageCalendar({ onMenageClick }: Props) {
  const { menages, residences, selectedResidence, setSelectedResidence, loading } = useMenageStore()
  const [viewMode, setViewMode] = useState<ViewMode>('3days')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showResidenceDropdown, setShowResidenceDropdown] = useState(false)
  const [selectedDayModal, setSelectedDayModal] = useState<{ date: Date; menages: Menage[] } | null>(null)

  // Filtrer par résidence
  const filteredMenages = useMemo(() => {
    if (!selectedResidence) return menages
    return menages.filter(m => m.appartement?.residence_id === selectedResidence)
  }, [menages, selectedResidence])

  const getMenagesByDay = (date: Date): Menage[] => {
    const key = formatDateKey(date)
    return filteredMenages.filter(m => m.date_prevue === key)
  }

  // Navigation
  const goToPrev = () => {
    const d = new Date(currentDate)
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1)
    else if (viewMode === 'week') d.setDate(d.getDate() - 7)
    else d.setDate(d.getDate() - 3)
    setCurrentDate(d)
  }

  const goToNext = () => {
    const d = new Date(currentDate)
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1)
    else if (viewMode === 'week') d.setDate(d.getDate() + 7)
    else d.setDate(d.getDate() + 3)
    setCurrentDate(d)
  }

  const goToToday = () => setCurrentDate(new Date())

  const selectedResidenceName = residences.find(r => r.id === selectedResidence)?.nom || 'Toutes'

  // Loading
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-8">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  // Jours à afficher
  const getDaysToShow = (): Date[] => {
    const days: Date[] = []
    const start = new Date(currentDate)

    if (viewMode === '3days') {
      for (let i = 0; i < 3; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        days.push(d)
      }
    } else if (viewMode === 'week') {
      start.setDate(start.getDate() - start.getDay())
      for (let i = 0; i < 7; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        days.push(d)
      }
    } else {
      start.setDate(1)
      start.setDate(start.getDate() - start.getDay())
      for (let i = 0; i < 42; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        days.push(d)
      }
    }
    return days
  }

  const daysToShow = getDaysToShow()

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Dropdown Résidence */}
      {residences.length > 1 && (
        <div className="px-3 pt-3 pb-2">
          <div className="relative">
            <button
              onClick={() => setShowResidenceDropdown(!showResidenceDropdown)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/50 hover:bg-muted rounded-lg text-sm transition-colors"
            >
              <span className="font-medium truncate">{selectedResidenceName}</span>
              <ChevronDown className={`w-4 h-4 shrink-0 ml-2 transition-transform ${showResidenceDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showResidenceDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-30 overflow-hidden">
                <button
                  onClick={() => { setSelectedResidence(''); setShowResidenceDropdown(false) }}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors ${!selectedResidence ? 'bg-primary/10 text-primary font-medium' : ''}`}
                >
                  Toutes les résidences
                </button>
                {residences.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setSelectedResidence(r.id); setShowResidenceDropdown(false) }}
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2 ${selectedResidence === r.id ? 'bg-primary/10 text-primary font-medium' : ''}`}
                  >
                    <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">{r.diminutif || '—'}</span>
                    <span>{r.nom}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header Navigation */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-border">
        <div className="flex items-center">
          <button onClick={goToPrev} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <button onClick={goToToday} className="px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded transition-colors">
            Auj.
          </button>
          <button onClick={goToNext} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <h2 className="text-sm font-semibold text-foreground">
          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>

        <div className="flex bg-muted rounded-lg p-0.5">
          {(['3days', 'week', 'month'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all ${
                viewMode === mode ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {mode === 'month' ? 'Mois' : mode === 'week' ? 'Sem' : '3j'}
            </button>
          ))}
        </div>
      </div>

      {/* Pas de ménages */}
      {menages.length === 0 ? (
        <div className="p-8 text-center">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucun ménage assigné</p>
        </div>
      ) : (
        <>
          {/* ========== VUE 3 JOURS ========== */}
          {viewMode === '3days' && (
            <div className="grid grid-cols-3">
              {daysToShow.map((date, idx) => {
                const dayMenages = getMenagesByDay(date)
                const today = isToday(date)

                return (
                  <div key={idx} className={`flex flex-col ${idx < 2 ? 'border-r border-border' : ''}`}>
                    {/* Header jour */}
                    <button
                      onClick={() => dayMenages.length > 0 && setSelectedDayModal({ date, menages: dayMenages })}
                      className={`px-2 py-3 text-center border-b border-border transition-colors ${
                        today ? 'bg-primary/10' : 'bg-muted/30'
                      } ${dayMenages.length > 0 ? 'hover:bg-primary/5 cursor-pointer' : ''}`}
                    >
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{DAYS_SHORT[date.getDay()]}</p>
                      <div className="flex items-center justify-center gap-1.5 mt-0.5">
                        <span className={`text-2xl font-bold ${today ? 'text-primary' : 'text-foreground'}`}>
                          {date.getDate()}
                        </span>
                        {dayMenages.length > 0 && (
                          <span className="px-1.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full">
                            {dayMenages.length}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{MONTHS[date.getMonth()].slice(0, 3)}</p>
                    </button>

                    {/* Liste ménages - scrollable */}
                    <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto" style={{ minHeight: '350px', maxHeight: '500px' }}>
                      {dayMenages.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-16">Aucun ménage</p>
                      ) : (
                        dayMenages.map(menage => {
                          const typeBadge = getTypeBadge(menage.type_menage?.code)
                          const statusColor = getStatusColor(menage.validation?.code)
                          const resCode = menage.appartement?.residence?.diminutif
                          const apptDim = menage.appartement?.diminutif || menage.appartement?.nom || '—'

                          return (
                            <button
                              key={menage.id}
                              onClick={(e) => { e.stopPropagation(); onMenageClick?.(menage.id) }}
                              className={`w-full text-left p-2 rounded-xl border-l-4 shadow-sm ${statusColor} hover:shadow-md transition-all`}
                            >
                              {/* Ligne 1: Badge + Résidence + Icônes */}
                              <div className="flex items-center gap-1.5">
                                <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold shrink-0 ${typeBadge.className}`}>
                                  {typeBadge.label}
                                </span>
                                {resCode && (
                                  <span className="text-[9px] font-mono font-medium text-muted-foreground bg-muted px-1 py-0.5 rounded">
                                    {resCode}
                                  </span>
                                )}
                                <div className="flex items-center gap-1 ml-auto shrink-0">
                                  {menage.remplacement_linge && <Bed className="w-3.5 h-3.5 text-blue-500" />}
                                  {menage.commentaire && <MessageCircle className="w-3.5 h-3.5 text-orange-500" />}
                                  {menage.probleme && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                                </div>
                              </div>
                              {/* Ligne 2: Diminutif appartement */}
                              <p className="mt-1 text-[11px] font-semibold text-foreground">
                                {apptDim}
                              </p>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ========== VUE SEMAINE ========== */}
          {viewMode === 'week' && (
            <div className="grid grid-cols-7">
              {daysToShow.map((date, idx) => {
                const dayMenages = getMenagesByDay(date)
                const today = isToday(date)
                const sunday = isSunday(date)

                return (
                  <div key={idx} className={`flex flex-col ${sunday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''} ${idx < 6 ? 'border-r border-border' : ''}`}>
                    {/* Header */}
                    <button
                      onClick={() => dayMenages.length > 0 && setSelectedDayModal({ date, menages: dayMenages })}
                      className={`p-1.5 text-center border-b border-border transition-colors ${
                        today ? 'bg-primary/10' : ''
                      } ${dayMenages.length > 0 ? 'hover:bg-primary/5 cursor-pointer' : ''}`}
                    >
                      <p className="text-[9px] text-muted-foreground">{DAYS_LETTER[date.getDay()]}</p>
                      <p className={`text-sm font-bold ${today ? 'text-primary' : 'text-foreground'}`}>
                        {date.getDate()}
                      </p>
                      {dayMenages.length > 0 && (
                        <span className="text-[9px] font-bold text-primary">({dayMenages.length})</span>
                      )}
                    </button>

                    {/* Ménages */}
                    <div className="flex-1 p-0.5 space-y-0.5 overflow-y-auto" style={{ minHeight: '150px', maxHeight: '220px' }}>
                      {dayMenages.slice(0, 5).map(menage => {
                        const typeBadge = getTypeBadge(menage.type_menage?.code)
                        const statusColor = getStatusColor(menage.validation?.code)
                        const resCode = menage.appartement?.residence?.diminutif
                        const apptDim = menage.appartement?.diminutif || '—'

                        return (
                          <button
                            key={menage.id}
                            onClick={(e) => { e.stopPropagation(); onMenageClick?.(menage.id) }}
                            className={`w-full text-left p-1 rounded border-l-2 ${statusColor} hover:shadow transition-all`}
                          >
                            <div className="flex items-center gap-0.5">
                              <span className={`w-4 h-4 flex items-center justify-center rounded text-[8px] font-bold shrink-0 ${typeBadge.className}`}>
                                {typeBadge.label}
                              </span>
                              <span className="text-[9px] truncate">
                                {resCode ? `${resCode}·` : ''}{apptDim}
                              </span>
                              {menage.remplacement_linge && <Bed className="w-2.5 h-2.5 text-blue-500 shrink-0 ml-auto" />}
                            </div>
                          </button>
                        )
                      })}
                      {dayMenages.length > 5 && (
                        <button
                          onClick={() => setSelectedDayModal({ date, menages: dayMenages })}
                          className="w-full text-[9px] text-primary font-medium py-0.5 hover:bg-primary/10 rounded"
                        >
                          +{dayMenages.length - 5}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ========== VUE MOIS ========== */}
          {viewMode === 'month' && (
            <>
              {/* Header jours */}
              <div className="grid grid-cols-7 border-b border-border">
                {DAYS_LETTER.map((d, i) => (
                  <div key={i} className={`p-1.5 text-center text-[10px] font-medium text-muted-foreground ${i === 0 ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Grille */}
              <div className="grid grid-cols-7">
                {daysToShow.map((date, idx) => {
                  const dayMenages = getMenagesByDay(date)
                  const today = isToday(date)
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                  const sunday = isSunday(date)

                  return (
                    <button
                      key={idx}
                      onClick={() => dayMenages.length > 0 && setSelectedDayModal({ date, menages: dayMenages })}
                      className={`min-h-[60px] p-1 border-b border-r border-border text-left transition-colors ${
                        !isCurrentMonth ? 'bg-muted/30' : ''
                      } ${sunday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''} ${
                        today ? 'ring-2 ring-primary ring-inset' : ''
                      } ${dayMenages.length > 0 ? 'hover:bg-primary/5 cursor-pointer' : ''}`}
                    >
                      <div className="flex items-center gap-1">
                        <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-medium ${
                          today ? 'bg-primary text-white' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {date.getDate()}
                        </span>
                        {dayMenages.length > 0 && (
                          <span className="text-[9px] font-bold text-primary">{dayMenages.length}</span>
                        )}
                      </div>
                      <div className="mt-0.5 space-y-0.5">
                        {dayMenages.slice(0, 2).map(m => {
                          const typeBadge = getTypeBadge(m.type_menage?.code)
                          return (
                            <div key={m.id} className="flex items-center gap-0.5">
                              <span className={`w-3 h-3 flex items-center justify-center rounded text-[6px] font-bold shrink-0 ${typeBadge.className}`}>
                                {typeBadge.label}
                              </span>
                              <span className="text-[8px] truncate">{m.appartement?.diminutif}</span>
                            </div>
                          )
                        })}
                        {dayMenages.length > 2 && (
                          <p className="text-[8px] text-primary font-medium">+{dayMenages.length - 2}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ========== MODAL JOUR ========== */}
      {selectedDayModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedDayModal(null)} />
          <div className="relative bg-card rounded-t-2xl sm:rounded-xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-xl">
            {/* Header modal */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">{formatDateLong(selectedDayModal.date)}</h3>
                <span className="px-2 py-0.5 bg-primary text-white text-xs font-bold rounded-full">
                  {selectedDayModal.menages.length}
                </span>
              </div>
              <button onClick={() => setSelectedDayModal(null)} className="p-1.5 hover:bg-muted rounded-lg">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Liste modal */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {selectedDayModal.menages.map(menage => {
                const typeBadge = getTypeBadge(menage.type_menage?.code)
                const statusBadge = getStatusBadge(menage.validation?.code)
                const statusColor = getStatusColor(menage.validation?.code)
                const resCode = menage.appartement?.residence?.diminutif
                const apptName = menage.appartement?.nom || '—'

                return (
                  <button
                    key={menage.id}
                    onClick={() => { setSelectedDayModal(null); onMenageClick?.(menage.id) }}
                    className={`w-full text-left p-3 rounded-xl border-l-4 ${statusColor} hover:shadow-md transition-all`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold shrink-0 ${typeBadge.className}`}>
                          {typeBadge.label}
                        </span>
                        <div className="min-w-0">
                          {resCode && (
                            <span className="text-[10px] font-mono font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {resCode}
                            </span>
                          )}
                          <p className="font-medium text-foreground mt-0.5">{apptName}</p>
                          <p className="text-xs text-muted-foreground">{menage.type_menage?.nom}</p>
                        </div>
                      </div>
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium shrink-0 ${statusBadge.className}`}>
                        {statusBadge.label === 'Validé' || statusBadge.label === 'Terminé' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {statusBadge.label}
                      </span>
                    </div>

                    {/* Indicateurs */}
                    <div className="mt-2 flex gap-2">
                      {menage.remplacement_linge && (
                        <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded px-2 py-0.5">
                          <Bed className="w-3 h-3" />
                        </span>
                      )}
                      {menage.commentaire && (
                        <span className="flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 dark:bg-orange-900/30 rounded px-2 py-0.5">
                          <MessageCircle className="w-3 h-3" />
                        </span>
                      )}
                      {menage.probleme && (
                        <span className="flex items-center gap-1 text-[10px] text-red-600 bg-red-50 dark:bg-red-900/30 rounded px-2 py-0.5">
                          <AlertTriangle className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    {menage.commentaire && (
                      <p className="mt-2 text-xs text-muted-foreground border-t border-border/50 pt-2">
                        💬 {menage.commentaire}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}