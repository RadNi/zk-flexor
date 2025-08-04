"use client"

import type { ExplorerItem } from "@/app/explorer/layout"
import { createContext } from "react"

export const ExplorerCacheContext = createContext<{
  items: ExplorerItem[]
  setItems: React.Dispatch<React.SetStateAction<ExplorerItem[]>>
}>({
  items: [],
  setItems: () => undefined
})