import Link from "next/link";

export default function HomePage() {
  return (
    <main className="h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black text-white px-4 text-center">
      <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
        Zero-Knowledge Balance Proof
      </h1>
      <p className="text-gray-400 text-lg md:text-xl max-w-xl mb-6">
        Prove your native-token balance in any EVM chain without revealing it, and submit the proofs on Hyperliquid — private, and secure using Zero-knowledge proofs.
      </p>
      <p className="text-gray-300 text-md md:text-lg max-w-lg mb-10">
        Protect your on-chain privacy while freely flexing..
      </p>
      <div className="flex flex-col sm:flex-row gap-4 mb-12">
        <Link href="/generate">
          <div className="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition shadow">
            Generate Proof
          </div>
        </Link>
        <Link href="/explorer">
          <div className="px-8 py-4 border border-white text-white font-semibold rounded-xl hover:bg-white hover:text-black transition shadow cursor-pointer">
            View Explorer
          </div>
        </Link>
      </div>
      <p className="text-gray-400 text-lg tracking-wide font-semibold select-none">
        Powered by{' '}
        <a
          href="https://noir-lang.org"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-400 transition"
        >
          Noir
        </a>{' '}
        and{' '}
        <a
          href="https://hyperliquid.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-400 transition"
        >
          Hyperliquid
        </a>
      </p>
      <div className="mt-16">
        <Link href="/faq">
          <div className="px-8 py-4 border border-white text-white font-semibold rounded-xl hover:bg-white hover:text-black transition shadow cursor-pointer">
            Frequently Asked Questions
          </div>
        </Link>
      </div>

    </main>
  )
}
