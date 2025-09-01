'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, FileCheck2, Search, HelpCircle, Menu, X } from 'lucide-react'
import CustomWalletButton from './CustomWalletButton'
import { useProver } from './ProverProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { mode, setMode } = useProver()
  const [isMobile, setIsMobile] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setMode('server') // default to server on phone
    }
  }, [])

  const toggleProver = () => {
    if (isMobile) {
      setShowWarning(true)
      setTimeout(() => setShowWarning(false), 3000)
      return
    }
    setMode(mode === 'client' ? 'server' : 'client')
  }

  const handleMobileNav = (href: string) => {
    router.push(href)
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800 px-4 h-20 flex items-center justify-between">

      {/* Left side: links or mobile menu button */}
      <div className="flex items-center gap-4">
        {isMobile ? (
          <button
            onClick={() => setMenuOpen(true)}
            className="text-white p-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            <Menu size={24} />
          </button>
        ) : (
          <nav className="flex items-center gap-6 text-white text-sm font-medium">
            <Link
              href="/"
              className={`header-link flex items-center gap-1 ${pathname === '/' ? 'text-blue-400' : ''}`}
            >
              <Home size={16} /> Home
            </Link>
            <Link href="/generate" className="header-link flex items-center gap-1">
              <FileCheck2 size={16} /> Generate Proof
            </Link>
            <Link href="/explorer" className="header-link flex items-center gap-1">
              <Search size={16} /> Explorer
            </Link>
            <Link href="/faq" className={`header-link flex items-center gap-1 ${pathname.startsWith('/faq') ? 'text-blue-400' : ''}`}>
              <HelpCircle size={16} /> FAQ
            </Link>
          </nav>
        )}
      </div>

      {/* Right side: wallet + prover toggle */}
      <div className="flex items-center gap-4">
        {!isMobile && (
          <div className="flex items-center gap-2">
            <span className="text-gray-300 text-sm font-medium">Prover:</span>
            <button
              onClick={toggleProver}
              className="relative w-44 h-10 rounded-full border border-gray-700 bg-gray-900/80 flex items-center transition-colors duration-300 hover:border-gray-500"
            >
              {/* Sliding background */}
              <motion.div
                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 shadow-md"
                style={{ width: '50%' }}
                animate={{ x: mode === 'client' ? 0 : '100%' }}
                initial={false}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
              {/* Text labels aligned with theme */}
              <div className="relative z-10 flex justify-between w-full px-3 font-sans text-sm font-medium text-gray-300">
                <span className={mode === 'client' ? 'text-white' : 'text-gray-500'}>Client</span>
                <span className={mode === 'server' ? 'text-white' : 'text-gray-500'}>Server</span>
              </div>
            </button>
          </div>
        )}

        <CustomWalletButton />
      </div>

      {/* Mobile slide-out menu */}
      <AnimatePresence>
        {menuOpen && isMobile && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed top-0 left-0 w-64 h-screen bg-black/95 backdrop-blur-md z-50 flex flex-col p-6 gap-6"
          >
            <button
              onClick={() => setMenuOpen(false)}
              className="self-end text-white p-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              <X size={24} />
            </button>

            <nav className="flex flex-col gap-4 text-white text-sm font-medium mt-4">
              <button className="flex items-center gap-1" onClick={() => handleMobileNav('/')}>
                <Home size={16} /> Home
              </button>
              <button className="flex items-center gap-1" onClick={() => handleMobileNav('/generate')}>
                <FileCheck2 size={16} /> Generate Proof
              </button>
              <button className="flex items-center gap-1" onClick={() => handleMobileNav('/explorer')}>
                <Search size={16} /> Explorer
              </button>
              <button className="flex items-center gap-1" onClick={() => handleMobileNav('/faq')}>
                <HelpCircle size={16} /> FAQ
              </button>
            </nav>

            {/* Prover toggle */}
            <div className="flex items-center gap-2 mt-4">
              <span className="text-gray-300 text-sm font-medium">Prover:</span>
              <button
                onClick={toggleProver}
                className="relative w-full h-10 rounded-full border border-gray-700 bg-gray-900/80 flex items-center transition-colors duration-300"
              >
                <motion.div
                  className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 shadow-md"
                  style={{ width: '50%' }}
                  animate={{ x: mode === 'client' ? 0 : '100%' }}
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
                <div className="relative z-10 flex justify-between w-full px-3 font-sans text-sm font-medium text-gray-300">
                  <span className={mode === 'client' ? 'text-white' : 'text-gray-500'}>Client</span>
                  <span className={mode === 'server' ? 'text-white' : 'text-gray-500'}>Server</span>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showWarning && (
        <div className="absolute right-4 top-20 text-xs text-red-400 transition-opacity duration-500">
          Client-side proving is not supported on mobile yet!
        </div>
      )}
    </header>
  )
}
