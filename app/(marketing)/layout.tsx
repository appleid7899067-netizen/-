import { ChatWidget } from "@/components/chat/chat-widget";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      {children}
      <ChatWidget />
    </div>
  )
}
