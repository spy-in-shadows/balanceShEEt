'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { BarChart3, Package, LayoutDashboard, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-bs-primary" />
              <span className="text-2xl font-bold text-bs-primary">BalanceShEEt</span>
            </Link>
            
            {session && (
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Button>
                </Link>
                <Link href="/products">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Package className="h-4 w-4" />
                    <span>Products</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <User className="h-4 w-4" />
                  <span>{session.user?.name}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </>
            ) : (
              <Link href="/auth/login">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
