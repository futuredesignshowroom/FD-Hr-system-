// components/ui/Badge.tsx - Badge Component

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
}

export default function Badge({
  variant = 'default',
  children,
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-gray-200 text-gray-800',
    success: 'bg-green-200 text-green-800',
    warning: 'bg-yellow-200 text-yellow-800',
    danger: 'bg-red-200 text-red-800',
    info: 'bg-blue-200 text-blue-800',
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
