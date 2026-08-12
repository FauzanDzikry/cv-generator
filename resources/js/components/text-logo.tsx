import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

export default function TextLogo({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('flex items-center font-bold tracking-tight', className)} {...props}>
            <span className="text-red-600">CV</span>
            <span className="text-gray-900 dark:text-white">Generator</span>
        </div>
    );
}
