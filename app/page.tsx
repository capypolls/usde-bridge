import Bridge from '@/app/Bridge'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-4">CapyPolls Token Bridge</h1>
      <Bridge />
    </main>
  )
}
