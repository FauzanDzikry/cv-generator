import { Head, Link } from '@inertiajs/react';
import { FileText, Pencil, Plus } from 'lucide-react';
import AppLayout from '@/layouts/layouts';

interface CvItem {
    id: number;
    name: string;
    email: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    cvs: CvItem[];
}

export default function CvIndex({ cvs }: Props) {
    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <AppLayout>
            <Head title="My CVs" />
            <div className="py-8 md:py-16 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My CVs</h1>
                        <Link
                            href={route('form-generate')}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                        >
                            <Plus className="h-4 w-4" />
                            Create new CV
                        </Link>
                    </div>

                    {cvs.length === 0 ? (
                        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                            <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                            <p className="mt-2 text-gray-600 dark:text-gray-400">You have not saved any CVs yet.</p>
                            <Link
                                href={route('form-generate')}
                                className="mt-4 inline-flex items-center gap-2 text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
                            >
                                <Plus className="h-4 w-4" />
                                Create your first CV
                            </Link>
                        </div>
                    ) : (
                        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {cvs.map((cv) => (
                                <li key={cv.id}>
                                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                        <Link
                                            href={route('cvs.show', { id: cv.id })}
                                            className="block"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-medium text-gray-900 dark:text-white">{cv.name}</p>
                                                    <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">{cv.email}</p>
                                                </div>
                                                <FileText className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                Updated {formatDate(cv.updated_at)}
                                            </p>
                                        </Link>
                                        <Link
                                            href={route('cvs.edit', { id: cv.id })}
                                            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Edit
                                        </Link>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
