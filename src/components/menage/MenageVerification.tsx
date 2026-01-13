import { useState, useEffect, useRef } from 'react'
import { 
  X, 
  Clock, 
  Camera, 
  MessageCircle, 
  Bed, 
  CheckCircle, 
  Loader2,
  Trash2,
  Play,
  Square,
  Image as ImageIcon,
  AlertCircle,
  Eye
} from 'lucide-react'
import { useMenageStore, Menage } from '../../store/menageStore'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'

interface Props {
  menageId: string
  onClose: () => void
}

function getTypeBadge(typeCode: string | undefined): { label: string; fullLabel: string; className: string } {
  switch (typeCode) {
    case 'sortie':
    case 'depart':
      return { label: 'S', fullLabel: 'Sortie', className: 'bg-red-500 text-white' }
    case 'hebdomadaire':
      return { label: 'H', fullLabel: 'Hebdomadaire', className: 'bg-amber-500 text-white' }
    case 'verification':
    case 'intermediaire':
      return { label: 'V', fullLabel: 'Vérification', className: 'bg-purple-500 text-white' }
    default:
      return { label: '?', fullLabel: 'Inconnu', className: 'bg-gray-500 text-white' }
  }
}

function formatDateLong(date: Date): string {
  return date.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  })
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function MenageVerification({ menageId, onClose }: Props) {
  const { menages, loadMenages } = useMenageStore()
  const menage = menages.find(m => m.id === menageId)
  
  const [heureDebut, setHeureDebut] = useState('')
  const [heureFin, setHeureFin] = useState('')
  const [commentaireAgent, setCommentaireAgent] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Commentaire du concierge (readonly)
  const commentaireConcierge = menage?.commentaire || ''
  
  // Vérifier si le ménage est en lecture seule (vérifié par concierge)
  const isReadOnly = menage?.validation?.code === 'verifie-concierge'

  useEffect(() => {
    if (menage) {
      setHeureDebut(menage.heure_debut || '')
      setHeureFin(menage.heure_fin || '')
      setCommentaireAgent(menage.commentaire_agent || '')
      setPhotos(menage.photos_agent || [])
    }
  }, [menage])

  if (!menage) return null

  const typeBadge = getTypeBadge(menage.type_menage?.code)
  const date = new Date(menage.date_prevue)
  const apptName = menage.appartement?.nom || menage.appartement?.diminutif || 'Appartement'

  const handleStartTimer = () => {
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    setHeureDebut(timeStr)
  }

  const handleStopTimer = () => {
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    setHeureFin(timeStr)
  }

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    for (const file of Array.from(files)) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setPhotos(prev => [...prev, base64])
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const getDuration = () => {
    if (!heureDebut || !heureFin) return null
    
    const [sh, sm] = heureDebut.split(':').map(Number)
    const [eh, em] = heureFin.split(':').map(Number)
    
    const startMinutes = sh * 60 + sm
    const endMinutes = eh * 60 + em
    const diff = endMinutes - startMinutes
    
    if (diff < 0) return null
    
    const hours = Math.floor(diff / 60)
    const minutes = diff % 60
    
    if (hours === 0) return `${minutes}min`
    return `${hours}h${minutes > 0 ? minutes : ''}`
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const hasCommentaire = commentaireAgent && commentaireAgent.trim().length > 0
      const hasPhotos = photos.length > 0
      const hasProbleme = hasCommentaire || hasPhotos

      // 1. Déterminer le statut
      let newValidationCode = 'verifie-agent'
      if (hasProbleme) {
        newValidationCode = 'probleme'
      }

      // Récupérer l'ID du statut
      const { data: statusData } = await supabase
        .from('validations_check_menage')
        .select('id')
        .eq('code', newValidationCode)
        .single()

      if (!statusData) {
        console.error('Statut non trouvé:', newValidationCode)
        alert('Erreur: statut non trouvé')
        setSaving(false)
        return
      }

      // 2. Mettre à jour le ménage
      const { error: updateError } = await supabase
        .from('menages')
        .update({
          heure_debut: heureDebut || null,
          heure_fin: heureFin || null,
          commentaire_agent: commentaireAgent || null,
          photos_agent: photos.length > 0 ? photos : null,
          validation_id: statusData.id,
          probleme: hasProbleme,
          date_verification_agent: new Date().toLocaleString('sv-SE', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }).replace(' ', 'T'),
          updated_at: new Date().toISOString()
        })
        .eq('id', menageId)

      if (updateError) {
        console.error('Erreur update ménage:', updateError)
        alert('Erreur lors de l\'enregistrement')
        setSaving(false)
        return
      }

      // 3. Envoyer message urgent si problème signalé
      if (hasProbleme) {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Récupérer l'ID utilisateur (table users) depuis auth_id
          const { data: expediteurData } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single()

          const expediteurId = expediteurData?.id

          if (!expediteurId) {
            console.error('Expéditeur non trouvé pour auth_id:', user.id)
          } else {
            // Trouver la zone via la résidence de l'appartement
            let zoneId: string | null = menage.appartement?.residence?.zone_id || null

            // Si zone_id pas en cache, le récupérer depuis la BDD
            if (!zoneId && menage.appartement?.residence_id) {
              const { data: residenceData } = await supabase
                .from('residences')
                .select('zone_id')
                .eq('id', menage.appartement.residence_id)
                .single()
              zoneId = residenceData?.zone_id || null
            }

            console.log('Zone ID pour message:', zoneId)

            let conciergeId: string | null = null

            if (zoneId) {
              // Chercher un admin actif avec cette zone assignée
              const { data: conciergeData, error: conciergeError } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'admin')
                .eq('actif', true)
                .contains('zones_assignees', [zoneId])
                .limit(1)

              console.log('Recherche concierge:', { conciergeData, conciergeError })

              if (conciergeData && conciergeData.length > 0) {
                conciergeId = conciergeData[0].id
              }
            }

            console.log('Concierge ID trouvé:', conciergeId)

            if (conciergeId) {
              let contenu = `${apptName} - ${formatDateLong(date)}\n\n`
              if (hasCommentaire) {
                contenu += commentaireAgent
              }
              if (hasPhotos) {
                contenu += `${hasCommentaire ? '\n\n' : ''}📷 ${photos.length} photo(s)`
              }

              const { error: messageError } = await supabase
                .from('messages')
                .insert({
                  expediteur_id: expediteurId,
                  destinataire_id: conciergeId,
                  sujet: `⚠️ Problème signalé: ${apptName}`,
                  contenu: contenu,
                  priorite: 'urgente',
                  lu: false,
                  archive: false,
                  date_affichage: new Date().toISOString().split('T')[0]
                })

              if (messageError) {
                console.error('Erreur envoi message:', messageError)
              } else {
                console.log('Message envoyé au concierge:', conciergeId)
              }
            } else {
              console.warn('Aucun concierge trouvé pour la zone:', zoneId)
            }
          }
        }
      }

      // 4. Recharger les ménages
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await loadMenages(user.id)
      }

      setSaving(false)
      onClose()

    } catch (err) {
      console.error('Erreur:', err)
      alert('Une erreur est survenue')
      setSaving(false)
    }
  }

  const duration = getDuration()

  // ========== MODE LECTURE SEULE (vérifié concierge) ==========
  if (isReadOnly) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-card rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center gap-3">
              <span className={`w-10 h-10 flex items-center justify-center rounded-xl text-lg font-bold ${typeBadge.className}`}>
                {typeBadge.label}
              </span>
              <div>
                <h3 className="font-semibold text-foreground">{apptName}</h3>
                <p className="text-xs text-muted-foreground">
                  {formatDateLong(date)} • {typeBadge.fullLabel}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Badge lecture seule */}
          <div className="mx-4 mt-4 flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-700 dark:text-green-300">Ménage validé par le concierge</span>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Résumé temps */}
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-foreground">Temps de travail</span>
                {duration && (
                  <span className="ml-auto text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {duration}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Début</p>
                  <p className="font-medium">{menage.heure_debut || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fin</p>
                  <p className="font-medium">{menage.heure_fin || '—'}</p>
                </div>
              </div>
            </div>

            {/* Dates de vérification */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-foreground">Vérifications</span>
              </div>
              
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vérifié par agent</span>
                  <span className="font-medium">{formatDateTime((menage as any).date_verification_agent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Validé par concierge</span>
                  <span className="font-medium">{formatDateTime((menage as any).date_verification_concierge)}</span>
                </div>
              </div>
            </div>

            {/* Commentaire agent si présent */}
            {menage.commentaire_agent && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">Votre commentaire</span>
                </div>
                <p className="text-sm text-orange-600 dark:text-orange-400">{menage.commentaire_agent}</p>
              </div>
            )}

            {/* Photos agent si présentes */}
            {menage.photos_agent && menage.photos_agent.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="w-5 h-5 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Vos photos</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {menage.photos_agent.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="aspect-square object-cover rounded-xl"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button onClick={onClose} className="w-full h-12">
              Fermer
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ========== MODE ÉDITION ==========
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-card rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <span className={`w-10 h-10 flex items-center justify-center rounded-xl text-lg font-bold ${typeBadge.className}`}>
              {typeBadge.label}
            </span>
            <div>
              <h3 className="font-semibold text-foreground">{apptName}</h3>
              <p className="text-xs text-muted-foreground">
                {formatDateLong(date)} • {typeBadge.fullLabel}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Linge reminder - cadre bleu */}
          {menage.remplacement_linge && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <Bed className="w-6 h-6 text-blue-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-700 dark:text-blue-300">Linge à remplacer</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Pensez à changer le linge de ce logement</p>
              </div>
            </div>
          )}

          {/* Commentaire concierge - cadre orange */}
          {commentaireConcierge && (
            <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
              <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-700 dark:text-orange-300">Instructions du concierge</p>
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-1 whitespace-pre-wrap">{commentaireConcierge}</p>
              </div>
            </div>
          )}

          {/* Timer Section */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">Temps de travail</span>
              {duration && (
                <span className="ml-auto text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {duration}
                </span>
              )}
            </div>

            {/* Quick timer buttons */}
            <div className="flex gap-2 mb-3">
              {!heureDebut ? (
                <button
                  onClick={handleStartTimer}
                  className="flex-1 flex items-center justify-center gap-2 h-12 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors shadow-sm"
                >
                  <Play className="w-5 h-5" />
                  Démarrer
                </button>
              ) : !heureFin ? (
                <button
                  onClick={handleStopTimer}
                  className="flex-1 flex items-center justify-center gap-2 h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors shadow-sm"
                >
                  <Square className="w-5 h-5" />
                  Terminer
                </button>
              ) : (
                <div className="flex-1 flex items-center justify-center gap-2 h-12 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl font-semibold">
                  <CheckCircle className="w-5 h-5" />
                  Ménage terminé
                </div>
              )}
            </div>

            {/* Manual time inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Début</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={heureDebut}
                  onChange={(e) => {
                    let val = e.target.value.replace(/[^0-9:]/g, '')
                    if (val.length === 2 && !val.includes(':') && heureDebut.length < val.length) {
                      val = val + ':'
                    }
                    if (val.length <= 5) {
                      setHeureDebut(val)
                    }
                  }}
                  placeholder="HH:MM"
                  maxLength={5}
                  className="w-full h-11 px-3 text-sm text-center font-medium bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Fin</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={heureFin}
                  onChange={(e) => {
                    let val = e.target.value.replace(/[^0-9:]/g, '')
                    if (val.length === 2 && !val.includes(':') && heureFin.length < val.length) {
                      val = val + ':'
                    }
                    if (val.length <= 5) {
                      setHeureFin(val)
                    }
                  }}
                  placeholder="HH:MM"
                  maxLength={5}
                  className="w-full h-11 px-3 text-sm text-center font-medium bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Commentaire agent */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">Signaler un problème</span>
            </div>
            <textarea
              value={commentaireAgent}
              onChange={(e) => setCommentaireAgent(e.target.value)}
              placeholder="Décrire le problème rencontré..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
            <p className="text-[10px] text-muted-foreground mt-1">⚠️ Un commentaire ou une photo enverra une alerte au concierge</p>
          </div>

          {/* Photos */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Camera className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">Photos</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <button
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-1.5 right-1.5 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square flex flex-col items-center justify-center gap-1 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <ImageIcon className="w-7 h-7 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium">Ajouter</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handlePhotoCapture}
              className="hidden"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-border bg-muted/30">
          <Button variant="outline" onClick={onClose} className="flex-1 h-12">
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-12"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}