import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Pencil, Printer } from 'lucide-react';
import CV from '@/components/cv-format';
import AppLayout from '@/layouts/layouts';

interface CvShowProps {
    cv: {
        id: number;
        cv_name?: string | null;
        name: string;
        address: string;
        phone: string;
        email: string;
        linkedin?: string | null;
        summary: string;
        work_experience: unknown;
        education: unknown;
        skills: unknown;
        portfolios?: unknown;
        certifications?: unknown;
        languages?: unknown;
        accomplishments?: unknown;
        organizations?: unknown;
        additional_info?: string | unknown;
        custom_fields?: { is_use_photo?: boolean; photo_base64?: string } | null;
    };
}

export default function CvShow({ cv }: CvShowProps) {
    const customFields = cv.custom_fields ?? {};
    const isUsePhoto = Boolean(customFields.is_use_photo);
    const photoPreview = customFields.photo_base64 ?? null;

    const additionalInfo =
        typeof cv.additional_info === 'string'
            ? cv.additional_info
            : Array.isArray(cv.additional_info)
              ? (cv.additional_info as string[]).join('')
              : '';

    const viewData = {
        ...cv,
        is_use_photo: isUsePhoto,
        photoPreview: photoPreview as string | null,
        additional_info: additionalInfo,
    };

    return (
        <AppLayout>
            <Head title={`CV: ${cv.cv_name || cv.name || 'Untitled CV'}`} />
            <div className="py-8 md:py-16 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                        <Link
                            href={route('cvs.index')}
                            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to My CVs
                        </Link>
                        <Link
                            href={route('cvs.edit', { id: cv.id })}
                            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                        >
                            <Pencil className="h-4 w-4" />
                            Edit
                        </Link>
                        <Link
                            href={route('cvs.edit', { id: cv.id })}
                            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </Link>
                    </div>
                    <div className="overflow-auto rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                        <CV data={viewData} isPdfMode={false} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
