// components/ui/Avatar.tsx - Avatar Component

import React from 'react';

interface AvatarProps {
  name: string;
  size?: number;
}

export default function Avatar({ name, size = 40 }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold bg-blue-500"
      style={{ width: size, height: size, fontSize: size / 2.5 }}
    >
      {initials}
    </div>
  );
}