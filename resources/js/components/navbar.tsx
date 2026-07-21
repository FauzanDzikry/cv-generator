import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import TextLogo from '@/components/text-logo';
import ThemeToggle from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { type SharedData, type User } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const userDropdownRef = useRef<HTMLDivElement>(null);
    const page = usePage();
    const { auth } = usePage<SharedData>().props;

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            setHasScrolled(scrollPosition > 0);
            const sections = document.querySelectorAll('section[id], div[id]');
            if (sections.length === 0) return;
            let currentSection: string | null = null;
            sections.forEach((section) => {
                const sectionTop = section.getBoundingClientRect().top;
                const sectionId = section.getAttribute('id');
                if (sectionTop <= 100 && sectionId) {
                    currentSection = sectionId;
                }
            });
            setActiveSection(currentSection);
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
                setIsUserDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (isMenuOpen) {
            setIsUserDropdownOpen(false);
        }
    }, [isMenuOpen]);

    const scrollToSection = (sectionId: string) => {
        setIsMenuOpen(false);
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.location.href = `/#${sectionId}`;
        }
    };

    const baseNavItems: NavItem[] =
        items.length > 0
            ? items
            : [
                  { title: 'Home', href: '#cvgen', isSection: true },
                  { title: 'How to use', href: '#how-to-use', isSection: true },
              ];

    const navItems: NavItem[] = auth.user
        ? [...baseNavItems, { title: 'My CVs', href: '/cvs' }]
        : baseNavItems;

    const getItemClass = (item: NavItem) => {
        if (item.isSection) {
            const sectionId = item.href.substring(1);
            const isActive = activeSection === sectionId;
            return cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700',
            );
        }
        return cn(
            'rounded-md px-3 py-2 text-sm font-medium transition-colors',
            page.url === item.href || (item.href !== '/' && page.url.startsWith(item.href))
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700',
        );
    };

    const getMobileItemClass = (item: NavItem) => {
        if (item.isSection) {
            const sectionId = item.href.substring(1);
            const isActive = activeSection === sectionId;
            return cn(
                'block w-full rounded-md px-3 py-3 text-left text-base font-medium transition-colors',
                isActive
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700',
            );
        }
        return cn(
            'block rounded-md px-3 py-3 text-base font-medium transition-colors',
            page.url === item.href || (item.href !== '/' && page.url.startsWith(item.href))
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700',
        );
    };

    return (
        <nav className={`sticky top-0 z-50 bg-white transition-shadow duration-300 dark:bg-gray-800 ${hasScrolled ? 'shadow-md' : ''}`}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-14 justify-between md:h-16">
                    <div className="flex items-center">
                        <Link href="/" className="flex flex-shrink-0 items-center">
                            <TextLogo className="text-lg md:text-xl" />
                        </Link>
                    </div>

                    <div className="hidden items-center space-x-4 md:flex">
                        {navItems.map((item) =>
                            item.isSection ? (
                                <button key={item.title} onClick={() => scrollToSection(item.href.substring(1))} className={getItemClass(item)}>
                                    {item.title}
                                </button>
                            ) : (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    className={getItemClass(item)}
                                    {...(item.isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                >
                                    {item.title}
                                </Link>
                            ),
                        )}

                        {auth.user ? (
                            <div className="relative" ref={userDropdownRef}>
                                <button
                                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                    className="flex items-center space-x-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 transition-colors hover:bg-gray-100 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={(auth.user as User).avatar} alt={(auth.user as User).name} />
                                        <AvatarFallback className="bg-red-100 text-sm font-medium text-red-600 dark:bg-red-900 dark:text-red-400">
                                            {(auth.user as User).name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{(auth.user as User).name}</span>
                                    <ChevronDown
                                        className={cn(
                                            'h-4 w-4 text-gray-500 transition-transform duration-200 dark:text-gray-400',
                                            isUserDropdownOpen ? 'rotate-180' : '',
                                        )}
                                    />
                                </button>

                                {isUserDropdownOpen && (
                                    <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{(auth.user as User).name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{(auth.user as User).email}</div>
                                        </div>

                                        <div className="mt-1"></div>

                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            className="flex w-full items-center space-x-2 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                                            onClick={() => setIsUserDropdownOpen(false)}
                                        >
                                            <LogOut className="h-4 w-4" />
                                            <span>Logout</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="gradient-button rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                                >
                                    Login
                                </Link>
                            </>
                        )}

                        <ThemeToggle />
                    </div>

                    <div className="flex items-center md:hidden">
                        <ThemeToggle />
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="ml-1 inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                            aria-expanded={isMenuOpen}
                        >
                            <span className="sr-only">Buka menu utama</span>
                            <div className="relative h-6 w-6">
                                <X
                                    className={`absolute h-6 w-6 transition-all duration-300 ${
                                        isMenuOpen ? 'transform-none opacity-100' : 'scale-0 rotate-90 opacity-0'
                                    }`}
                                    aria-hidden="true"
                                />
                                <Menu
                                    className={`absolute h-6 w-6 transition-all duration-300 ${
                                        !isMenuOpen ? 'transform-none opacity-100' : 'scale-0 -rotate-90 opacity-0'
                                    }`}
                                    aria-hidden="true"
                                />
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <div
                className={`overflow-hidden transition-all duration-500 ease-in-out md:hidden ${
                    isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="space-y-2 px-2 pt-2 pb-3 sm:px-3">
                    {navItems.map((item) =>
                        item.isSection ? (
                            <button key={item.title} onClick={() => scrollToSection(item.href.substring(1))} className={getMobileItemClass(item)}>
                                {item.title}
                            </button>
                        ) : (
                            <Link
                                key={item.title}
                                href={item.href}
                                className={getMobileItemClass(item)}
                                {...(item.isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.title}
                            </Link>
                        ),
                    )}

                    {auth.user ? (
                        <div className="space-y-3 px-3 py-3">
                            <div className="flex items-center space-x-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 dark:border-gray-600 dark:bg-gray-700">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={(auth.user as User).avatar} alt={(auth.user as User).name} />
                                    <AvatarFallback className="bg-red-100 text-base font-medium text-red-600 dark:bg-red-900 dark:text-red-400">
                                        {(auth.user as User).name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{(auth.user as User).name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{(auth.user as User).email}</div>
                                </div>
                            </div>

                            <Link
                                href="/dashboard"
                                className="flex items-center space-x-2 rounded-md px-3 py-3 text-base font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <span>Dashboard</span>
                            </Link>

                            <Link
                                href="/settings/profile"
                                className="flex items-center space-x-2 rounded-md px-3 py-3 text-base font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <span>Profile Settings</span>
                            </Link>

                            <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>

                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="flex w-full items-center space-x-2 rounded-md px-3 py-3 text-base font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Logout</span>
                            </Link>
                        </div>
                    ) : (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <Link
                                href="/register"
                                className="flex items-center justify-center rounded-md px-3 py-3 text-base font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Register
                            </Link>
                            <Link
                                href="/login"
                                className="flex items-center justify-center rounded-md bg-red-600 px-3 py-3 text-base font-medium text-white transition-colors hover:bg-red-700"
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
