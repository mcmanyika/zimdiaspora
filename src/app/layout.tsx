

import './globals.css'
import 'react-toastify/dist/ReactToastify.css'
import { Inter } from 'next/font/google'
import AuthProvider from "../components/auth-provider"

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: "AfroDiaspora",
  description: "Its an African citizen agenda.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
} 