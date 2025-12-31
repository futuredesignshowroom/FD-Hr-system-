'use client';

interface HamburgerMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function HamburgerMenu({ isOpen, onToggle }: HamburgerMenuProps) {
  return (
    <button
      onClick={onToggle}
      className="lg:hidden relative w-8 h-8 flex flex-col justify-center items-center space-y-1 p-2 rounded-md hover:bg-gray-100 transition-colors"
      aria-label="Toggle menu"
    >
      <span
        className={`block w-6 h-0.5 bg-gray-600 transition-all duration-300 ${
          isOpen ? 'rotate-45 translate-y-1.5' : ''
        }`}
      />
      <span
        className={`block w-6 h-0.5 bg-gray-600 transition-all duration-300 ${
          isOpen ? 'opacity-0' : ''
        }`}
      />
      <span
        className={`block w-6 h-0.5 bg-gray-600 transition-all duration-300 ${
          isOpen ? '-rotate-45 -translate-y-1.5' : ''
        }`}
      />
    </button>
  );
}