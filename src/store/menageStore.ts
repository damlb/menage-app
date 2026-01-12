import { create } from "zustand"
import { persist } from "zustand/middleware"
import { supabase } from "../lib/supabase"

export interface Menage {
  id: string
  date_prevue: string
  heure_debut: string | null
  heure_fin: string | null
  commentaire: string | null
  commentaire_agent: string | null
  remplacement_linge: boolean
  probleme: boolean
  photos: string[] | null
  photos_agent: string[] | null
  agent_id: string
  appartement_id: string
  type_menage_id: string
  validation_id: string
  created_by: string | null
  date_verification_agent: string | null
  date_verification_concierge: string | null
  appartement: {
    id: string
    nom: string
    diminutif: string
    residence_id: string
    residence: {
      id: string
      nom: string
      diminutif: string
    } | null
  } | null
  type_menage: {
    id: string
    code: string
    nom: string
  } | null
  validation: {
    id: string
    code: string
    nom: string
  } | null
}

export interface Residence {
  id: string
  nom: string
  diminutif: string
}

interface MenageState {
  menages: Menage[]
  residences: Residence[]
  selectedResidence: string
  loading: boolean
  error: string | null
  loadMenages: (agentId: string) => Promise<void>
  setSelectedResidence: (id: string) => void
  updateMenage: (id: string, data: Partial<Menage>) => Promise<void>
}

export const useMenageStore = create<MenageState>()(
  persist(
    (set, get) => ({
      menages: [],
      residences: [],
      selectedResidence: '',
      loading: false,
      error: null,

      loadMenages: async (agentId: string) => {
        set({ loading: true, error: null })
        
        try {
          console.log("Chargement ménages pour agent:", agentId)
          
          const { data, error: menagesError } = await supabase
            .from("menages")
            .select(`
              id,
              date_prevue,
              heure_debut,
              heure_fin,
              commentaire,
              commentaire_agent,
              remplacement_linge,
              probleme,
              photos,
              photos_agent,
              agent_id,
              appartement_id,
              type_menage_id,
              validation_id,
              created_by,
              date_verification_agent,
              date_verification_concierge,
              appartement:appartements(
                id, 
                nom, 
                diminutif, 
                residence_id,
                residence:residences(id, nom, diminutif)
              ),
              type_menage:types_menage(id, code, nom),
              validation:validations_check_menage(id, code, nom)
            `)
            .eq("agent_id", agentId)
            .order("date_prevue", { ascending: true })

          if (menagesError) {
            console.error("Erreur chargement ménages:", menagesError)
            set({ error: menagesError.message, loading: false })
            return
          }

          const menagesList = (data ?? []) as unknown as Menage[]
          console.log("Ménages chargés:", menagesList.length)

          // Charger les zones de l'agent
          const { data: userData } = await supabase
            .from("users")
            .select("zones_assignees")
            .eq("id", agentId)
            .single()

          const zonesAgent: string[] = userData?.zones_assignees || []

          // Charger les résidences des zones de l'agent
          let residencesList: Residence[] = []
          if (zonesAgent.length > 0) {
            const { data: resData, error: resError } = await supabase
              .from("residences")
              .select("id, nom, diminutif")
              .in("zone_id", zonesAgent)
              .order("nom")

            if (!resError && resData) {
              residencesList = resData as Residence[]
            }
          }

          set({ 
            menages: menagesList, 
            residences: residencesList,
            loading: false 
          })
        } catch (err) {
          console.error("Erreur:", err)
          set({ error: String(err), loading: false })
        }
      },

      setSelectedResidence: (id: string) => {
        set({ selectedResidence: id })
      },

      updateMenage: async (id: string, data: Partial<Menage>) => {
        const { error } = await supabase
          .from("menages")
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq("id", id)

        if (error) {
          console.error("Erreur update ménage:", error)
          return
        }
        
        const current = get().menages
        set({
          menages: current.map(m => m.id === id ? { ...m, ...data } : m)
        })
      }
    }),
    { name: "menage-data" }
  )
)