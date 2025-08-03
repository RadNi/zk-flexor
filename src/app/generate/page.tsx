'use client'

import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Inputs from '@/components/Inputs'
import ProgressBar from '@/components/ProgressBar'
import { generateProof } from '@/lib/proof'
import SwitchAccountModal from '@/components/SwitchAccountModal'
import { localTestnet, wagmiConfig } from '@/config/wagmi'
import abi from "../../../public/Flexor.json"
import { FLEXOR_ADDRESS } from '@/lib/utils'
import type { SubmitionInputs } from '@/hooks/utils'
import { useSwitchChain, useAccount, useChainId, useWriteContract } from 'wagmi'
import { toHex } from 'viem'
import Link from 'next/link'

// Example target chain
const TARGET_CHAIN = localTestnet

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
        tip: 10n**16n*5n
  } as SubmitionInputs)
  const [proofGenerated, setProofGenerated] = useState(false)
  const [isModalOpen, setModalOpen] = useState(false)


    const { chainId } = useAccount()
    const { switchChainAsync } = useSwitchChain()
    const { writeContractAsync } = useWriteContract()


    const handleGenerate = async (values: any) => {
    setStatus('Starting...')
    setProgress(0)
    setProofGenerated(false)

    await generateProof(values, (step, label) => {
      setProgress(step)
      setStatus(label)
    }, (inputs: SubmitionInputs) => {
        setSubmitionInput(inputs)
    })

    setStatus('Proof ready 🎉')
    setProgress(100)
    setProofGenerated(true)
  }

  const handleSubmitOnChain = () => {
    setModalOpen(true)
  }

  const handleActualProofSubmission = async () => {
    console.log('Submitting proof on-chain...') // ⬅️ replace with your contract write logic
    // e.g., useContractWrite() from wagmi here
    if (chainId !== TARGET_CHAIN.id) {
        await switchChainAsync({ chainId: TARGET_CHAIN.id })
        console.log(TARGET_CHAIN)
        await new Promise(resolve => setTimeout(resolve, 2000));
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
            submitionInput.flexor_address,
            submitionInput.flexor_hl,
            submitionInput.full_message
        ],
        value: submitionInput.tip,
        chainId: TARGET_CHAIN.id // <- important: ensures tx is built for this chain
    });
    console.log(tx)
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-start">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex justify-end">
          <ConnectButton />
        </div>
        import Link from 'next/link'

        <Link href="/explorer" className="text-blue-400 hover:underline">
        View Explorer
        </Link>


        <h1 className="text-3xl font-bold mb-4">Generate Zero-Knowledge Proof</h1>
        <p className="text-gray-400 mb-8">
          Enter your token balance and address to generate a private proof.
        </p>

        <Inputs onSubmit={handleGenerate} />

        <ProgressBar progress={progress} label={status} />

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

      <SwitchAccountModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitProof={handleActualProofSubmission}
      />
    </main>
  )
}
