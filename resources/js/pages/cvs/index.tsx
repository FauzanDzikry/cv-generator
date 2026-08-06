import AppLayout from '@/layouts/layouts';
import type { CvItem } from '@/types/cv';
import { Head, Link, router } from '@inertiajs/react';
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
    cvs: CvItem[];
}

export default function CvIndex({ cvs }: Props) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

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

    const handleDelete = (id: string, title: string) => {
        if (deletingId) return;
        if (!window.confirm(`Apakah Anda yakin ingin menghapus CV "${title}" secara permanen?`)) return;

        setDeletingId(id);
        router.delete(route('cvs.destroy', id), {
            onFinish: () => setDeletingId(null),
            onError: () => alert('Gagal menghapus CV. Silakan coba lagi.'),
        });
    };

    return (
        <AppLayout>
            <Head title="My CVs" />
            <div className="bg-gray-50 py-8 md:py-16 dark:bg-gray-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My CVs</h1>
                        <Link
                            href={route('form-generate')}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-800"
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
                            {cvs.map((cv) => {
                                const cvTitle = cv.cv_name || cv.name || 'Untitled CV';
                                return (
                                    <li key={cv.id}>
                                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                            <Link href={route('cvs.show', cv.id)} className="block">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-medium text-gray-900 dark:text-white">{cvTitle}</p>
                                                        <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">{cv.email}</p>
                                                    </div>
                                                    <FileText className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
                                                </div>
                                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Updated {formatDate(cv.updated_at)}</p>
                                            </Link>
                                            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700/50">
                                                <Link
                                                    href={route('cvs.edit', cv.id)}
                                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    Edit
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(cv.id, cvTitle)}
                                                    disabled={deletingId === cv.id}
                                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-600 disabled:pointer-events-none disabled:opacity-50 dark:text-gray-400 dark:hover:text-red-400"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    {deletingId === cv.id ? 'Deleting...' : 'Delete'}
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
