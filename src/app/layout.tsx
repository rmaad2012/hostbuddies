import type { Metadata } from 'next'
import { Press_Start_2P, Signika_Negative } from 'next/font/google'
import './globals.css'

const pressStart = Press_Start_2P({ 
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pressstart'
})

const signikaNegative = Signika_Negative({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-signika'
})

export const metadata: Metadata = {
  title: 'HostBuddies - Replace your guidebook with a gamified AI host',
  description: 'Transform your Airbnb property with an AI host that knows your house rules, creates gamified experiences, and builds lasting guest memories.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${pressStart.variable} ${signikaNegative.variable}`}>
      <body className={`${signikaNegative.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}