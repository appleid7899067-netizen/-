import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import { Geist_Mono, Noto_Sans_Thai } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from 'next-themes'
import './globals.css'

const noto = Noto_Sans_Thai({
  subsets: ['latin', 'thai'],
  variable: '--font-noto',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'TEMPLATE OS — ระบบปฏิบัติการเทมเพลตชั้นนำ',
  description:
    'TEMPLATE OS คือระบบปฏิบัติการเทมเพลตชั้นนำสำหรับเลือก ปรับ และส่งต่อเว็บที่พร้อมทำงานใน workspace เดียว',
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
  colorScheme: 'dark',
  themeColor: '#121b15',
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th" className="dark bg-background" suppressHydrationWarning>
      <body className={`${noto.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
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
