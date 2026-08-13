import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    navItems?: Array<{ title: string; href: string; isExternal?: boolean }>;
}

export default function AppLayout({ children, navItems = [] }: AppLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col bg-transparent dark:bg-gray-900">
            <Navbar items={navItems} />
            <main className="w-full flex-1">{children}</main>
            <Footer />
        </div>
    );
}
