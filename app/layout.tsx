import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import { Noto_Sans_Thai } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from 'next-themes'
import './globals.css'

const noto = Noto_Sans_Thai({
  subsets: ['latin', 'thai'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'SILELO — สร้างเว็บแอปจริงจากไอเดีย',
  description:
    'SILELO คือแพลตฟอร์มที่เปลี่ยนไอเดียของคุณให้เป็นเว็บแอปจริง เริ่มจากพรอมต์เดียว ใช้ AI เลือกโมเดลฟรีอัตโนมัติ และล็อกอินด้วย Puter ได้ทันที',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfcfb' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1117' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th" className="bg-background" suppressHydrationWarning>
      <body className={`${noto.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Script src="https://js.puter.com/v2/" strategy="afterInteractive" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
