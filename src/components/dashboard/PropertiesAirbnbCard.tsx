'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink } from 'lucide-react'

export default function PropertiesAirbnbCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-6 shadow-sm">
      <div className="relative w-16 h-16 shrink-0">
        <Image
          src="/window.svg"
          alt="Airbnb Properties"
          fill
          className="object-contain"
        />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900">Connect your Airbnb properties</h3>
        <p className="text-gray-600 mt-1 text-sm">
          Import listings to auto-fill details and keep your AI host up to date.
        </p>
      </div>
      <Link
        href="#"
        className="inline-flex items-center px-4 py-2 rounded-lg bg-olive-600 text-white hover:bg-olive-700"
      >
        Connect
        <ExternalLink className="w-4 h-4 ml-2" />
      </Link>
    </div>
  )
}


