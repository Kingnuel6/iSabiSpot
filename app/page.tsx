export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-8">
      <div className="text-center max-w-xl">
        <div className="text-5xl mb-4">🔥</div>
        <h1 className="text-4xl font-bold mb-4 tracking-tight">iSabiSpot</h1>
        <p className="text-zinc-400 text-lg mb-8">
          Nigeria&apos;s AI-powered Social Proof Directory for restaurants, hotels,
          clubs, and chill spots across Lagos, Abuja, and Port Harcourt.
        </p>
        <div className="flex flex-col gap-3 text-sm text-left bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <p className="text-zinc-500 font-mono text-xs mb-2">API endpoints live:</p>
          <a
            href="/api/venues"
            className="font-mono text-green-400 hover:text-green-300 transition-colors"
          >
            GET /api/venues
          </a>
          <a
            href="/api/venues?city=Lagos&limit=5"
            className="font-mono text-green-400 hover:text-green-300 transition-colors"
          >
            GET /api/venues?city=Lagos&amp;limit=5
          </a>
        </div>
        <p className="text-zinc-600 text-xs mt-6">
          Building in public — full launch coming soon
        </p>
      </div>
    </main>
  );
}
