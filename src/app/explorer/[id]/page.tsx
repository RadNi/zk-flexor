'use client'

import { useState, useContext } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { BadgeCheck, XCircle } from 'lucide-react'
import { ExplorerCacheContext } from '../layout'
import { fullVerifyProof } from '../utils'

export default function ExplorerDetailPage() {
  const params = useParams()
  const { id } = params
  const { items, setItems } = useContext(ExplorerCacheContext)
  const [verifying, setVerifying] = useState(false)

  const item = items.find((itm) => itm.id.toString() === id?.toString()) || null

  const verifyProof = async (claimId: string) => {
    setVerifying(true)
    try {
      const result = await fullVerifyProof(claimId)
      setItems((prev) => {
        const exists = prev.some((itm) => itm.id.toString() === claimId)
        if (!exists && item) return [...prev, { ...item, ...result }]
        return prev.map((itm) =>
          itm.id.toString() === claimId ? { ...itm, ...result } : itm
        )
      })
    } catch (error) {
      console.error('Verification failed:', error)
      setItems((prev) =>
        prev.map((itm) =>
          itm.id.toString() === claimId
            ? {
                ...itm,
                status: 'rejected',
                statusMessage: 'Verification failed',
              }
            : itm
        )
      )
    } finally {
      setVerifying(false)
    }
  }

  if (!item) return <div className="text-white p-6">Loading or item not found...</div>

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white p-6">
      <div className="max-w-3xl mx-auto bg-gray-950 rounded-2xl shadow-lg p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center">Proof Details</h1>

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{item.name}</h2>
          <div className="flex items-center space-x-2">
            {['verified', 'rejected', 'warning'].includes(item.status!) ? (
              <div className="relative group flex items-center space-x-2 cursor-pointer hover:brightness-110 transition">
                {item.status === 'verified' && (
                  <>
                    <BadgeCheck className="text-green-400" size={20} />
                    <span className="text-green-400">Verified</span>
                  </>
                )}
                {item.status === 'rejected' && (
                  <>
                    <XCircle className="text-red-400" size={20} />
                    <span className="text-red-400">Rejected</span>
                  </>
                )}
                {item.status === 'warning' && (
                  <span className="text-yellow-400">⚠ Warning</span>
                )}

                {/* Tooltip */}
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-3 py-2 rounded shadow-lg z-10 w-max opacity-0 group-hover:opacity-100 transition-opacity max-w-xs break-words">
                  {item.statusMessage || 'No message available'}
                </div>
              </div>
            ) : verifying ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <button
                onClick={() => verifyProof(item.id.toString())}
                className="bg-blue-600 px-3 py-1.5 rounded text-xs hover:bg-blue-700 transition font-medium shadow"
              >
                Verify Proof
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3 text-sm md:text-base">
          <div>
            <span className="text-gray-500">Transaction Hash:</span>
            <div className="break-all text-white font-mono">{item.txHash}</div>
          </div>
          <div>
            <span className="text-gray-500">Address:</span>
            <div className="break-all text-white font-mono">{item.address}</div>
          </div>
          <div>
            <span className="text-gray-500">Balance Target:</span>
            <span className="ml-2 text-white">
              {item.balance_target ? (Number(item.balance_target) / 1e18).toFixed(4) + ' ETH' : '—'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Chain ID:</span>
            <span className="ml-2 text-white">{item.chainId}</span>
          </div>
          <div>
            <span className="text-gray-500">Message:</span>
            <span className="ml-2 text-white">{item.message || 'No message available'}</span>
          </div>
        </div>

        <div className="pt-4 text-center">
          <Link href="/explorer" className="text-blue-400 hover:underline">
            ← Back to Explorer
          </Link>
        </div>
      </div>
    </main>
  )
}
