import { LoaderCircle } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type PdfGenerationDialogProps = {
    open: boolean;
    percentage: number;
    message: string;
};

export function PdfGenerationDialog({ open, percentage, message }: PdfGenerationDialogProps) {
    const clampedPercentage = Math.min(100, Math.max(0, percentage));

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent
                className="sm:max-w-md"
                showCloseButton={false}
                onEscapeKeyDown={(event) => event.preventDefault()}
                onInteractOutside={(event) => event.preventDefault()}
                onPointerDownOutside={(event) => event.preventDefault()}
            >
                <DialogHeader className="items-center text-center">
                    <LoaderCircle className="h-10 w-10 animate-spin text-red-600" aria-hidden="true" />
                    <DialogTitle>Generating PDF</DialogTitle>
                    <DialogDescription>{message}</DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div
                        aria-label="PDF generation progress"
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={clampedPercentage}
                        className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
                        role="progressbar"
                    >
                        <div
                            className="h-full rounded-full bg-red-600 transition-[width] duration-300 ease-out"
                            style={{ width: `${clampedPercentage}%` }}
                        />
                    </div>

                    <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-200">{clampedPercentage}%</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
