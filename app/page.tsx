// app/page.tsx - Home Page

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-2xl bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">HRMS System</h1>
              <p className="mt-3 text-gray-600 text-sm sm:text-base">Smart, responsive HR management — attendance, leaves, payroll and more.</p>
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0 justify-center lg:justify-start">
                <a href="/login?role=employee" className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 text-center">Employee Login</a>
                <a href="/login?role=admin" className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 text-center">Admin Login</a>
                <a href="/admin-signup" className="w-full sm:w-auto px-6 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-center">Admin Registration</a>
              </div>
            </div>
            <div className="w-40 h-40 flex-shrink-0 bg-gradient-to-br from-green-200 to-blue-200 rounded-xl flex items-center justify-center">
              <svg className="w-20 h-20 text-white opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2l3 6 6 .5-4.5 4 1 6.5L12 17l-5.5 2.5L7.5 13 3 9.5 9 9l3-7z" strokeWidth="0" fill="white" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
