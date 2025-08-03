"use client"
import { useState } from "react"

export default function Inputs({ onSubmit }: { onSubmit: (vals: any) => void }) {
  const [balance, setBalance] = useState('')

  return (
    <div className="space-y-4">
      <input
        placeholder="Balance"
        value={balance}
        onChange={(e) => setBalance(e.target.value)}
        className="w-full p-3 bg-gray-900 text-white rounded-lg"
      />
      <button
        onClick={() => onSubmit({ balance })}
        className="bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        Start Proof
      </button>
    </div>
  )
}
