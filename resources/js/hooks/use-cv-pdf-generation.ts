import { sanitizeOklchColors } from '@/lib/utils';
import { useRef, useState } from 'react';

const PDF_PROGRESS_START = 70;
const PDF_PROGRESS_CAP = 95;
const PDF_PROGRESS_TICK_MS = 100;
const PDF_ESTIMATE_BASE_MS = 1000;
const PDF_ESTIMATE_PER_PAGE_MS = 800;
const PDF_ESTIMATE_PER_IMAGE_MS = 400;

type PdfGenerationProgress = {
    percentage: number;
    message: string;
};

export function useCvPdfGeneration() {
    const [pdfGenerationProgress, setPdfGenerationProgress] = useState<PdfGenerationProgress | null>(null);
    const generationInProgress = useRef(false);
    const isGeneratingPDF = pdfGenerationProgress !== null;

    const generatePDF = async (element: HTMLElement | null, rawName: string) => {
        if (generationInProgress.current) return;
        if (!element) {
            alert('CV not ready for export. Please try again.');
            return;
        }

        generationInProgress.current = true;
        let progressTimer: number | null = null;

        setPdfGenerationProgress({
            percentage: 5,
            message: 'Starting PDF generation...',
        });

        try {
            if (typeof document !== 'undefined' && 'fonts' in document) {
                try {
                    await document.fonts.ready;
                } catch {
                    // Ignore font readiness errors.
                }
            }

            setPdfGenerationProgress({
                percentage: 20,
                message: 'Preparing fonts...',
            });

            const images = Array.from(element.querySelectorAll('img'));
            await Promise.all(
                images.map(async (img) => {
                    if (img.complete && img.naturalWidth > 0) {
                        if ('decode' in img) {
                            try {
                                await img.decode();
                            } catch {
                                // Ignore decode errors for images that are already loaded.
                            }
                        }
                        return;
                    }

                    await new Promise<void>((resolve) => {
                        const done = () => resolve();
                        img.addEventListener('load', done, { once: true });
                        img.addEventListener('error', done, { once: true });
                    });

                    if ('decode' in img) {
                        try {
                            await img.decode();
                        } catch {
                            // Ignore image decode errors.
                        }
                    }
                }),
            );

            setPdfGenerationProgress({
                percentage: 40,
                message: 'Loading images...',
            });

            await new Promise((resolve) => setTimeout(resolve, 300));

            const safeName =
                rawName
                    .replace(/[^a-z0-9_\-.]/gi, '_')
                    .replace(/_+/g, '_')
                    .replace(/^_|_$/g, '') || 'cv';

            const options = {
                margin: 0,
                filename: `${safeName}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    onclone: sanitizeOklchColors,
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait',
                },
            };

            setPdfGenerationProgress({
                percentage: 55,
                message: 'Preparing document...',
            });

            const html2pdfModule = await import('html2pdf.js');

            setPdfGenerationProgress({
                percentage: 70,
                message: 'Loading PDF generator...',
            });

            const html2pdf = html2pdfModule.default || html2pdfModule;
            const expectedPageCount = element.querySelectorAll('.cv-page').length;

            if (expectedPageCount === 0) {
                throw new Error('CV export contains no pages.');
            }

            setPdfGenerationProgress({
                percentage: PDF_PROGRESS_START,
                message: 'Generating PDF file...',
            });

            const estimatedDurationMs =
                PDF_ESTIMATE_BASE_MS + expectedPageCount * PDF_ESTIMATE_PER_PAGE_MS + images.length * PDF_ESTIMATE_PER_IMAGE_MS;
            const progressStartedAt = performance.now();

            progressTimer = window.setInterval(() => {
                const elapsed = performance.now() - progressStartedAt;
                const ratio = Math.min(1, elapsed / estimatedDurationMs);
                const estimatedPercentage = Math.min(
                    PDF_PROGRESS_CAP,
                    PDF_PROGRESS_START + Math.floor((PDF_PROGRESS_CAP - PDF_PROGRESS_START) * ratio),
                );

                setPdfGenerationProgress((current) => {
                    if (!current || current.percentage >= 100) return current;
                    return {
                        percentage: Math.max(current.percentage, estimatedPercentage),
                        message: 'Generating PDF file...',
                    };
                });
            }, PDF_PROGRESS_TICK_MS);

            const pdfWorker = html2pdf().set(options).from(element).toPdf();
            const pdf = await pdfWorker.get('pdf');
            const generatedPageCount = pdf.internal.getNumberOfPages();

            if (generatedPageCount < expectedPageCount) {
                throw new Error(`PDF generated ${generatedPageCount} of ${expectedPageCount} expected pages.`);
            }

            for (let pageNumber = generatedPageCount; pageNumber > expectedPageCount; pageNumber -= 1) {
                pdf.deletePage(pageNumber);
            }

            await pdfWorker.save();

            if (progressTimer !== null) {
                window.clearInterval(progressTimer);
                progressTimer = null;
            }

            setPdfGenerationProgress({
                percentage: 100,
                message: 'PDF generated successfully.',
            });

            if (typeof window.gtag === 'function') {
                window.gtag('event', 'generate_pdf');
            }

            await new Promise((resolve) => window.setTimeout(resolve, 400));
            setPdfGenerationProgress(null);
        } catch (error) {
            console.error('Error generating PDF:', error);
            setPdfGenerationProgress(null);
            await new Promise((resolve) => window.setTimeout(resolve, 0));
            alert('An error occurred while generating the PDF. Please try again.');
        } finally {
            generationInProgress.current = false;
            if (progressTimer !== null) {
                window.clearInterval(progressTimer);
            }
        }
    };

    return { generatePDF, isGeneratingPDF, pdfGenerationProgress };
}
