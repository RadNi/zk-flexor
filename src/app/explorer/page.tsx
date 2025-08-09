'use client'

import { useContext, useState, useEffect } from 'react'
import Link from 'next/link'
import { ethers } from 'ethers'
import { fullVerifyProof, getChainById } from './utils'
import { ExplorerCacheContext } from '@/components/ExplorerCachContext'
import { shortenHash } from '@/lib/proof_helpers'

const ITEMS_PER_PAGE = 10


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

  const verifyProof = async (claimId: string, txHash: string) => {
  console.log("Start verifying:", claimId)

  // Add to verifying set
  setVerifying((prev) => {
    const newSet = new Set(prev)
    newSet.add(claimId)
    return newSet
  })

  try {
    // Await if fullVerifyProof is async
    const outcome = await fullVerifyProof(claimId, txHash)

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
    setItems((prev) =>
      prev.map((item) =>
        item.id === claimId
          ? {
              ...item,
              status: 'rejected',
              statusMessage: 'Verification failed. Could not fetch claim.',
            }
          : item
      )
    )
  } finally {
    // Remove from verifying set
    setVerifying((prev) => {
      const newSet = new Set(prev)
      newSet.delete(claimId)
      return newSet
    })
    console.log("Finished verifying:", claimId)
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
                <div className="w-1/6">Name</div>
                <div className="w-1/5">Tx Hash</div>
                <div className="w-1/5">Address</div>
                <div className="w-1/6">Balance Target</div>
                <div className="w-1/6">Tip</div>
                <div className="w-1/6">Chain ID</div>
                <div className="w-1/6">Status</div>
            </div>

            {/* Data Rows */}
            {paginatedItems.map((item) => (
                <Link key={item.txHash} href={`/explorer/${item.id}`}>
                <div className="p-4 bg-gray-900 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-gray-800 transition cursor-pointer space-y-2 md:space-y-0 md:space-x-6">
                    <div className="w-full md:w-1/6 font-semibold whitespace-nowrap truncate">
                        <div
  onClick={(e) => {
    e.stopPropagation();
    window.open(`https://app.hlnames.xyz/name/${item.name}`, "_blank");
  }}
      className="text-white font-semibold hover:text-blue-400 cursor-pointer transition-colors px-1 py-0.5 rounded"
>
  {item.name}
</div>



                    </div>

                    

                    <div className="w-full md:w-1/5 text-sm text-gray-400 whitespace-nowrap truncate">{shortenHash(item.txHash)}</div>
                    <div className="w-full md:w-1/5 text-sm text-gray-400 whitespace-nowrap truncate">{item.address && item.address !== '0x0000000000000000000000000000000000000000'? shortenHash(item.address): ''}</div>
                    <div className="w-full md:w-1/6 text-sm text-gray-400 whitespace-nowrap truncate">{ethers.formatEther(item.balance_target) + " " + getChainById(Number(item.chainId))?.nativeCurrency.symbol}</div>
                    <div className="w-full md:w-1/6 text-sm text-gray-400 whitespace-nowrap truncate">{ethers.formatEther(item.tip)}</div>
                    {/* {item.balance_target ? `${(item.balance_target / 10n**18n).toFixed(4)} ETH` : '—'} */}
                    {/* </div> */}
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
                            verifyProof(item.id, item.txHash).catch(e => console.log("Proof verification faild: " + e))
                        }}
                        className="bg-blue-600 px-3 py-1.5 rounded text-xs hover:bg-blue-700 transition font-medium shadow"
                        >
                        Click to verify
                        </button>
                    )}
                    {['verified', 'rejected', 'warning'].includes(item.status!) && item.statusMessage && (
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-3 py-2 rounded shadow-lg z-10 max-w-sm w-fit break-words whitespace-normal opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.statusMessage}
                        </div>
                    )}
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