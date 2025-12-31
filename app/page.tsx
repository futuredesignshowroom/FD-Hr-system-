// app/page.tsx - Home Page

export default function Home() {
  return (
    <main>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">HRMS System</h1>
          <p className="text-xl text-gray-600 mb-8">
            Human Resource Management System
          </p>
          <div className="space-x-4">
            <a
              href="/login?role=employee"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Employee Login
            </a>
            <a
              href="/login?role=admin"
              className="inline-block px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Admin Login
            </a>
            <a
              href="/admin-signup"
              className="inline-block px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Admin Registration
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
