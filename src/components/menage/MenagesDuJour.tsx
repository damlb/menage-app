import { useMemo } from "react"

interface Props {
  date: Date
  menages: any[]
  onClose: () => void
  onMenageClick: (id: string) => void
}

export default function MenagesDuJour({ date, menages, onClose, onMenageClick }: Props) {
  const dayMenages = useMemo(() => {
    const dateStr = date.toISOString().split("T")[0]
    return menages.filter(m => m.date_prevue === dateStr)
  }, [menages, date])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--card)] rounded-t-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
          <h3 className="font-semibold">
            {date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </h3>
          <button onClick={onClose} className="text-[var(--muted-foreground)]">✕</button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-2">
          {dayMenages.length === 0 ? (
            <p className="text-center text-[var(--muted-foreground)]">Aucun ménage ce jour</p>
          ) : (
            dayMenages.map(m => (
              <button
                key={m.id}
                onClick={() => onMenageClick(m.id)}
                className="w-full text-left card p-3 hover:border-[#F59E0B]"
              >
                <p className="font-medium">{m.appartement?.nom || m.appartement?.diminutif}</p>
                <p className="text-sm text-[var(--muted-foreground)]">{m.type_menage?.nom}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}