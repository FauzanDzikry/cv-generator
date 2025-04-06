import { Link, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import ThemeToggle from '@/components/ui/theme-toggle';
import { type SharedData, type User } from '@/types';

// Definisikan tipe untuk item navigasi
type NavItem = {
  title: string;
  href: string;
  isExternal?: boolean;
  isSection?: boolean;
};

export default function Navbar({ items = [] }: { items: NavItem[] }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const page = usePage();
  const { auth } = usePage<SharedData>().props;
  
  // Mendeteksi scroll untuk menambahkan shadow
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setHasScrolled(scrollPosition > 0);
      
      // Deteksi section mana yang sedang aktif
      const sections = document.querySelectorAll('section[id], div[id]');
      
      // Jika tidak ada section, jangan lakukan apa-apa
      if (sections.length === 0) return;
      
      // Loop melalui semua section untuk menemukan yang sedang terlihat
      let currentSection: string | null = null;
      
      sections.forEach((section) => {
        const sectionTop = section.getBoundingClientRect().top;
        const sectionId = section.getAttribute('id');
        
        // Jika section ini terlihat pada viewport (dengan offset untuk navbar)
        if (sectionTop <= 100 && sectionId) {
          currentSection = sectionId;
        }
      });
      
      setActiveSection(currentSection);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Initial call to set active section on load
    handleScroll();
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Menutup menu saat ukuran layar berubah ke desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMenuOpen]);
  
  // Fungsi untuk melakukan scroll ke elemen dengan ID tertentu
  const scrollToSection = (sectionId: string) => {
    setIsMenuOpen(false);
    
    // Periksa apakah ada elemen dengan ID tersebut
    const element = document.getElementById(sectionId);
    if (element) {
      // Scroll ke elemen dengan animasi smooth
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Jika tidak ada di halaman ini, arahkan ke halaman home + id elemen
      window.location.href = `/#${sectionId}`;
    }
  };
  
  // Contoh item navigasi, bisa diubah sesuai kebutuhan
  const navItems: NavItem[] = items.length > 0 ? items : [
    { title: 'Home', href: '#cvgen', isSection: true },
    { title: 'How to use', href: '/how-to-use' },
    { title: 'About', href: '#about', isSection: true },
  ];

  // Fungsi untuk menentukan class button/link berdasarkan status aktif
  const getItemClass = (item: NavItem) => {
    // Untuk section item
    if (item.isSection) {
      const sectionId = item.href.substring(1); // Menghilangkan # dari href
      const isActive = activeSection === sectionId;
      
      return cn(
        "px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
      );
    }
    
    // Untuk link biasa
    return cn(
      "px-3 py-2 rounded-md text-sm font-medium transition-colors",
      page.url === item.href
        ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
        : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
    );
  };
  
  // Fungsi untuk menentukan class mobile button/link berdasarkan status aktif
  const getMobileItemClass = (item: NavItem) => {
    // Untuk section item
    if (item.isSection) {
      const sectionId = item.href.substring(1); // Menghilangkan # dari href
      const isActive = activeSection === sectionId;
      
      return cn(
        "block w-full text-left px-3 py-3 rounded-md text-base font-medium transition-colors",
        isActive
          ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
      );
    }
    
    // Untuk link biasa
    return cn(
      "block px-3 py-3 rounded-md text-base font-medium transition-colors",
      page.url === item.href
        ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
        : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
    );
  };
  
  return (
    <nav className={`bg-white dark:bg-gray-800 sticky top-0 z-50 transition-shadow duration-300 ${hasScrolled ? 'shadow-md' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 md:h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-lg md:text-xl font-bold text-red-600 dark:text-white">CV</span><span className="text-lg md:text-xl font-bold text-gray-900 dark:text-red-600"> Generator</span>
            </Link>
          </div>
          
          {/* Menu Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              item.isSection ? (
                <button
                  key={item.title}
                  onClick={() => scrollToSection(item.href.substring(1))}
                  className={getItemClass(item)}
                >
                  {item.title}
                </button>
              ) : (
                <Link
                  key={item.title}
                  href={item.href}
                  className={getItemClass(item)}
                  {...(item.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {item.title}
                </Link>
              )
            ))}
            
            {auth.user ? (
              <span className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 dark:text-white">
                {(auth.user as User).name}
              </span>
            ) : (
              <>
                <Link
                  href="/register"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  Register
                </Link>
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors gradient-button"
                >
                  Login
                </Link>
              </>
            )}
            
            <ThemeToggle />
          </div>
          
          {/* Tombol menu mobile */}
          <div className="md:hidden flex items-center">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 ml-1 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              aria-expanded={isMenuOpen}
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
        className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
          isMenuOpen 
            ? 'max-h-screen opacity-100' 
            : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-2 pt-2 pb-3 space-y-2 sm:px-3">
          {navItems.map((item) => (
            item.isSection ? (
              <button
                key={item.title}
                onClick={() => scrollToSection(item.href.substring(1))}
                className={getMobileItemClass(item)}
              >
                {item.title}
              </button>
            ) : (
              <Link
                key={item.title}
                href={item.href}
                className={getMobileItemClass(item)}
                {...(item.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.title}
              </Link>
            )
          ))}
          
          {auth.user ? (
            <div className="block px-3 py-3 rounded-md text-base font-medium text-gray-900 dark:text-white">
              {(auth.user as User).name}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Link
                href="/register"
                className="flex justify-center items-center px-3 py-3 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Register
              </Link>
              <Link
                href="/login"
                className="flex justify-center items-center px-3 py-3 rounded-md text-base font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}