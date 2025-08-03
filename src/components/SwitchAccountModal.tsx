'use client'

import { useAccount } from 'wagmi'
import { Dialog } from '@headlessui/react'
import { useState } from 'react'

export default function SwitchAccountModal({
  isOpen,
  onClose,
  onSubmitProof
}: {
  isOpen: boolean
  onClose: () => void
  onSubmitProof: () => void
}) {
  const { address } = useAccount()
  const [hasSwitched, setHasSwitched] = useState(false)

  const handleSwitch = () => {
    // You can use RainbowKit's account selector UI
    setHasSwitched(true)
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-[#0d0d0d] p-6 rounded-xl max-w-md w-full text-white shadow-2xl border border-gray-700">
          <Dialog.Title className="text-lg font-semibold mb-4">Switch Account</Dialog.Title>
          <Dialog.Description className="mb-4 text-gray-300">
            Please switch to an account with HYPE tokens to submit the proof on-chain.
          </Dialog.Description>

          {!hasSwitched ? (
            <button
              onClick={handleSwitch}
              className="bg-blue-500 px-4 py-2 rounded-lg hover:bg-blue-600 w-full"
            >
              I’ve switched accounts
            </button>
          ) : (
            <button
              onClick={() => {
                onSubmitProof()
                onClose()
              }}
              className="bg-green-500 px-4 py-2 rounded-lg hover:bg-green-600 w-full"
            >
              Submit Proof
            </button>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
