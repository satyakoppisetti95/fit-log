import { BottomNavigation } from '@/components/BottomNavigation'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Dashboard</h1>
        <p className="text-[var(--text-secondary)]">Dashboard content will go here</p>
      </div>
      <BottomNavigation />
    </div>
  )
}
