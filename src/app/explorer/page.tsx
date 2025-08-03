'use client'

import { useContext, useState, useEffect } from 'react'
import Link from 'next/link'
import { ExplorerCacheContext } from './layout'
import { shortenHash } from '@/hooks/utils'
import abi from '../../../public/Flexor.json'
import { fromHex, toHex } from 'viem'
import { wagmiConfig } from '@/config/wagmi'
import { FLEXOR_ADDRESS, verifyFinalProof } from '@/lib/utils'
import { readContract } from '@wagmi/core'
import { createPublicClient, http } from 'viem'
import { hashPersonalMessage } from '@ethereumjs/util'
import { ethers } from 'ethers'

const ITEMS_PER_PAGE = 10


// Find chain config by chainId from wagmiConfig.chains
function getChainById(chainId: number) {
  return wagmiConfig.chains.find((chain) => chain.id === chainId)
}

async function getBlockByChainId(chainId: number, blockNumber: bigint ) {
  const chain = getChainById(chainId)
  if (!chain) throw new Error(`Unsupported chainId ${chainId}`)

  // Create client dynamically for this chain using its first RPC url
  const client = createPublicClient({
    chain,
    transport: http(chain.rpcUrls.default.http[0]), // or chain.rpcUrls.public.http[0]
  })

  // Fetch block
  const block = await client.getBlock({ blockNumber })

  return block
}


