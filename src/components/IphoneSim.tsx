'use client'

import Image from 'next/image'

export default function IphoneSim() {
  return (
    <div className="hidden md:block relative w-[150px] lg:w-[200px] aspect-[9/19.5] -rotate-2">
      {/* Phone body */}
      <div className="absolute inset-0 rounded-[34px] bg-black shadow-[0_10px_20px_rgba(0,0,0,0.25)]">
        {/* Screen */}
        <div className="absolute inset-[10px] lg:inset-[12px] rounded-[26px] overflow-hidden bg-white">
          <Image
            src="/beaver-samples/beaver-chatbox.png"
            alt="iPhone screen preview of HostBuddies chat"
            fill
            className="object-cover"
            priority
          />
        </div>
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-b-2xl" />
      </div>
    </div>
  )
}


