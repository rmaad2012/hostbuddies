'use client'

import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { Download, Copy, Check, QrCode, ExternalLink } from 'lucide-react'

interface QRCodeGeneratorProps {
  propertyId: string
  propertyName: string
}

export default function QRCodeGenerator({ propertyId, propertyName }: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Generate the property access URL (which will create a guest session automatically)
  const guestUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/property/${propertyId}`

  useEffect(() => {
    generateQRCode()
  }, [propertyId])

  const generateQRCode = async () => {
    if (!propertyId) return
    
    setLoading(true)
    try {
      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(guestUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#374151', // Gray-700
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      })
      
      setQrCodeUrl(qrDataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(guestUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return

    const link = document.createElement('a')
    link.download = `${propertyName}-qr-code.png`
    link.href = qrCodeUrl
    link.click()
  }

  const handlePrintQR = () => {
    if (!qrCodeUrl) return

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${propertyName}</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                text-align: center; 
                font-family: system-ui, -apple-system, sans-serif;
              }
              .qr-container {
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
                display: inline-block;
                background: white;
              }
              h1 { 
                color: #374151; 
                margin-bottom: 10px;
                font-size: 24px;
              }
              p { 
                color: #6b7280; 
                margin: 10px 0;
                font-size: 14px;
              }
              .url {
                font-family: monospace;
                background: #f3f4f6;
                padding: 8px;
                border-radius: 4px;
                font-size: 12px;
                word-break: break-all;
                margin: 10px 0;
              }
              img {
                border: 1px solid #e5e7eb;
                border-radius: 8px;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h1>${propertyName}</h1>
              <p>Scan to access your AI host experience</p>
              <img src="${qrCodeUrl}" alt="QR Code" />
              <div class="url">${guestUrl}</div>
              <p>Powered by HostBuddies</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <QrCode className="w-5 h-5 text-slate-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Guest Access QR Code</h3>
      </div>
      
      <p className="text-gray-600 mb-6 text-sm">
        Share this QR code with your guests so they can easily access their AI host experience.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
        </div>
      ) : qrCodeUrl ? (
        <div className="space-y-6">
          {/* QR Code Display */}
          <div className="text-center">
            <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
              <img 
                src={qrCodeUrl} 
                alt="Property QR Code" 
                className="w-64 h-64 mx-auto"
              />
            </div>
          </div>

          {/* URL Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Access URL
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={guestUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-mono"
              />
              <button
                onClick={handleCopyUrl}
                className="p-2 text-gray-600 hover:text-slate-600 transition-colors"
                title="Copy URL"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <a
                href={guestUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 hover:text-slate-600 transition-colors"
                title="Open URL"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDownloadQR}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PNG
            </button>
            
            <button
              onClick={handlePrintQR}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Print QR Code
            </button>
            
            <button
              onClick={handleCopyUrl}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:shadow-lg transition-all duration-300"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy URL
                </>
              )}
            </button>
          </div>

          {/* Usage Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">How to use:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Print the QR code and place it in your property</li>
              <li>• Share the URL via email or messaging apps</li>
              <li>• Add the QR code to your welcome materials</li>
              <li>• Include it in your Airbnb listing photos</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <QrCode className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">Failed to generate QR code</p>
          <button
            onClick={generateQRCode}
            className="mt-4 text-slate-600 hover:text-slate-700 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
