import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function ProtectedPage() {
  const session = await getServerSession()

  if (!session) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 gap-8">
      <h1 className="text-4xl font-bold">Protected Page</h1>
      <p className="text-xl">Welcome, {session.user?.name}! This page is only visible to authenticated users.</p>
        <Link href="/account">Go back home</Link>
    </div>
  )
}
