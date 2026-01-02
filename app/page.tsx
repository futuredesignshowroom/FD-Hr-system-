// app/page.tsx - Home Page

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-transparent to-indigo-100/20"></div>
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-indigo-200/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-purple-200/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative flex items-center justify-center px-4 py-24 min-h-screen">
        <div className="w-full max-w-4xl bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-left">
              <div className="mb-6">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4">
                  HRMS System
                </h1>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mx-auto lg:mx-0"></div>
              </div>

              <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed">
                Smart, responsive HR management — attendance, leaves, payroll and more.
                <span className="block text-base text-slate-500 mt-2">Streamline your workforce management with our premium platform.</span>
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0 justify-center lg:justify-start">
                <a
                  href="/login?role=employee"
                  className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 font-semibold text-center overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10">Employee Login</span>
                </a>

                <a
                  href="/login?role=admin"
                  className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:shadow-indigo-500/25 transition-all duration-300 font-semibold text-center overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10">Admin Login</span>
                </a>

                <a
                  href="/admin-signup"
                  className="group relative w-full sm:w-auto px-8 py-4 border-2 border-slate-200 rounded-xl text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all duration-300 font-semibold text-center bg-white/50 backdrop-blur-sm"
                >
                  Admin Registration
                </a>
              </div>
            </div>

            <div className="w-48 h-48 lg:w-56 lg:h-56 flex-shrink-0 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-300/20 to-purple-500/20 rounded-2xl blur-xl"></div>
              <div className="relative w-full h-full bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                <svg className="w-24 h-24 lg:w-28 lg:h-28 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2l3 6 6 .5-4.5 4 1 6.5L12 17l-5.5 2.5L7.5 13 3 9.5 9 9l3-7z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
