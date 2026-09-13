import Link from 'next/link'
import { Wand2, LayoutDashboard, History, FolderKanban, Heart } from 'lucide-react'
import { LanguageProvider } from '@/lib/contexts/LanguageContext'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import { Assistant } from '@/components/ui/Assistant'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="flex min-h-screen w-full flex-col bg-gray-50 md:flex-row">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-white sm:flex">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Wand2 className="h-6 w-6 text-primary" />
              <span className="">InteriaAI</span>
            </Link>
          </div>
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-4 gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-all hover:bg-gray-100 hover:text-gray-900"
            >
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </Link>
            <Link
              href="/dashboard/projects"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-all hover:bg-gray-100 hover:text-gray-900"
            >
              <FolderKanban className="h-4 w-4" />
              Projects
            </Link>
            <Link
              href="/dashboard/new"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-all hover:bg-gray-100 hover:text-gray-900"
            >
              <Wand2 className="h-4 w-4" />
              Analyze Room
            </Link>
            <Link
              href="/dashboard/designs"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-all hover:bg-gray-100 hover:text-gray-900"
            >
              <History className="h-4 w-4" />
              Design History
            </Link>
            <Link
              href="/dashboard/favorites"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-all hover:bg-gray-100 hover:text-gray-900"
            >
              <Heart className="h-4 w-4" />
              Favorites
            </Link>
          </nav>
        </aside>
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64 flex-1">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <div className="sm:hidden font-bold flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              InteriaAI
            </div>
            <div className="ml-auto flex items-center gap-4">
              <LanguageSelector />
              <form action="/auth/signout" method="post">
                <button className="text-sm font-medium text-gray-500 hover:text-gray-900">Sign out</button>
              </form>
            </div>
          </header>
          <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 relative pb-24">
            {children}
          </main>
        </div>
      </div>
      <Assistant />
    </LanguageProvider>
  )
}
