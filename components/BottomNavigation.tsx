'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ChefHat, Plus, Dumbbell, User } from 'lucide-react'
import { useTheme } from './ThemeProvider'

const tabs = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/recipes', icon: ChefHat, label: 'Recipes' },
  { href: '/add', icon: Plus, label: 'Add' },
  { href: '/exercise', icon: Dumbbell, label: 'Exercise' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNavigation() {
  const pathname = usePathname()
  const { accentColor } = useTheme()
  const accentColorValue = {
    green: '#10b981',
    blue: '#3b82f6',
    orange: '#f97316',
    purple: '#a855f7',
  }[accentColor]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname === tab.href
          const isAddButton = tab.href === '/add'

          if (isAddButton) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all"
                style={{
                  backgroundColor: isActive ? accentColorValue : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </Link>
            )
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center flex-1 h-full transition-colors"
              style={{
                color: isActive ? accentColorValue : 'var(--text-secondary)',
              }}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
