import Navbar from '@/components/navbar';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    navItems?: Array<{ title: string; href: string; isExternal?: boolean }>;
}

export default function AppLayout({ children, breadcrumbs, navItems = [], ...props }: AppLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar items={navItems} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
            </main>
        </div>
    );
}
