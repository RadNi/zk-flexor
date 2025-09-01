'use client'

import { ClientProver, ServerProver, type IProver } from '@/lib/utils'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ProverMode = 'client' | 'server'

type ProverContextType = {
  prover: IProver
  mode: ProverMode
  setMode: (m: ProverMode) => void
}

const ProverContext = createContext<ProverContextType | undefined>(undefined)

export function ProverProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ProverMode>('client')
  const [prover, setProver] = useState<IProver>(() => new ClientProver())

  // Load persisted preference on mount
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('proverMode') as ProverMode | null) : null
    if (saved === 'server') {
      setModeState('server')
      setProver(new ServerProver())
    }
  }, [])

  const setMode = (m: ProverMode) => {
    setModeState(m)
    setProver(m === 'client' ? new ClientProver() : new ServerProver())
    if (typeof window !== 'undefined') localStorage.setItem('proverMode', m)
  }

  const value = useMemo(() => ({ prover, mode, setMode }), [prover, mode])

  return <ProverContext.Provider value={value}>{children}</ProverContext.Provider>
}

export function useProver() {
  const ctx = useContext(ProverContext)
  if (!ctx) throw new Error('useProver must be used within <ProverProvider>')
  return ctx
}
