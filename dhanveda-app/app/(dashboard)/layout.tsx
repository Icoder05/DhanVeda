import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import { getInitial } from '@/lib/utils'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const name = session.user.name ?? 'Investor'
  const initial = getInitial(name)

  return (
    <DashboardShell userName={name} userInitial={initial}>
      {children}
    </DashboardShell>
  )
}
