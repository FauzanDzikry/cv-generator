import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    navItems?: Array<{ title: string; href: string; isExternal?: boolean }>;
}

export default function AppLayout({ children, breadcrumbs, navItems = [], ...props }: AppLayoutProps) {
    return (
        <div className="min-h-screen bg-transparent dark:bg-gray-900">
            <Navbar items={navItems} />
            <main className="w-full">
                {children}
            </main>
            <Footer />
        </div>
    );
}
