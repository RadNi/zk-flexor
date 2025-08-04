'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileCheck2, Search } from 'lucide-react'
import CustomWalletButton from './CustomWalletButton'

export default function Header() {
  const pathname = usePathname()
  const isExplorer = pathname?.startsWith('/explorer')
  const isGenerate = pathname?.startsWith('/generate')

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800 px-6 h-14 flex items-center justify-between">
      <nav className="flex items-center gap-6 text-white text-sm font-medium">
        <Link href="/" className="header-link flex items-center gap-1">
          <Home size={16} /> Home
        </Link>

        {isExplorer && (
          <Link href="/generate" className="header-link flex items-center gap-1">
            <FileCheck2 size={16} /> Generate Proof
          </Link>
        )}
        {isGenerate && (
          <Link href="/explorer" className="header-link flex items-center gap-1">
            <Search size={16} /> Explorer
          </Link>
        )}
      </nav>

      <CustomWalletButton />
    </header>
  )
}