export default function ExplorerPage() {
  const { items, setItems } = useContext(ExplorerCacheContext)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [verifying, setVerifying] = useState(new Set())

  const filteredItems = items.filter(
    (item) =>
      item.txHash.toLowerCase().includes(search.toLowerCase()) ||
      item.address.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE))
  const paginatedItems = filteredItems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [page, totalPages])

  const verifyProof = async (claimId: string) => {
    setVerifying((prev) => new Set(prev).add(claimId))

    try {
        const result = await readContract(wagmiConfig, {
            abi,
            address: FLEXOR_ADDRESS,
            functionName: 'getClaim',
            args: [claimId],
        }) as {
            proof: `0x${string}`, publicInputs: `0x${string}`, full_message: string, flexor_hl: string, flexor_address: `0x${string}`, chainId: bigint, blockNumber: bigint
        }
        const proof = fromHex(result.proof, 'bytes')
        const publicInputs = Array.from(fromHex(result.publicInputs, 'bytes'), (byte) => "0x" + byte.toString(16).padStart(2, '0')) 
        const full_message = JSON.parse(result.full_message)
        console.log('Contract result:', full_message)
        console.log(result)
        let name_check = false
        let verification_check = false
        let stateRoot_check = false
        let address_check = false
        let balance_target_check = false
        let message_hash_check = false
        
        // verify hl_name
        if ("flexor_name" in full_message)
            name_check = full_message.flexor_name.endsWith(".hl") && (result.flexor_hl === full_message.flexor_name)
        else
            name_check = result.flexor_hl === ""
        // verify address
        if ("flexor_address" in full_message)
            address_check = result.flexor_address.toLowerCase() === full_message.flexor_address.toLowerCase()
        else
            address_check = result.flexor_address === "0x0000000000000000000000000000000000000000"
        // verify stateRoot
        stateRoot_check = false

        let status_message = ""
        try {
            let block = await getBlockByChainId(+result.chainId.toString(), result.blockNumber)
            console.log(block.stateRoot)
            console.log(result.publicInputs.substring(0, 66))
            stateRoot_check = block.stateRoot === result.publicInputs.substring(0, 66)
        } catch (err) {
            status_message += (err + " - ")
        }

        // balance target
        const balance_target_length = +BigInt(publicInputs[96]!).toString()
        const balance_target = BigInt("0x" + result.publicInputs.substring(2 + 32*4, 2 + 32 * 4 + balance_target_length * 2))
        balance_target_check = Math.floor(parseFloat(full_message.balance_target) * 1e18).toString() === balance_target.toString()

        // message hash
        const msgBuf = Buffer.from(result.full_message)
        const hashed_message = hashPersonalMessage(msgBuf)
        message_hash_check = toHex(hashed_message) === "0x" + result.publicInputs.substring(2 + 32*2, 2 + 32*4)

        // verify proof
        verification_check = await verifyFinalProof(proof, publicInputs)

        console.log("name_check ", name_check)
        console.log("address_check ", address_check)
        console.log("stateRoot_check ", stateRoot_check)
        console.log("verification_check ", verification_check)
        console.log("balance_target_check", balance_target_check)
        console.log("message_hash_check", message_hash_check)

        if (!name_check)
            status_message += "name check faild - "
        if (!address_check)
            status_message += "address check faild - "
        if (!stateRoot_check)
            status_message += "state root check faild - "
        if (!verification_check)
            status_message += "proof verification faild - "
        if (!balance_target_check)
            status_message += "balance target check faild - "
        if (!message_hash_check)
            status_message += "message check faild - "

        let status: 'verified' | 'rejected' | 'warning' = 'rejected'
        if (name_check && verification_check && address_check && balance_target_check && message_hash_check) {
            if (stateRoot_check) {
                status = 'verified'
                status_message = 'Proof is verified'
            }
            else if (result.chainId === 999n) {
                status_message = 'Hyperliquid RPCs are broken to verify state root!'
                status = 'warning'
            }
        }
        // Dynamically decide outcome from result if needed
        const outcome: { status: 'verified' | 'rejected' | 'warning'; message: string } = {
            status: status,
            message: status_message
        }

        setItems((prev) =>
        prev.map((item) =>
            item.id === claimId
            ? {
                ...item,
                ...outcome,
                }
            : item
        )
        )
    } catch (err) {
        console.error('Verification failed:', err)
        // Optional: handle error state here if needed
        setItems((prev) =>
        prev.map((item) =>
            item.id === claimId
            ? {
                ...item,
                status: 'rejected',
                message: 'Verification failed. Could not fetch claim.',
                }
            : item
        )
        )
    } finally {
        setVerifying((prev) => {
        const newSet = new Set(prev)
        newSet.delete(claimId)
        return newSet
        })
    }
    }


  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white p-6">
      <h1 className="text-3xl font-bold mb-4">Explorer</h1>

      <input
        type="text"
        placeholder="Search by txHash, address or name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6 w-full p-2 bg-gray-800 text-white rounded"
      />

      <div className="flex flex-col gap-4">
  {paginatedItems.length === 0 ? (
    <p>No items found.</p>
  ) : (
    <>
      {/* Header Row */}
      <div className="hidden md:flex justify-between px-4 py-2 bg-gray-800 rounded text-sm text-gray-400 font-semibold">
        <div className="w-1/5">Name</div>
        <div className="w-1/5">Tx Hash</div>
        <div className="w-1/5">Address</div>
        <div className="w-1/6">Balance Target</div>
        <div className="w-1/6">Chain ID</div>
        <div className="w-1/6">Status</div>
      </div>

      {/* Data Rows */}
      {paginatedItems.map((item) => (
        <Link key={item.txHash} href={`/explorer/${item.id}`}>
          <div className="p-4 bg-gray-900 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-gray-800 transition cursor-pointer space-y-2 md:space-y-0 md:space-x-6">
            <div className="w-full md:w-1/5 font-semibold whitespace-nowrap truncate">{item.name}</div>
            <div className="w-full md:w-1/5 text-sm text-gray-400 whitespace-nowrap truncate">{shortenHash(item.txHash)}</div>
            <div className="w-full md:w-1/5 text-sm text-gray-400 whitespace-nowrap truncate">{shortenHash(item.address)}</div>
            <div className="w-full md:w-1/6 text-sm text-gray-400 whitespace-nowrap truncate">{ethers.formatEther(item.balance_target)}
              {/* {item.balance_target ? `${(item.balance_target / 10n**18n).toFixed(4)} ETH` : '—'} */}
            </div>
            <div className="w-full md:w-1/6 text-sm text-gray-500 whitespace-nowrap">{item.chainId}</div>

            <div className="w-full md:w-1/6 relative group text-sm whitespace-nowrap">
              {['verified', 'rejected', 'warning'].includes(item.status!) ? (
                <span
                  className={
                    item.status === 'verified'
                      ? 'text-green-400'
                      : item.status === 'rejected'
                      ? 'text-red-400'
                      : 'text-yellow-400'
                  }
                >
                  {item.status === 'verified'
                    ? '✔ Verified'
                    : item.status === 'rejected'
                    ? '✖ Rejected'
                    : '⚠ Warning'}
                </span>
              ) : verifying.has(item.id) ? (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    verifyProof(item.id)
                  }}
                  className="bg-blue-600 px-3 py-1.5 rounded text-xs hover:bg-blue-700 transition font-medium shadow"
                >
                  Click to verify
                </button>
              )}
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-3 py-2 rounded shadow-lg z-10 w-max opacity-0 group-hover:opacity-100 transition-opacity max-w-xs break-words">
                {item.message}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </>
  )}
</div>


      <div className="flex justify-center mt-6 space-x-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 bg-gray-800 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-gray-400">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 bg-gray-800 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </main>
  )
}