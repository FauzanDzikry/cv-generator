import { Link, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import ThemeToggle from '@/components/ui/theme-toggle';

// Definisikan tipe untuk item navigasi
type NavItem = {
  title: string;
  href: string;
  isExternal?: boolean;
};

export default function Navbar({ items = [] }: { items: NavItem[] }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const page = usePage();
  
  // Contoh item navigasi, bisa diubah sesuai kebutuhan
  const navItems: NavItem[] = items.length > 0 ? items : [
    { title: 'Beranda', href: '/' },
    { title: 'Tentang', href: '/tentang' },
    { title: 'Layanan', href: '/layanan' },
    { title: 'Kontak', href: '/kontak' }
  ];
  
  return (
    <nav className="bg-white shadow-md dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-900 dark:text-white">CV Generator</span>
            </Link>
          </div>
          
          {/* Menu Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  page.url === item.href
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
                {...(item.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {item.title}
              </Link>
            ))}
            <ThemeToggle />
          </div>
          
          {/* Tombol menu mobile */}
          <div className="flex items-center md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 relative"
            >
              <span className="sr-only">Buka menu utama</span>
              <div className="relative w-6 h-6">
                <X 
                  className={`absolute h-6 w-6 transition-all duration-300 ${
                    isMenuOpen ? 'opacity-100 transform-none' : 'opacity-0 rotate-90 scale-0'
                  }`} 
                  aria-hidden="true" 
                />
                <Menu 
                  className={`absolute h-6 w-6 transition-all duration-300 ${
                    !isMenuOpen ? 'opacity-100 transform-none' : 'opacity-0 -rotate-90 scale-0'
                  }`} 
                  aria-hidden="true" 
                />
              </div>
            </button>
          </div>
        </div>
      </div>
      
      {/* Menu Mobile */}
      <div 
        className={`md:hidden overflow-hidden transition-all duration-600 ease-in-out ${
          isMenuOpen 
            ? 'max-h-96 opacity-100' 
            : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "block px-3 py-2 rounded-md text-base font-medium",
                page.url === item.href
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
              {...(item.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.title}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}