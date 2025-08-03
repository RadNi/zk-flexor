'use client'

import React, { createContext, useState, useEffect, useRef, useMemo } from 'react'
import { ethers } from 'ethers'
import { useAccount, useWatchContractEvent, useClient, type Config } from 'wagmi'
import { wagmiConfig } from '@/config/wagmi' // your config
import abi from "../../../public/Flexor.json"
import { FLEXOR_ADDRESS } from '@/lib/utils'
import { fromHex, toHex } from 'viem'

export type ExplorerItem = {
  id: string
  name: string
  balance_target: string,
  txHash: string
  address: string
  chainId: string
  status?: 'verified' | 'rejected' | 'warning'
  message?: string
  statusMessage?: string
}

export const ExplorerCacheContext = createContext<{
  items: ExplorerItem[]
  setItems: React.Dispatch<React.SetStateAction<ExplorerItem[]>>
}>({
  items: [],
  setItems: () => {},
})

export default function ExplorerLayout({ children }) {
  const account = useAccount()
    const client = useClient<Config>({ chainId: account.chainId })
    const provider = useMemo(() => {
    return client ? new ethers.JsonRpcProvider(client.transport.url) : null
    }, [client])

  const [items, setItems] = useState([]) // all cached items
  const txHashSet = useRef(new Set())

  // Utility: convert bytes32 txHash to hex string
//   const bytes32ToHexString = (bytes32) => ethers.utils.hexlify(bytes32)

  // Fetch past events once on mount or when provider/chain changes
  useEffect(() => {
    if (!provider || !account.chain) return

    let cancelled = false

    async function fetchPastEvents() {
      try {
        console.log(provider)
        const contract = new ethers.Contract(FLEXOR_ADDRESS, abi, provider)
        // Filter all ProofSubmitted events

        // Query past events - adjust fromBlock as needed (e.g., deployment block)
        const fromBlock = 0
        const toBlock = 'latest'
        const pastEvents = await contract.queryFilter("Claim", fromBlock, toBlock)

        if (cancelled) return


        const pastItems = pastEvents.map((event) => {
            console.log(event)
            const data = ethers.AbiCoder.defaultAbiCoder().decode(["uint256", "string", "uint256"], event.data)
            console.log(data[2])
          return {
            id: data[0],
            address: ethers.AbiCoder.defaultAbiCoder().decode(["address"], event.topics[1]!).toString(),
            name: data[1],
            txHash: event.transactionHash,
            chainId: BigInt(event.topics[3]!),
            balance_target: data[2],
            message: "sag is here",
            blockNumber: event.blockNumber,
            timestamp: event.blockNumber, // could add real timestamp if needed
          }
        }).reverse()

        // Add new unique events at the **end** of current items
        setItems((prev) => {
          const newTxHashes = new Set(prev.map((item) => item.txHash))
          const uniquePast = pastItems.filter((item) => !newTxHashes.has(item.txHash))
          return [...prev, ...uniquePast].slice(-1000)
        })
      } catch (e) {
        console.error('Error fetching past events:', e)
      }
    }

    fetchPastEvents()

    return () => {
      cancelled = true
    }
  }, [provider])

  // Listen for new ProofSubmitted events (realtime)
  useWatchContractEvent({
    address: FLEXOR_ADDRESS,
    abi: abi,
    eventName: 'ProofSubmitted',
    listener(log) {
      // log is the parsed event args
      const { id, address, name, txHash, chainId, message, balance_target } = log
      const txHashStr = toHex(txHash)
      console.log("inja", log)

      // Add new unique event at the **front** of list
      setItems((prev) => {
        if (txHashSet.current.has(txHashStr)) return prev

        txHashSet.current.add(txHashStr)

        return [
          {
            id: id.toNumber(),
            address,
            name,
            txHash: txHashStr,
            chainId: chainId.toNumber(),
            balance_target: balance_target,
            message,
            blockNumber: null, // realtime event may not have blockNumber yet
            timestamp: Date.now(),
          },
          ...prev,
        ].slice(0, 1000)
      })
    },
  })

  return (
    <ExplorerCacheContext.Provider value={{ items, setItems }}>
      {children}
    </ExplorerCacheContext.Provider>
  )
}
