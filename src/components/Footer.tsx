'use client'

import { Github } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="w-full bg-[#111] text-sm text-gray-400 py-6 px-4 border-t border-gray-800 mt-auto">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-center md:text-left">
          © {new Date().getFullYear()} ZK-Flexor. All rights reserved.
        </p>

        <div className="flex space-x-6 items-center">
          <Link
            href="https://github.com/RadNi/zk-flexor"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition"
            aria-label="GitHub"
          >
            <Github className="w-5 h-5" />
          </Link>

          <Link
            href="https://twitter.com/0xradni"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition"
            aria-label="Twitter / X"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M17.14 2H21L13.89 10.11L22.54 22H15.66L10.61 15.28L4.82 22H1L8.57 13.37L0.46 2H7.53L12.13 8.13L17.14 2ZM15.86 20H17.69L6.36 4H4.38L15.86 20Z" />
            </svg>
          </Link>
        </div>
      </div>
    </footer>
  )
}
