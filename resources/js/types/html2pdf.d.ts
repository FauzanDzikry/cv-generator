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

    interface Html2PdfInstance {
        from(element: HTMLElement | string): Html2PdfInstance;
        set(options: Html2PdfOptions): Html2PdfInstance;
        save(): Promise<any>;
        toPdf(): any;
        get(key: string): any;
    }

    export default function(): Html2PdfInstance;
} 