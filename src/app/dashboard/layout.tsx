import { Suspense } from 'react'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import AuthGuard from '@/components/AuthGuard'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Temporarily disable server-side auth check to allow client-side session to establish
  // const supabase = await createServerSupabaseClient()
  // const { data: { user } } = await supabase.auth.getUser()
  // if (!user) {
  //   redirect('/auth/login')
  // }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <DashboardSidebar />
        <div className="lg:pl-72">
          <DashboardHeader />
          <main className="py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-600"></div>
                </div>
              }>
                {children}
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
