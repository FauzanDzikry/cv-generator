import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

// Event custom untuk perubahan tema
const themeChangeEvent = new Event('themeChange');

export default function ThemeToggle() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    
    // Trigger event saat tema berubah
    document.dispatchEvent(themeChangeEvent);
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 relative"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <Sun 
          className={`h-5 w-5 absolute transition-all duration-300 ${
            theme === 'dark' ? 'opacity-100 transform-none' : 'opacity-0 rotate-90 scale-0'
          }`} 
        />
        <Moon 
          className={`h-5 w-5 absolute transition-all duration-300 ${
            theme === 'light' ? 'opacity-100 transform-none' : 'opacity-0 -rotate-90 scale-0'
          }`} 
        />
      </div>
    </button>
  );
}