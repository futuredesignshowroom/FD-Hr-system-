// app/(auth)/layout.tsx - Auth Layout

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
