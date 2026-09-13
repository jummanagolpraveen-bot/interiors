import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="flex h-16 items-center px-8 border-b">
        <div className="text-xl font-bold">InteriaAI</div>
        <nav className="ml-auto flex gap-6">
          <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4 mt-2">Log in</Link>
          <Button asChild>
            <Link href="/signup">Sign up</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="w-full py-24 md:py-32 lg:py-48 text-center space-y-6 flex flex-col items-center">
          <h1 className="text-5xl font-extrabold tracking-tighter md:text-6xl lg:text-7xl">
            Transform Your Home with AI.
          </h1>
          <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Upload a photo of your room, and let AI generate stunning interior designs, recommend furniture, and estimate budgets instantly.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/dashboard/new">Analyze My Room</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard/designs">Explore Designs</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="flex p-6 w-full shrink-0 items-center px-8 md:px-12 border-t">
        <p className="text-sm text-gray-500">© 2026 InteriaAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
