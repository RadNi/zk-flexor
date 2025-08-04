"use client"
import { useState } from "react"

function isValidBalance(balance: string) {
  return balance.trim() !== '' && !isNaN(parseFloat(balance)) && isFinite(parseFloat(balance))
}

function isValidHexAddress(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

function isValidHLName(name: string) {
  return name.endsWith(".hl") && !/\s/.test(name)
}

export default function Inputs({
  onSubmit,
  disable,
}: {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  onSubmit: (vals: any) => void
  disable: boolean
}) {
  const [balance, setBalance] = useState("")
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [message, setMessage] = useState("")

  const [errors, setErrors] = useState({
    balance: "",
    name: "",
    address: "",
  })

  const validateAll = () => {
    const errs = {
      balance: "",
      name: "",
      address: "",
    }

    if (!isValidBalance(balance)) {
      errs.balance = "Balance must be a valid number."
    }

    if (name && !isValidHLName(name)) {
      errs.name = "Name must end with .hl and have no spaces."
    }

    if (address && !isValidHexAddress(address)) {
      errs.address = "Address must be a valid 0x-prefixed 20-byte hex."
    }

    setErrors(errs)
    return !errs.balance && !errs.name && !errs.address
  }

  const handleSubmit = () => {
    if (validateAll()) {
      onSubmit({ balance, name, address, message })
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <input
          placeholder="Balance target"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="w-full p-3 bg-gray-900 text-white rounded-lg"
          readOnly={disable}
        />
        {errors.balance && <p className="text-red-500 text-sm mt-1">{errors.balance}</p>}
      </div>

      <div>
        <input
          placeholder="Flexor hyperliquid name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 bg-gray-900 text-white rounded-lg"
          readOnly={disable}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <input
          placeholder="Flexor address (optional)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full p-3 bg-gray-900 text-white rounded-lg"
          readOnly={disable}
        />
        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
      </div>

      <div>
        <input
          placeholder="Custom message (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-3 bg-gray-900 text-white rounded-lg"
          readOnly={disable}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={disable}
        className={`px-6 py-2 rounded-lg font-medium transition w-full
          ${disable ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
      >
        Start Proof
      </button>
    </div>
  )
}
