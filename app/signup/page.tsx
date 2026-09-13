import Link from 'next/link'
import { signup } from '@/app/login/actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default async function SignupPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <form className="p-8 bg-white shadow-lg rounded-xl max-w-sm w-full flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Sign Up</h1>
        <p className="text-gray-600">Create a new account.</p>
        
        {searchParams?.error && (
          <div className="bg-red-50 text-red-800 p-3 rounded text-sm">
            {searchParams.error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="full_name" className="text-sm font-medium">Full Name</label>
          <Input id="full_name" name="full_name" type="text" required />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <Input id="email" name="email" type="email" required />
        </div>
        
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <Input id="password" name="password" type="password" required minLength={6} />
        </div>

        <Button formAction={signup} className="mt-4">Sign Up</Button>

        <p className="text-sm text-center mt-4 text-gray-500">
          Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  )
}
