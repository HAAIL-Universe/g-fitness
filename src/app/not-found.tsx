export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gf-pink mb-4">404</h1>
        <p className="text-gf-muted mb-6">Page not found</p>
        <a
          href="/"
          className="inline-block bg-gf-pink text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gf-pink-dark transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  )
}
