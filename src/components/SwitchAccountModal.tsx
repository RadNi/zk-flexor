'use client'

import { Dialog } from '@headlessui/react'
import { useState, useEffect } from 'react'
import { parseEther } from 'viem'

export default function SwitchAccountModal({
  isOpen,
  onClose,
  onSubmitProof,
  balanceTarget
}: {
  isOpen: boolean
  onClose: () => void
  onSubmitProof: (tipAmount: string) => Promise<void>,
  balanceTarget: number
}) {
  const [hasSwitched, setHasSwitched] = useState(false)
  const [tipAmount, setTipAmount] = useState('0.3')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<string | null>(null)
  const [showResultPopup, setShowResultPopup] = useState(false)

  const emojiForTip = (value: number) => {
    if (value >= balanceTarget * 0.1/10) return '🤩'
    if (value >= balanceTarget * 0.1/100) return '😎'
    if (value >= balanceTarget * 0.1/1000) return '☺️'
    if (value >= balanceTarget * 0.1/10000) return '🤨'
    if (value >= balanceTarget * 0.1/100000) return '😒'
    return '🤬'
  }
const tipPresets = [
  {
    value: (balanceTarget * 0.1 / 10000).toFixed(6),
    label: `Low (${(balanceTarget * 0.1 / 10000).toFixed(6)} ETH)`
  },
  {
    value: (balanceTarget * 0.1 / 1000).toFixed(6),
    label: `Medium (${(balanceTarget * 0.1 / 1000).toFixed(6)} ETH)`
  },
  {
    value: (balanceTarget * 0.1 / 100).toFixed(6),
    label: `High (${(balanceTarget * 0.1 / 100).toFixed(6)} ETH)`
  }
]


  useEffect(() => {
    if (showResultPopup) {
      const timer = setTimeout(() => {
        setShowResultPopup(false)
        setSubmissionResult(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showResultPopup])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmissionResult(null)
    try {
      await onSubmitProof(tipAmount)
      setSubmissionResult('Proof submitted successfully.')
      setShowResultPopup(true)
      onClose()
      setHasSwitched(false)
    } catch (error) {
      console.error(error)
      setSubmissionResult('Submission failed. Please try again.')
      setShowResultPopup(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-[#0d0d0d] p-6 rounded-xl max-w-md w-full text-white shadow-2xl border border-gray-700">
            <Dialog.Title className="text-lg font-semibold mb-4">
              {hasSwitched ? 'Submit Proof' : 'Switch Account'}
            </Dialog.Title>

            <Dialog.Description className="mb-4 text-gray-300">
              {hasSwitched
                ? 'Select a tip amount or enter your own.'
                : 'Please switch to an account with HYPE tokens to submit the proof on-chain.'}
            </Dialog.Description>

            {!hasSwitched ? (
              <button
                onClick={() => setHasSwitched(true)}
                className="bg-blue-500 px-4 py-2 rounded-lg hover:bg-blue-600 w-full"
                disabled={isSubmitting}
              >
                I've switched accounts
              </button>
            ) : (
              <div className="space-y-4">
                {/* Preset Tip Buttons */}
                <div className="flex justify-between">
                  {tipPresets.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setTipAmount(value)}
                      disabled={isSubmitting}
                      className={`flex-1 mx-1 px-3 py-2 text-sm rounded-lg border ${
                        tipAmount === value
                          ? 'bg-green-700 border-green-500 text-white'
                          : 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Custom Tip Input */}
                <div className="text-center mt-2">
                  <label className="text-sm text-gray-400 mb-1 block">
                    Or enter custom tip:
                  </label>
                  <div className="flex justify-center items-center gap-2">
                    <input
                      type="number"
                      value={tipAmount}
                      onChange={(e) => setTipAmount(e.target.value)}
                      className="w-28 p-2 rounded bg-gray-800 text-white border border-gray-600 text-center"
                      min="0"
                      disabled={isSubmitting}
                    /><span className="text-2xl">
                      {emojiForTip(Number(tipAmount) || 0)}
                    </span>

                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  className="bg-green-700 px-4 py-2 rounded-lg hover:bg-green-800 w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Proof'}
                </button>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Floating result popup */}
      {showResultPopup && submissionResult && (
        <div
          className={`fixed top-8 right-8 max-w-xs bg-[#808080] bg-opacity-10 text-white backdrop-blur-md rounded-xl p-4 shadow-lg z-60 animate-fadeInOut`}
          role="alert"
        >
          <p
            className={`text-center ${
              submissionResult.includes('successfully') ? 'text-green-300' : 'text-red-400'
            }`}
          >
            {submissionResult}
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInOut {
          0% {
            opacity: 0;
            transform: translateX(20px);
          }
          10%,
          90% {
            opacity: 1;
            transform: translateX(0);
          }
          100% {
            opacity: 0;
            transform: translateX(20px);
          }
        }

        .animate-fadeInOut {
          animation: fadeInOut 3s ease forwards;
        }
      `}</style>
    </>
  )
}
