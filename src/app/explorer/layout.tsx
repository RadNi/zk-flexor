'use client'

import React, { createContext, useState, useEffect, useRef, useMemo } from 'react'
import { ethers } from 'ethers'
import { useAccount, useWatchContractEvent, useClient, type Config } from 'wagmi'
import abi from "../../../public/Flexor.json"
import { FLEXOR_ADDRESS } from '@/lib/utils'
import { toHex } from 'viem'
import { hostNetwork, hyperliquidMainnet, localTestnet, wagmiConfig } from '@/config/wagmi'
import { ExplorerCacheContext } from '@/components/ExplorerCachContext'

export type ExplorerItem = {
  id: string
  name: string
  balance_target: string,
  txHash: string
  address: string
  chainId: string
  status?: 'verified' | 'rejected' | 'warning'
  message?: string
  statusMessage?: string,
  tip: string
}



export default function ExplorerLayout({ children }: { children: React.ReactNode }) {
  const account = useAccount()
    const client = useClient<Config>({ chainId: account.chainId })
    const provider = useMemo(() => {
    return client ? new ethers.JsonRpcProvider(hostNetwork.rpcUrls.default.http[0]) : null
    }, [client])

  const [items, setItems] = useState<ExplorerItem[]>([]);
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
            const data = ethers.AbiCoder.defaultAbiCoder().decode(["uint256", "string", "uint256", "uint"], event.data)
            console.log(data[2])
          return {
            id: data[0],
            address: ethers.AbiCoder.defaultAbiCoder().decode(["address"], event.topics[1]!).toString(),
            name: data[1],
            txHash: event.transactionHash,
            chainId: BigInt(event.topics[3]!).toString(),
            balance_target: data[2],
            // message: "",
            blockNumber: event.blockNumber,
            timestamp: event.blockNumber, // could add real timestamp if needed
            tip: data[3]
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
    eventName: 'Claim',
    chainId: hostNetwork.id,
    onLogs(logs) {
      // log is the parsed event args
      console.log(logs)
      logs.map(log => {
      const { transactionHash } = log
      console.log("inja", log)

      // Add new unique event at the **front** of list
      if ("args" in log) {
        console.log(log.args)
        const args = log.args as {index: bigint, user: string, hl_name: string, chainId: bigint, balance_target: bigint, tip: bigint}
      setItems((prev) => {
        // Use Set directly from `prev` items instead of mutable ref
        const existingTxs = new Set(prev.map((item) => item.txHash))
        if (existingTxs.has(transactionHash!)) return prev

        return [
          {
            id: args.index.toString(),
            address: args.user,
            name: args.hl_name,
            txHash: transactionHash!,
            chainId: args.chainId.toString(),
            balance_target: args.balance_target.toString(),
            message: "",
            blockNumber: null,
            timestamp: Date.now(),
            tip: args.tip.toString(),
          },
          ...prev,
        ].slice(0, 1000)
      })
    }
    })},
  })

  return (
    <ExplorerCacheContext.Provider value={{ items, setItems }}>
      {children}
    </ExplorerCacheContext.Provider>
  )
}
