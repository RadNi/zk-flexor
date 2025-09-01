import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black text-white px-4 text-center py-8">
      <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
        Zero-Knowledge Balance Proof
      </h1>

      <p className="text-gray-400 text-lg md:text-xl max-w-xl mb-6">
        Prove your native-token balance in any EVM chain without revealing it, and submit the proofs on Hyperliquid. Private, and secure using Zero-knowledge proofs.
      </p>

      <p className="text-gray-300 text-md md:text-lg max-w-lg mb-10">
        Protect your on-chain privacy while freely flexing.
      </p>

      {/* Proof + Explorer row */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12 w-full max-w-md">
        <Link href="/generate">
          <div className="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition shadow text-center">
            Generate Proof
          </div>
        </Link>

        <Link href="/explorer">
          <div className="px-8 py-4 border border-white text-white font-semibold rounded-xl hover:bg-white hover:text-black transition shadow cursor-pointer text-center">
            View Explorer
          </div>
        </Link>
      </div>

      {/* Powered by */}
      <p className="text-gray-400 text-lg tracking-wide font-semibold select-none max-w-xs mb-8">
        Powered by{" "}
        <a
          href="https://noir-lang.org"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-400 transition"
        >
          Noir
        </a>{" "}
        and{" "}
        <a
          href="https://hyperliquid.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-400 transition"
        >
          Hyperliquid
        </a>
      </p>

      {/* FAQ below powered by */}
      <div>
        <Link href="/faq">
          <div className="px-8 py-4 border border-white text-white font-semibold rounded-xl hover:bg-white hover:text-black transition shadow cursor-pointer text-center">
            Frequently Asked Questions
          </div>
        </Link>
      </div>
    </main>
  )
}
