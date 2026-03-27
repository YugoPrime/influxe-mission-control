export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 w-full max-w-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mx-auto">
          <span className="text-white font-bold text-xl">⚡</span>
        </div>
        <h1 className="text-xl font-bold text-white">Mission Control</h1>
        <p className="text-slate-400 text-sm">Auth is bypassed in development mode.</p>
        <a 
          href="/"
          className="block w-full bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Enter Dashboard →
        </a>
      </div>
    </div>
  )
}
