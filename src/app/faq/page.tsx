'use client'

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import Link from "next/link"

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-10 text-center">
          Frequently Asked Questions
        </h1>

        <Accordion type="single" collapsible className="space-y-6">
          <AccordionItem value="what-is-app">
            <AccordionTrigger className="text-xl font-semibold">❓ What is this app?</AccordionTrigger>
            <AccordionContent className="text-lg text-gray-300">
              This app lets you generate and verify zero-knowledge proofs of your native token balance.
              Proofs can be submitted to Hyperliquid without revealing your actual balance.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="privacy">
            <AccordionTrigger className="text-xl font-semibold">🔒 How is my privacy protected?</AccordionTrigger>
            <AccordionContent className="text-lg text-gray-300">
                Proofs are generated entirely in-browser using Noir and bb.js, which means your private information—such as your balance or address never leave your device.  
                The circuits are designed to avoid requiring sensitive data like your private keys.  
                Therefore, in the unlikely event of a circuit bug, only your privacy could be affected and your funds remain completely secure.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="chains">
            <AccordionTrigger className="text-xl font-semibold">🌍 Which chains are supported?</AccordionTrigger>
            <AccordionContent className="text-lg text-gray-300">
              Any EVM-compatible chain with an RPC endpoint that supports <code>eth_getProof</code> can be used. 
              We&apos;ll expand official support over time.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="hyperliquid">
            <AccordionTrigger className="text-xl font-semibold">🚀 Why choose Hyperliquid for proof submission?</AccordionTrigger>
            <AccordionContent className="text-lg text-gray-300">
              We use Ultrahonk proof system which produces relatively large proofs. Hyperliquid with its exteremly cheap transaction fee is a very good candidate to host zk-flexor.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="data">
            <AccordionTrigger className="text-xl font-semibold">💾 Can I store extra data with proofs?</AccordionTrigger>
            <AccordionContent className="text-lg text-gray-300">
              Yes. Each proof submission allows attaching a message for context, up to the size Hyperliquid blocks allow.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tokens">
            <AccordionTrigger className="text-xl font-semibold">🪙 Can I generate proofs for tokens other than native tokens?</AccordionTrigger>
            <AccordionContent className="text-lg text-gray-300">
              No. Currently, only native token balances are supported. Support for ERC20s may come later.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="hype-verification">
            <AccordionTrigger className="text-xl font-semibold">⚠️ Why are proofs for HYPE often not verified and show a warning alert?</AccordionTrigger>
            <AccordionContent className="text-lg text-gray-300">
              Some Hyperliquid RPC endpoints do not support <code>eth_getProof</code> with a large enough 
              window. To verify a proof, the app needs to calculate the state root against a specific block, 
              which requires <code>eth_getProof</code> with sufficient depth.  
              <br /><br />
              We are working on finding a reliable RPC provider to fix this issue.  
              The warning sign means the app cannot confirm if the claimed state root for that block is 
              actually valid.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tip">
            <AccordionTrigger className="text-xl font-semibold">💸 What is a tip?</AccordionTrigger>
            <AccordionContent className="text-lg text-gray-300">
              A tip is an optional payment to the builder. While completely optional, it&apos;s a way to show your generosity and appreciation. 
              Bigger tips often signal high social status and style; the true Flex spirit! 😉 
            </AccordionContent>
          </AccordionItem>

        </Accordion>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="px-6 py-3 border border-white text-white font-semibold rounded-xl hover:bg-white hover:text-black transition"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
