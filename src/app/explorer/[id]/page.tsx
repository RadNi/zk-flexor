// app/explorer/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { BadgeCheck, XCircle } from 'lucide-react'

export default function ExplorerDetailPage() {
  const params = useParams()
  const { id } = params
  const [item, setItem] = useState(null)

  useEffect(() => {
    // Simulate fetching details from an API or store
    const fakeItem = {
      id,
      txHash: '0x1234abcd5678ef90',
      address: '0xabcde1234567890fedcba0987654321abcde1234',
      name: `Proof #${id}`,
      chainId: 1,
      verified: Math.random() > 0.5,
      timestamp: new Date().toISOString(),
    }
    setItem(fakeItem)
  }, [id])

  if (!item) return <div className="text-white p-6">Loading...</div>

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white p-6">
      <div className="max-w-3xl mx-auto bg-gray-950 rounded-2xl shadow-lg p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center">Proof Details</h1>

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{item.name}</h2>
          <div className="flex items-center space-x-2">
            {item.verified ? (
              <><BadgeCheck className="text-green-400" size={20} /><span className="text-green-400">Verified</span></>
            ) : (
              <><XCircle className="text-red-400" size={20} /><span className="text-red-400">Unverified</span></>
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
            <span className="text-gray-500">Chain ID:</span>
            <span className="ml-2 text-white">{item.chainId}</span>
          </div>
          <div>
            <span className="text-gray-500">Timestamp:</span>
            <span className="ml-2 text-white">{new Date(item.timestamp).toLocaleString()}</span>
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