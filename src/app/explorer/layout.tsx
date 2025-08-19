'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { ethers } from 'ethers'
import { useAccount, useWatchContractEvent, useClient, type Config } from 'wagmi'
import abi from "../../../public/Flexor.json"
import { FLEXOR_ADDRESS } from '@/lib/utils'
import { hostNetwork } from '@/config/wagmi'
import { ExplorerCacheContext } from '@/components/ExplorerCachContext'
import { getLastBlockByChainId } from './utils'
import { GoldRushClient } from "@covalenthq/client-sdk";
import { getGoldrushLogs } from '@/actions/getGoldrushLogs'

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

  useEffect(() => {
    if (!provider) return

    let cancelled = false

    async function fetchPastEvents() {
      try {


        let pastEvents: (ethers.Log | ethers.EventLog)[] = []
        let goldRushData: any[] = []
        let fromBlock = Math.max(Number((await getLastBlockByChainId(hostNetwork.id)).number) - 1000, 0)
        let toBlock: 'latest' | number = 'latest'
        for (let index = 0; index < 10 && fromBlock >= 0; index++) {
          console.log("here", index)
          let logs = await getGoldrushLogs(fromBlock, toBlock)
          console.log(logs)

          goldRushData = goldRushData.concat(logs)
          const pastItems = goldRushData.map((event) => {
            const data = ethers.AbiCoder.defaultAbiCoder().decode(["uint256", "string", "uint256", "uint"], event.raw_log_data)
            return {
              id: data[0] as string,
              address: ethers.AbiCoder.defaultAbiCoder().decode(["address"], event.raw_log_topics[1]!).toString(),
              name: data[1] as string,
              txHash: event.tx_hash,
              chainId: BigInt(event.raw_log_topics[3]!).toString(),
              balance_target: data[2] as string,
              blockNumber: event.block_height,
              timestamp: event.block_height, // could add real timestamp if needed
              tip: data[3] as string
            }
          }).reverse()
          setItems((prev) => {
            const newTxHashes = new Set(prev.map((item) => item.txHash))
            const uniquePast = pastItems.filter((item) => !newTxHashes.has(item.txHash))
            return [...prev, ...uniquePast].slice(-1000)
          })

          toBlock = fromBlock
          fromBlock = toBlock - 1000000
        }

        console.log("Arrived")
        console.log(pastEvents)

        if (cancelled) return

      } catch (e) {
        console.error('Error fetching past events:', e)
      }
    }

    fetchPastEvents().catch(e => console.error('Error fetching past events:', e))

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
