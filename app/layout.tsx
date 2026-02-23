import './globals.css'
import { Providers } from '@/providers/WagmiProvider'
import { WalletButton } from '@/components/WalletButton'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white min-h-screen">
        <Providers>
          <nav className="flex justify-between items-center px-6 py-3 border-b border-gray-700">
            <span className="font-bold text-purple-400">Gotchi Operator</span>
            <div className="flex gap-4 text-sm">
              <a href="/" className="hover:text-purple-300">Dashboard</a>
              <a href="/address-book" className="hover:text-purple-300">Addresses</a>
              <a href="/templates" className="hover:text-purple-300">Templates</a>
              <a href="/settings" className="hover:text-purple-300">Settings</a>
            </div>
            <WalletButton />
          </nav>
          <main className="px-6 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
