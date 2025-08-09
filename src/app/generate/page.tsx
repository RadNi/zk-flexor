'use client'

import { useState } from 'react'
import Inputs from '@/components/Inputs'
import ProgressBar from '@/components/ProgressBar'
import { generateProof } from '@/lib/proof'
import SwitchAccountModal from '@/components/SwitchAccountModal'
import { hostNetwork, localTestnet } from '@/config/wagmi'
import abi from "../../../public/Flexor.json"
import { FLEXOR_ADDRESS } from '@/lib/utils'
import { useSwitchChain, useAccount, useWriteContract } from 'wagmi'
import { toHex } from 'viem'
import { parseEther } from 'ethers'
import type { ProofRequest, SubmitionInputs } from '@/lib/types'

export default function GeneratePage() {
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState(0)
  const [submitionInput, setSubmitionInput] = useState({
    proof: Uint8Array.from(Array(16224).fill(0)),
    publicInputs: Uint8Array.from(Array(97).fill(0)),
    chainId: 0,
    blockNumber: 0n,
    flexor_address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    flexor_hl: ".hl",
    full_message: "",
    tip: 10n ** 16n * 5n,
  } as SubmitionInputs)
  const [proofGenerated, setProofGenerated] = useState(false)
  const [isModalOpen, setModalOpen] = useState(false)
  const [clicked, setClicked] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<string | null>(null)
  const [balanceTarget, setBalanceTarget] = useState(0)
  const [started, setStarted] = useState(false)

  const { chainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()

  const handleGenerate = async (values: ProofRequest) => {
    setStarted(true)
    setStatus('Starting...')
    setProgress(0)
    setClicked(true)
    setProofGenerated(false)
    setSubmissionResult(null)

    try {
      await generateProof(
        values,
        (step, label) => {
          setProgress(step)
          setStatus(label)
        },
        (inputs: SubmitionInputs) => {
          setSubmitionInput(inputs)
        }
      )
      setStatus('Proof ready')
      setProgress(100)
      setProofGenerated(true)
      setBalanceTarget(values.balance)
    } catch (error) {
      console.error('Proof generation error:', error)
      setSubmissionResult(`Proof generation failed: ${error instanceof Error ? error.message : String(error)}`)
      setClicked(false)
      setProgress(0)
      setStatus('')
    }
  }

  const handleSubmitOnChain = () => {
    setModalOpen(true)
  }

  const handleActualProofSubmission = async (tip: string) => {
    console.log('Submitting proof on-chain...')
    if (chainId !== hostNetwork.id) {
      await switchChainAsync({ chainId: hostNetwork.id })
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    const tx = await writeContractAsync({
      abi,
      address: FLEXOR_ADDRESS,
      functionName: 'submitClaim',
      args: [
        toHex(submitionInput.proof),
        toHex(submitionInput.publicInputs),
        submitionInput.chainId,
        submitionInput.blockNumber,
        submitionInput.flexor_address ?? "0x0000000000000000000000000000000000000000",
        submitionInput.flexor_hl,
        submitionInput.full_message,
      ],
      value: parseEther(tip),
      chainId: hostNetwork.id,
    })
    console.log(tx)
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-start w-full">
      
      {/* Page body with centered input box */}
      <div className="flex justify-center w-full px-6">
        <div className="w-full max-w-xl">
          <h1 className="text-3xl font-bold mb-4">Generate Zero-Knowledge Proof</h1>
          <p className="text-gray-400 mb-8">
            Enter your target balance and flexor information to generate the proof.
          </p>

          <Inputs onSubmit={handleGenerate} disable={clicked} />
          {started && (
            <ProgressBar progress={progress} label={status} />
          )}

          {proofGenerated && (
            <div className="mt-8">
              <p className="mb-4">Submit proof on-chain?</p>
              <button
                onClick={handleSubmitOnChain}
                className="bg-green-500 px-6 py-2 rounded-xl hover:bg-green-600"
              >
                Submit Proof
              </button>
            </div>
          )}
        </div>
      </div>

      <SwitchAccountModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitProof={handleActualProofSubmission}
        balanceTarget={balanceTarget}
      />

      {submissionResult && (
        <div
          className="fixed top-8 right-8 max-w-xs bg-black bg-opacity-90 backdrop-blur-md rounded-xl p-4 shadow-lg text-white z-60 animate-fadeInOut"
          style={{ minWidth: '220px' }}
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
          10%, 90% {
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
    </main>
  )
}
