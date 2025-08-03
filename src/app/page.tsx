export default function HomePage() {
  return (
    <main className="h-screen flex flex-col items-center justify-center bg-black text-white">
      <h1 className="text-5xl font-bold mb-6">ZK Native Balance Proof</h1>
      <p className="text-gray-400 mb-10">Prove your balance privately</p>
      <a
        href="/generate"
        className="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition"
      >
        Generate Proof
      </a>
    </main>
  );
}
