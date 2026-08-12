declare module 'html2pdf.js' {
    interface Html2PdfOptions {
        margin?: number | number[];
        filename?: string;
        image?: {
            type?: string;
            quality?: number;
        };
        html2canvas?: {
            scale?: number;
            useCORS?: boolean;
            backgroundColor?: string | null;
            letterRendering?: boolean;
            logging?: boolean;
            allowTaint?: boolean;
            scrollX?: number;
            scrollY?: number;
            windowWidth?: number;
            windowHeight?: number;
        };
        jsPDF?: {
            unit?: string;
            format?: string;
            orientation?: string;
            compress?: boolean;
        };
        pagebreak?: {
            mode?: string | string[];
            before?: string[] | string;
            after?: string[] | string;
            avoid?: string[] | string;
        };
    }

    interface JsPdfInstance {
        internal: {
            getNumberOfPages(): number;
        };
        deletePage(pageNumber: number): void;
    }

    interface Html2PdfInstance {
        from(element: HTMLElement | string): Html2PdfInstance;
        set(options: Html2PdfOptions): Html2PdfInstance;
        save(): Promise<unknown>;
        toPdf(): Html2PdfInstance;
        get(key: 'pdf'): Promise<JsPdfInstance>;
    }

    export default function (): Html2PdfInstance;
}
