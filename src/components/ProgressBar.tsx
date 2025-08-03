export default function ProgressBar({ progress, label }: { progress: number, label: string }) {
  return (
    <div className="mt-6">
      <p className="text-sm mb-2 text-blue-400">{label}</p>
      <div className="w-full bg-gray-800 h-4 rounded-full overflow-hidden">
        <div
          className="bg-blue-500 h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
