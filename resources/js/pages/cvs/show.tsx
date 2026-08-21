import CV from '@/components/cv-format';
import { PdfGenerationDialog } from '@/components/pdf-generation-dialog';
import { useCvPdfGeneration } from '@/hooks/use-cv-pdf-generation';
import AppLayout from '@/layouts/layouts';
import { PAGE_WIDTH_MM } from '@/lib/cv-page-layout';
import { getEnabledSections } from '@/lib/cv-sections';
import type { CVCustomFields, CVType } from '@/types/cv';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, FileDown, Pencil, Trash2 } from 'lucide-react';
import React, { useRef, useState } from 'react';

interface CvShowProps {
    addOnSections?: Record<string, boolean>;
    cv: {
        id: string;
        cv_name?: string | null;
        name: string;
        address: string;
        phone: string;
        email: string;
        linkedin?: string | null;
        summary: string;
        cv_type?: CVType;
        work_experience: unknown;
        education: unknown;
        skills: unknown;
        portfolios?: unknown;
        certifications?: unknown;
        languages?: unknown;
        accomplishments?: unknown;
        organizations?: unknown;
        additional_info?: string | unknown;
        custom_fields?: CVCustomFields | null;
        has_photo?: boolean;
        photo_url?: string | null;
    };
}

export default function CvShow({ cv, addOnSections }: CvShowProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const { generatePDF, isGeneratingPDF, pdfGenerationProgress } = useCvPdfGeneration();
    const cvRef = useRef<HTMLDivElement>(null);

    const customFields = cv.custom_fields ?? {};
    const isUsePhoto = Boolean(customFields.is_use_photo);
    const photoPreview = cv.has_photo ? (cv.photo_url ?? null) : null;
    const enabledSections = getEnabledSections(addOnSections ?? customFields.enabled_sections);

    const additionalInfo =
        typeof cv.additional_info === 'string'
            ? cv.additional_info
            : Array.isArray(cv.additional_info)
              ? (cv.additional_info as string[]).join('')
              : '';

    const viewData = {
        ...cv,
        linkedin: cv.linkedin || '',
        is_use_photo: isUsePhoto,
        photoPreview: photoPreview as string | null,
        additional_info: additionalInfo,
    };

    const handleDelete = () => {
        if (isDeleting) return;
        if (!window.confirm('Apakah Anda yakin ingin menghapus CV ini secara permanen?')) return;

        setIsDeleting(true);
        router.delete(route('cvs.destroy', cv.id), {
            onFinish: () => setIsDeleting(false),
            onError: () => alert('Gagal menghapus CV. Silakan coba lagi.'),
        });
    };

    return (
        <AppLayout>
            <Head title={`CV: ${cv.cv_name || cv.name || 'Untitled CV'}`} />
            <PdfGenerationDialog
                open={isGeneratingPDF}
                percentage={pdfGenerationProgress?.percentage ?? 0}
                message={pdfGenerationProgress?.message ?? ''}
            />
            <div className="bg-gray-50 py-8 md:py-16 dark:bg-gray-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 flex flex-wrap items-center gap-4">
                        <Link
                            href={route('cvs.index')}
                            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to My CVs
                        </Link>
                        <Link
                            href={route('cvs.edit', cv.id)}
                            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-800"
                        >
                            <Pencil className="h-4 w-4" />
                            Edit
                        </Link>
                        <button
                            type="button"
                            onClick={() => generatePDF(cvRef.current, cv.cv_name || cv.name || 'cv')}
                            disabled={isGeneratingPDF}
                            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            <FileDown className="h-4 w-4" />
                            {isGeneratingPDF ? 'Generating...' : 'Generate PDF'}
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:pointer-events-none disabled:opacity-50 dark:border-red-700/40 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                            <Trash2 className="h-4 w-4" />
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                    <div className="overflow-auto rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                        <CV
                            data={viewData as unknown as React.ComponentProps<typeof CV>['data']}
                            enabledSections={enabledSections}
                            isPdfMode={false}
                        />
                    </div>
                </div>
            </div>

            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    top: '-99999px',
                    left: '-99999px',
                    width: `${PAGE_WIDTH_MM}mm`,
                    pointerEvents: 'none',
                    zIndex: -1,
                }}
            >
                <div
                    ref={cvRef}
                    id="cv-to-export"
                    className="cv-for-pdf pdf-export-mode"
                    style={{
                        backgroundColor: 'white',
                        width: `${PAGE_WIDTH_MM}mm`,
                        padding: 0,
                        margin: 0,
                        boxSizing: 'border-box',
                    }}
                >
                    <CV data={viewData as unknown as React.ComponentProps<typeof CV>['data']} enabledSections={enabledSections} isPdfMode={true} />
                </div>
            </div>
        </AppLayout>
    );
}
