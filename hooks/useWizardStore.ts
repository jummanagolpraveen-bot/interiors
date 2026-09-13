import { create } from 'zustand'

export type ProjectDetails = {
  name: string
  homeType: string
  budgetBand: string
}

export type RoomDetails = {
  type: string
  dimensions: string
  style: string
  palette: string
}

type WizardState = {
  step: number
  project: ProjectDetails
  room: RoomDetails
  file: File | null
  setStep: (step: number) => void
  setProject: (project: Partial<ProjectDetails>) => void
  setRoom: (room: Partial<RoomDetails>) => void
  setFile: (file: File | null) => void
}

export const useWizardStore = create<WizardState>((set) => ({
  step: 1,
  project: {
    name: '',
    homeType: '',
    budgetBand: '',
  },
  room: {
    type: '',
    dimensions: '',
    style: '',
    palette: '',
  },
  file: null,
  setStep: (step) => set({ step }),
  setProject: (project) => set((state) => ({ project: { ...state.project, ...project } })),
  setRoom: (room) => set((state) => ({ room: { ...state.room, ...room } })),
  setFile: (file) => set({ file }),
}))
