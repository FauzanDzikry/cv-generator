import React, { useState, useEffect, useRef, ReactElement, useMemo } from 'react';
import ReactDOM from 'react-dom';

// Style untuk page break dan PDF export mode
export const pageBreakStyle = `
.html2pdf__page-break {
    margin-top: 30px;
    page-break-before: always;
}
@media print {
    .html2pdf__page-break {
        height: 0;
        page-break-before: always;
        margin: 0;
        border-top: none;
    }
    
    /* Sembunyikan kontrol zoom saat print, tapi tetap tampilkan indikator halaman */
    .zoom-controls {
        display: none !important;
    }
}

/* Style khusus untuk mode ekspor PDF */
.pdf-export-mode {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
    background-color: white !important;
    height: auto !important;
    width: 21cm !important;
    padding: 2.54cm !important;
    border: none !important;
    box-shadow: none !important;
    margin: 0 !important;
    overflow: hidden !important;
    font-family: Arial, sans-serif !important;
}

/* Style untuk mode PDF */
.cv-for-pdf-mode {
    background-color: white;
    font-family: Arial, sans-serif !important;
}

.cv-for-pdf-mode .cv-page {
    box-shadow: none !important;
    border: none !important;
}

.cv-for-pdf-mode h1 {
    font-size: 24pt !important;
    margin-bottom: 8pt !important;
    margin-top: 0 !important;
    text-align: inherit !important;
    font-family: Arial, sans-serif !important;
}

.cv-for-pdf-mode h2 {
    font-size: 16pt !important;
    margin-bottom: 6pt !important;
    font-family: Arial, sans-serif !important;
}

.cv-for-pdf-mode p, 
.cv-for-pdf-mode div {
    font-size: 11pt !important;
    line-height: 1.5 !important;
    font-family: Arial, sans-serif !important;
}

.cv-for-pdf-mode .cv-header {
    padding-bottom: 1rem !important;
}

.pdf-export-mode * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-family: Arial, sans-serif !important;
}

/* Sembunyikan kontrol zoom dalam mode PDF, tapi tetap tampilkan indikator halaman */
.cv-for-pdf-mode .zoom-controls {
    display: none !important;
}

/* Style khusus untuk skills section dalam PDF mode */
.cv-for-pdf-mode .skills-container {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 2rem !important;
    justify-content: flex-start !important;
    width: 100% !important;
}

.cv-for-pdf-mode .skills-column {
    flex: 1 1 auto !important;
    min-width: 120px !important;
    max-width: 200px !important;
    display: flex !important;
    flex-direction: column !important;
}

.pdf-export-mode .skills-container {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 2rem !important;
    justify-content: flex-start !important;
    width: 100% !important;
}

.pdf-export-mode .skills-column {
    flex: 1 1 auto !important;
    min-width: 120px !important;
    max-width: 200px !important;
    display: flex !important;
    flex-direction: column !important;
}

/* General CV page styling with Arial font */
.cv-page {
    font-family: Arial, sans-serif !important;
}

.cv-page * {
    font-family: Arial, sans-serif !important;
}
`;

const formatDate = (dateString: string) => {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch (e) {
        return dateString;
    }
};

const formatPhoneForWhatsApp = (phone: string) => {
    if (!phone) return '';
    
    // Hapus semua karakter yang bukan angka
    let cleanNumber = phone.replace(/\D/g, '');
    
    // Jika dimulai dengan +62, hapus + nya
    if (cleanNumber.startsWith('62')) {
        return cleanNumber;
    }
    
    // Jika dimulai dengan 0, ganti dengan 62
    if (cleanNumber.startsWith('0')) {
        return '62' + cleanNumber.substring(1);
    }
    
    // Jika tidak dimulai dengan 62 atau 0, tambahkan 62 di depan
    return '62' + cleanNumber;
};

const calculateDuration = (startDate: string, endDate: string, isCurrent: boolean = false) => {
    try {
        const start = new Date(startDate);
        const end = isCurrent ? new Date() : new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return '';
        }

        // Calculate difference in months
        let months = (end.getFullYear() - start.getFullYear()) * 12;
        months += end.getMonth() - start.getMonth();

        // Adjust for day difference
        if (end.getDate() < start.getDate()) {
            months--;
        }

        // Calculate years and remaining months
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;

        // Format the duration
        if (years > 0 && remainingMonths > 0) {
            return `(${years}y ${remainingMonths}m)`;
        } else if (years > 0) {
            return `(${years}y)`;
        } else if (remainingMonths > 0) {
            return `(${remainingMonths}m)`;
        } else {
            return '(< 1m)';
        }
    } catch (e) {
        return '';
    }
};

interface WorkExperience {
    company: string;
    company_location: string;
    position: string;
    start_date: string;
    end_date: string;
    description: string;
    is_current?: boolean;
    location_type: string;
}

interface Education {
    institution: string;
    degree: string;
    field: string;
    start_date: string;
    end_date: string;
    description: string;
}

interface Skill {
    name: string;
}

interface Portfolio {
    title: string;
    link: string;
    description: string;
}

interface Certification {
    name: string;
    organization: string;
    start_year: string;
    end_year: string;
    is_time_limited?: boolean;
    description: string;
    credential_id?: string;
}

interface Accomplishment {
    description: string;
}

interface Organization {
    name: string;
    position: string;
    start_date: string;
    end_date: string;
    description: string;
}

interface Language {
    language: string;
    level: string;
}

interface CVData {
    name: string;
    address: string;
    phone: string;
    email: string;
    linkedin: string;
    summary: string;
    is_use_photo: boolean;
    photo?: File | null;
    photoPreview?: string | null;
    work_experience: WorkExperience[];
    education: Education[];
    skills: Skill[];
    certifications?: Certification[];
    languages?: Language[];
    portfolios?: Portfolio[];
    accomplishments?: Accomplishment[];
    organizations?: Organization[];
    additional_info?: string;
}

interface CVProps {
    data: CVData;
    isPdfMode?: boolean;
}

const CV: React.FC<CVProps> = ({ data, isPdfMode = false }) => {
    const [zoomLevel, setZoomLevel] = useState(100);
    const [showZoomControls, setShowZoomControls] = useState(false);
    const [pages, setPages] = useState<React.ReactNode[]>([]);
    const cvContentRef = useRef<HTMLDivElement>(null);
    const contentObserverRef = useRef<ResizeObserver | null>(null);
    // Tinggi halaman A4 = 29.7cm, margin top + bottom = 5.08cm, area konten = 24.62cm
    // Dikurangi ruang untuk page number (40px) = 24.62cm - 40px ≈ 890px
    // Dalam piksel (96 DPI): area konten yang aman = 890px
    const PAGE_HEIGHT = 890; // Tinggi area konten yang tersedia dengan margin 1 inch dan ruang page number

    // Sisipkan style untuk PDF saat komponen mount
    useEffect(() => {
        // Tambahkan style ke head dokumen
        const styleElement = document.createElement('style');
        styleElement.innerHTML = pageBreakStyle;
        document.head.appendChild(styleElement);

        // Cleanup saat komponen unmount
        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

    // Set showZoomControls false ketika isPdfMode true, dan true ketika isPdfMode false
    useEffect(() => {
        setShowZoomControls(!isPdfMode);
    }, [isPdfMode]);

    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setZoomLevel(parseInt(e.target.value));
    };

    const toggleZoomControls = () => {
        if (!isPdfMode) {
            setShowZoomControls(prev => !prev);
        }
    };

    // Konstanta tinggi elemen (dioptimalkan untuk penggunaan ruang yang lebih efisien)
    const SECTION_HEADING_HEIGHT = 40;   // Tinggi heading section (dikurangi dari 50)
    const ITEM_HEADING_HEIGHT = 45;      // Tinggi heading item (dikurangi dari 60)
    const BULLET_POINT_HEIGHT = 20;      // Tinggi per bullet point (dikurangi dari 25)
    const WORK_BULLET_POINT_HEIGHT = 25; // Tinggi per bullet point untuk work experience (dikurangi dari 35)
    const PARAGRAPH_HEIGHT = 30;         // Tinggi paragraf normal (dikurangi dari 40)
    const SPACING_HEIGHT = 10;           // Tinggi spacing antar item (dikurangi dari 15)
    const SECTION_SPACING_HEIGHT = 15;   // Tinggi spacing antar section (dikurangi dari 20)
    const LINE_HEIGHT = 16;              // Tinggi per baris teks (dikurangi dari 20)
    const BORDER_LINE_HEIGHT = 8;        // Tinggi garis border bawah heading (dikurangi dari 10)



    // Fungsi untuk membuat halaman CV
    const createPage = (content: React.ReactNode, pageIndex?: number, totalPages?: number) => (
        <div 
            className="cv-page bg-white shadow-lg rounded-lg mb-8"
            style={{
                width: '21cm',
                height: '29.7cm',
                padding: '2.54cm', // Margin 1 inch di semua sisi
                boxSizing: 'border-box',
                fontSize: '11pt',
                lineHeight: '1.5',
                backgroundColor: 'white',
                boxShadow: '0 0 10px rgba(83, 81, 81, 0.2)',
                margin: '0 auto',
                marginTop: '40px',
                position: 'relative',
                overflowY: 'hidden',
                fontFamily: 'Arial, sans-serif'
            }}
        >
            <div style={{ minHeight: 'calc(100% - 60px)', paddingBottom: '20px' }}>
                {content}
            </div>
            {/* Page number di dalam setiap halaman */}
            {typeof pageIndex === 'number' && typeof totalPages === 'number' && (
                <div 
                    className="page-number-indicator"
                    style={{
                        position: 'absolute',
                        bottom: '1.5cm',
                        left: '2.54cm',
                        right: '2.54cm',
                        textAlign: 'center',
                        fontSize: '10px',
                        color: '#9CA3AF',
                        fontFamily: 'Arial, sans-serif',
                        height: '20px',
                        lineHeight: '20px'
                    }}
                >
                    Page {pageIndex + 1} of {totalPages}
                </div>
            )}
        </div>
    );

    // Fungsi untuk membagi konten ke beberapa halaman
    useEffect(() => {
        if (!data || Object.keys(data).length === 0) return;

        // Buat array untuk menampung konten tiap halaman
        let pageContents: React.ReactNode[][] = [];

        // Halaman pertama selalu dimulai dengan header
        let currentPage: React.ReactNode[] = [];
        
        // Header selalu di halaman pertama
        currentPage.push(
            <div key="header" className="cv-header pb-4">
                <div className="flex items-start justify-between">
                    {data.is_use_photo && (data.photo || data.photoPreview) && (
                        <div className="w-1/4 flex justify-start">
                            <div className="h-32 w-32 rounded-full overflow-hidden border-2 border-gray-300">
                                <img
                                    src={data.photoPreview || (data.photo ? URL.createObjectURL(data.photo) : '')}
                                    alt={`${data.name}'s photo`}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        </div>
                    )}

                    <div className={`${data.is_use_photo && (data.photo || data.photoPreview) ? 'w-3/4' : 'w-full'}`}>
                        <h1 className={`text-3xl font-bold text-gray-900 ${!data.is_use_photo ? 'text-center' : ''}`} style={{ fontFamily: 'Arial, sans-serif' }}>{data.name}</h1>

                        {data.is_use_photo ? <div className="mt-3 text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-1" style={{ fontFamily: 'Arial, sans-serif' }}>
                            {data.address && <p className="flex items-center gap-2"><span>{data.is_use_photo ? '📍' : ''}</span>{data.address}</p>}
                            {data.phone && <p className="flex items-center gap-2">
                                <span>{data.is_use_photo ? '📱' : ''}</span>
                                <a 
                                    href={`https://wa.me/${formatPhoneForWhatsApp(data.phone)}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="hover:text-blue-600 hover:underline"
                                    style={{ fontFamily: 'Arial, sans-serif' }}
                                >
                                    {data.phone}
                                </a>
                            </p>}
                            {data.email && <p className="flex items-center gap-2"><span>{data.is_use_photo ? '✉️' : ''}</span>{data.email}</p>}
                            {data.linkedin && <p className="flex items-center gap-2"><span>{data.is_use_photo ? '🔗' : ''}</span>{data.linkedin}</p>}
                        </div> :
                            <div className="mt-3 text-gray-700 text-center" style={{ fontFamily: 'Arial, sans-serif' }}>
                                <div className="flex flex-wrap justify-center gap-2 mb-2">
                                    {data.phone && <p className="whitespace-nowrap">
                                        <a 
                                            href={`https://wa.me/${formatPhoneForWhatsApp(data.phone)}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="hover:text-blue-600 hover:underline"
                                            style={{ fontFamily: 'Arial, sans-serif' }}
                                        >
                                            {data.phone}
                                        </a>
                                    </p>}
                                    {data.phone && data.email && <span className="whitespace-nowrap">|</span>}
                                    {data.email && <p className="whitespace-nowrap overflow-hidden text-ellipsis">{data.email}</p>}
                                    {(data.phone || data.email) && data.linkedin && <span className="whitespace-nowrap">|</span>}
                                    {data.linkedin && <p className="whitespace-nowrap overflow-hidden text-ellipsis">{data.linkedin}</p>}
                                </div>
                                {data.address && <p className="break-words">{data.address}</p>}
                            </div>}
                    </div>
                </div>
            </div>
        );

        // Perkiraan tinggi header (dioptimalkan)
        const headerHeight = data.is_use_photo && (data.photo || data.photoPreview) ? 120 : 100;
        let currentPageHeight = headerHeight;

        // Summary juga biasanya di halaman pertama
        if (data.summary) {
            currentPage.push(
                <div key="summary" className="cv-section mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200" style={{ fontFamily: 'Arial, sans-serif' }}>Summary</h2>
                    <p className="text-gray-700" style={{ fontFamily: 'Arial, sans-serif' }}>{data.summary}</p>
                </div>
            );
            
            // Tambahkan tinggi summary dan spacing setelah section
            currentPageHeight += SECTION_HEADING_HEIGHT + SECTION_SPACING_HEIGHT;
        }

        // Fungsi untuk menganalisis bullet points dari deskripsi
        const extractBulletPoints = (description: string): {intro?: string, bullets: string[]} => {
            if (!description) return { bullets: [] };
            
            const result: {intro?: string, bullets: string[]} = { bullets: [] };
            
            // Format dengan bullet point '• '
            if (description.includes('• ')) {
                const parts = description.split('• ');
                if (parts[0].trim()) {
                    result.intro = parts[0].trim();
                }
                
                for (let i = 1; i < parts.length; i++) {
                    if (parts[i].trim()) {
                        result.bullets.push(parts[i].trim());
                    }
                }
                
                return result;
            }
            
            // Format dengan newline dan '-', '*', '•'
            if (description.match(/[\n\r][-*•][\s]/) || description.includes('\n- ')) {
                const lines = description.split(/[\n\r]+/);
                let introLines: string[] = [];
                
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.startsWith('• ')) {
                        result.bullets.push(trimmedLine.substring(2));
                    } else if (trimmedLine) {
                        introLines.push(trimmedLine);
                    }
                }
                
                if (introLines.length > 0) {
                    result.intro = introLines.join('\n');
                }
                
                return result;
            }
            
            // Jika tidak ada format khusus, masukkan sebagai intro
            if (description.trim()) {
                result.intro = description.trim();
            }
            
            return result;
        };

        // Fungsi untuk menghitung tinggi teks berdasarkan jumlah baris
        const calculateTextHeight = (text: string, maxWidth: number = 400): number => {
            if (!text) return 0;
            
            // Estimasi karakter per baris (berdasarkan font size 11pt dan lebar maksimal)
            // Disesuaikan untuk font Arial 11pt dengan line-height 1.5
            const charsPerLine = Math.floor(maxWidth / 7.2); // 7.2px per karakter untuk font 11pt Arial
            
            // Hitung jumlah baris yang diperlukan
            const lines = Math.ceil(text.length / charsPerLine);
            
            // Jika teks pendek, minimal 1 baris
            return Math.max(1, lines) * LINE_HEIGHT;
        };

        // Perbaiki perhitungan tinggi summary jika ada
        if (data.summary) {
            const summaryTextHeight = calculateTextHeight(data.summary, 500);
            currentPageHeight += summaryTextHeight;
        }

        // Fungsi untuk menghitung tinggi item berdasarkan kontennya
        const calculateItemHeight = (item: any, bulletHeight: number = BULLET_POINT_HEIGHT): number => {
            const description = item.description || '';
            const { intro, bullets } = extractBulletPoints(description);
            
            let totalHeight = ITEM_HEADING_HEIGHT; // Tinggi header item
            
            // Tambahkan tinggi untuk intro jika ada
            if (intro) {
                totalHeight += calculateTextHeight(intro);
            }
            
            // Tambahkan tinggi untuk setiap bullet point
            bullets.forEach((bullet: string) => {
                totalHeight += calculateTextHeight(bullet);
            });
            
            // Tambahkan spacing
            totalHeight += SPACING_HEIGHT;
            
            return totalHeight;
        };

        // Fungsi untuk memproses section dengan paginasi per baris yang lebih presisi
        const processSectionWithPreciseLineBreak = (sectionTitle: string, items: any[], renderItem: (item: any, index: number) => React.ReactNode, bulletHeight: number = BULLET_POINT_HEIGHT, marginThreshold: number = 15) => {
            // Tambahkan spacing sebelum section baru
            currentPageHeight += SECTION_SPACING_HEIGHT;
            
            // Cek apakah heading section saja akan melebihi margin
            if (currentPageHeight + SECTION_HEADING_HEIGHT > PAGE_HEIGHT - marginThreshold) {
                pageContents.push(currentPage);
                currentPage = [];
                currentPageHeight = 0;
            }
            
            // Tambahkan heading section
            currentPage.push(
                <div key={`${sectionTitle}_title`} className="cv-section-heading mb-4 mt-3">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200" style={{ fontFamily: 'Arial, sans-serif' }}>{sectionTitle}</h2>
                </div>
            );
            currentPageHeight += SECTION_HEADING_HEIGHT;
            
            // Variabel untuk melacak apakah sudah ada section heading di halaman ini
            let hasHeadingInCurrentPage = true;
            
            items.forEach((item, index) => {
                // Hitung tinggi total item berdasarkan konten aktual
                const itemHeight = calculateItemHeight(item, bulletHeight);
                
                // Cek apakah item akan melebihi halaman
                if (currentPageHeight + itemHeight > PAGE_HEIGHT - marginThreshold) {
                    // Jika melebihi, pindah ke halaman baru
                    pageContents.push(currentPage);
                    currentPage = [];
                    currentPageHeight = 0;
                    hasHeadingInCurrentPage = false;
                    
                    // Tambahkan kembali section heading hanya jika belum ada di halaman baru
                    if (!hasHeadingInCurrentPage) {
                        currentPage.push(
                            <div key={`${sectionTitle}_title_continued_${index}`} className="cv-section-heading mb-4 mt-3">
                                <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200" style={{ fontFamily: 'Arial, sans-serif' }}>{sectionTitle}</h2>
                            </div>
                        );
                        currentPageHeight += SECTION_HEADING_HEIGHT;
                        hasHeadingInCurrentPage = true;
                    }
                }
                
                // Tambahkan header item
                currentPage.push(renderItem(item, index));
                currentPageHeight += ITEM_HEADING_HEIGHT;
                
                // Proses deskripsi per baris
                const description = item.description || '';
                const { intro, bullets } = extractBulletPoints(description);
                
                // Proses paragraf intro jika ada
                if (intro) {
                    const introHeight = calculateTextHeight(intro);
                    
                    // Cek apakah intro akan melebihi halaman
                    if (currentPageHeight + introHeight > PAGE_HEIGHT - marginThreshold) {
                        pageContents.push(currentPage);
                        currentPage = [];
                        currentPageHeight = 0;
                        
                        // Tambahkan section heading di halaman baru jika belum ada
                        if (!hasHeadingInCurrentPage) {
                            currentPage.push(
                                <div key={`${sectionTitle}_title_continued_intro_${index}`} className="cv-section-heading mb-4 mt-3">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200" style={{ fontFamily: 'Arial, sans-serif' }}>{sectionTitle}</h2>
                                </div>
                            );
                            currentPageHeight += SECTION_HEADING_HEIGHT;
                            hasHeadingInCurrentPage = true;
                        }
                    }
                    
                    // Tambahkan paragraf intro
                    currentPage.push(
                        <p key={`intro_${sectionTitle}_${index}`} className="text-gray-600 mt-1" style={{ fontFamily: 'Arial, sans-serif' }}>{intro}</p>
                    );
                    currentPageHeight += introHeight;
                }
                
                // Proses setiap bullet point satu per satu
                if (bullets.length > 0) {
                    bullets.forEach((bullet: string, bulletIndex: number) => {
                        const bulletHeight = calculateTextHeight(bullet);
                        
                        // Cek apakah bullet point akan melebihi halaman
                        if (currentPageHeight + bulletHeight > PAGE_HEIGHT - marginThreshold) {
                            pageContents.push(currentPage);
                            currentPage = [];
                            currentPageHeight = 0;
                            
                            // Tambahkan section heading di halaman baru jika belum ada
                            if (!hasHeadingInCurrentPage) {
                                currentPage.push(
                                    <div key={`${sectionTitle}_title_continued_bullet_${index}_${bulletIndex}`} className="cv-section-heading mb-4 mt-3">
                                        <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200" style={{ fontFamily: 'Arial, sans-serif' }}>{sectionTitle}</h2>
                                    </div>
                                );
                                currentPageHeight += SECTION_HEADING_HEIGHT;
                                hasHeadingInCurrentPage = true;
                            }
                        }
                        
                        // Tambahkan bullet point
                        currentPage.push(
                            <div key={`bullet_${sectionTitle}_${index}_${bulletIndex}`} style={{
                                display: 'flex',
                                marginBottom: '0.25rem',
                                fontFamily: 'Arial, sans-serif'
                            }} className="text-gray-600">
                                <div style={{ width: '1em', flexShrink: 0 }}>•</div>
                                <div>{bullet}</div>
                            </div>
                        );
                        currentPageHeight += bulletHeight;
                    });
                }
                
                // Tambahkan spacing setelah item
                currentPageHeight += SPACING_HEIGHT;
            });
        };

        // Proses Work Experience dengan pagination per baris
        if (data.work_experience && data.work_experience.length > 0 && data.work_experience[0].company) {
            processSectionWithPreciseLineBreak(
                "Work Experience",
                data.work_experience.filter((work: WorkExperience) => work.company),
                (work: WorkExperience, index: number) => (
                    <div key={`work_header_${index}`} className="mb-2">
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Arial, sans-serif' }}>{work.position}</h3>
                            <span className="text-sm text-gray-600 font-semibold" style={{ fontFamily: 'Arial, sans-serif' }}>
                                {formatDate(work.start_date)} - {work.is_current ? 'Present' : formatDate(work.end_date)} {calculateDuration(work.start_date, work.end_date, work.is_current)}
                            </span>
                        </div>
                        <h4 className="text-md text-gray-700 font-semibold" style={{ fontFamily: 'Arial, sans-serif' }}>{work.company}, {work.company_location} ({work.location_type})</h4>
                    </div>
                ),
                WORK_BULLET_POINT_HEIGHT, // Gunakan tinggi bullet point khusus untuk work experience
                80 // Gunakan margin threshold yang lebih besar untuk work experience agar lebih efisien
            );
            
            // Tambahkan spacing setelah section
            currentPageHeight += SECTION_SPACING_HEIGHT;
        }

        // Proses Education dengan pagination per baris
        if (data.education && data.education.length > 0 && data.education[0].institution) {
            processSectionWithPreciseLineBreak(
                "Education",
                data.education.filter((edu: Education) => edu.institution),
                (edu: Education, index: number) => (
                    <div key={`edu_header_${index}`} className="mb-2">
                        <div className="flex justify-between items-start">
                            <h3 className="text-md font-semibold text-gray-800" style={{ fontFamily: 'Arial, sans-serif' }}>{edu.degree} {edu.degree ? ',' : ''} {edu.field}</h3>
                            <span className="text-sm text-gray-600 font-semibold" style={{ fontFamily: 'Arial, sans-serif' }}>
                                {formatDate(edu.start_date)} - {formatDate(edu.end_date)}
                            </span>
                        </div>
                        <h4 className="text-md text-gray-700 font-semibold" style={{ fontFamily: 'Arial, sans-serif' }}>{edu.institution}</h4>
                    </div>
                ),
                BULLET_POINT_HEIGHT, // Gunakan tinggi bullet point standard
                60 // Gunakan margin threshold yang lebih efisien untuk education
            );
            
            // Tambahkan spacing setelah section
            currentPageHeight += SECTION_SPACING_HEIGHT;
        }

        // Proses Skills section
        if (data.skills && data.skills.length > 0 && data.skills[0].name) {
            // Tambahkan spacing sebelum section baru
            currentPageHeight += SECTION_SPACING_HEIGHT;
            
            // Hitung perkiraan tinggi minimal untuk skills section
            const estimatedSkillsPerColumn = 3;
            const estimatedTotalColumns = Math.ceil(data.skills.length / estimatedSkillsPerColumn);
            const estimatedMaxSkillsInColumn = Math.max(...Array.from({length: estimatedTotalColumns}, (_, i) => {
                const startIndex = i * estimatedSkillsPerColumn;
                const endIndex = startIndex + estimatedSkillsPerColumn;
                return Math.min(estimatedSkillsPerColumn, data.skills.length - startIndex);
            }));
            const minSkillsHeight = SECTION_HEADING_HEIGHT + (estimatedMaxSkillsInColumn * 25);
            
            // Cek jika skills section tidak akan muat di halaman ini
            if (currentPageHeight + minSkillsHeight > PAGE_HEIGHT - 40) {
                pageContents.push(currentPage);
                currentPage = [];
                currentPageHeight = 0;
            }
            
            // Tambahkan heading skills
            currentPage.push(
                <div key="skills_title" className="cv-section mb-4 mt-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200" style={{ fontFamily: 'Arial, sans-serif' }}>Skills</h2>
                </div>
            );
            currentPageHeight += SECTION_HEADING_HEIGHT;
            
            // Organisir skills dalam kolom (3 item per kolom)
            const skillsPerColumn = 3;
            const totalColumns = Math.ceil(data.skills.length / skillsPerColumn);
            const skillColumns: Skill[][] = [];
            
            // Bagi skills ke dalam kolom-kolom
            for (let i = 0; i < totalColumns; i++) {
                const startIndex = i * skillsPerColumn;
                const endIndex = startIndex + skillsPerColumn;
                skillColumns.push(data.skills.slice(startIndex, endIndex));
            }
            
            // Tambahkan container untuk skills dengan layout kolom yang konsisten untuk PDF dan preview
            currentPage.push(
                <div key="skills_container" className="skills-container" style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '2rem',
                    justifyContent: 'flex-start' 
                }}>
                    {skillColumns.map((column, columnIndex) => (
                        <div key={`skills_column_${columnIndex}`} className="skills-column" style={{
                            flex: '1 1 auto',
                            minWidth: '120px',
                            maxWidth: '200px',
                            fontFamily: 'Arial, sans-serif'
                        }}>
                            {column.map((skill, skillIndex) => (
                                <div key={`skill_${columnIndex}_${skillIndex}`} className="mb-1">
                                    <span className="text-gray-700" style={{ fontFamily: 'Arial, sans-serif' }}>• {skill.name}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            );
            
            // Hitung tinggi total skills section
            const maxSkillsInColumn = Math.max(...skillColumns.map(col => col.length));
            const totalSkillsHeight = maxSkillsInColumn * 25; // 25px per skill item
            currentPageHeight += totalSkillsHeight;
        }

        // Proses Portfolios dengan pagination per baris
        if (data.portfolios && data.portfolios.length > 0 && data.portfolios[0].title) {
            processSectionWithPreciseLineBreak(
                "Portfolios",
                data.portfolios.filter((portfolio: Portfolio) => portfolio.title),
                (portfolio: Portfolio, index: number) => (
                    <div key={`portfolio_header_${index}`} className="mb-2">
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Arial, sans-serif' }}>
                                {portfolio.title} (
                                <a
                                    href={portfolio.link.startsWith('http') ? portfolio.link : `https://${portfolio.link}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 hover:underline"
                                    style={{ fontFamily: 'Arial, sans-serif' }}
                                >
                                    {portfolio.link}
                                </a>
                                )
                            </h3>
                        </div>
                    </div>
                ),
                BULLET_POINT_HEIGHT, // Gunakan tinggi bullet point standard
                60 // Gunakan margin threshold yang lebih efisien untuk portfolios
            );
            
            // Tambahkan spacing setelah section
            currentPageHeight += SECTION_SPACING_HEIGHT;
        }

        // Proses Accomplishments dengan pagination per baris
        if (data.accomplishments && data.accomplishments.length > 0 && data.accomplishments[0].description) {
            processSectionWithPreciseLineBreak(
                "Accomplishments",
                data.accomplishments.filter((acc: Accomplishment) => acc.description),
                (accomplishment: Accomplishment, index: number) => (
                    <div key={`accomplishment_header_${index}`} className="mb-2">
                        {/* Accomplishment entries don't have their own headers, so we return an empty div */}
                    </div>
                ),
                BULLET_POINT_HEIGHT, // Gunakan tinggi bullet point standard
                60 // Gunakan margin threshold yang lebih efisien untuk accomplishments
            );
            
            // Tambahkan spacing setelah section
            currentPageHeight += SECTION_SPACING_HEIGHT;
        }

        // Proses Organizations dengan pagination per baris
        if (data.organizations && data.organizations.length > 0 && data.organizations[0].name) {
            processSectionWithPreciseLineBreak(
                "Organization",
                data.organizations.filter((org: Organization) => org.name),
                (org: Organization, index: number) => (
                    <div key={`org_header_${index}`} className="mb-2">
                        <div className="flex justify-between items-start">
                            <h3 className="text-md font-semibold text-gray-800" style={{ fontFamily: 'Arial, sans-serif' }}>{org.position}, {org.name}</h3>
                            <span className="text-sm text-gray-600 font-semibold" style={{ fontFamily: 'Arial, sans-serif' }}>
                                {formatDate(org.start_date)} - {formatDate(org.end_date)}
                            </span>
                        </div>
                    </div>
                ),
                BULLET_POINT_HEIGHT, // Gunakan tinggi bullet point standard
                60 // Gunakan margin threshold yang lebih efisien untuk organizations
            );
            
            // Tambahkan spacing setelah section
            currentPageHeight += SECTION_SPACING_HEIGHT;
        }

        // Proses Languages dengan pagination per baris
        if (data.languages && data.languages.length > 0 && data.languages[0].language) {
            // Hitung total tinggi untuk languages section
            const totalLanguagesHeight = SECTION_HEADING_HEIGHT + (data.languages.length * 30);
            
            // Cek apakah seluruh languages section muat di halaman ini
            // Jika tidak cukup ruang dan halaman sudah berisi konten signifikan, pindah ke halaman baru
            if ((currentPageHeight + totalLanguagesHeight > PAGE_HEIGHT - 40) && currentPageHeight > PAGE_HEIGHT * 0.6) {
                pageContents.push(currentPage);
                currentPage = [];
                currentPageHeight = 0;
            }
            
            // Tambahkan spacing sebelum section baru
            currentPageHeight += SECTION_SPACING_HEIGHT;
            
            // Tambahkan heading languages
            currentPage.push(
                <div key="languages_title" className="cv-section mb-4 mt-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200" style={{ fontFamily: 'Arial, sans-serif' }}>Languages</h2>
                </div>
            );
            currentPageHeight += SECTION_HEADING_HEIGHT;
            
            // Tambahkan container untuk languages
            currentPage.push(
                <ul key="languages_list" className="list-disc pl-5">
                </ul>
            );
            
            // Proses setiap language
            data.languages.forEach((lang, index) => {
                let levelText = "";
                switch (lang.level) {
                    case "Native":
                        levelText = "Native or bilingual proficiency";
                        break;
                    case "Fluent":
                        levelText = "Full professional proficiency";
                        break;
                    case "Advanced":
                        levelText = "Professional working proficiency";
                        break;
                    case "Intermediate":
                        levelText = "Limited working proficiency";
                        break;
                    case "Basic":
                        levelText = "Elementary proficiency";
                        break;
                    default:
                        levelText = lang.level;
                }
                
                const langItemHeight = 30; // Tinggi item bahasa
                
                // Cek jika language item tidak akan muat di halaman ini
                if (currentPageHeight + langItemHeight + 40 > PAGE_HEIGHT) {
                    pageContents.push(currentPage);
                    currentPage = [];
                    currentPageHeight = 0;
                }
                
                // Tambahkan language item
                currentPage.push(
                    <li key={`lang_${index}`} className="mb-1" style={{ fontFamily: 'Arial, sans-serif' }}>
                        <span className="text-gray-700 font-medium" style={{ fontFamily: 'Arial, sans-serif' }}>{lang.language}</span>
                        <span className="ml-2 text-gray-600" style={{ fontFamily: 'Arial, sans-serif' }}>({levelText})</span>
                    </li>
                );
                currentPageHeight += langItemHeight;
            });
            
            // Tambahkan spacing setelah section
            currentPageHeight += SECTION_SPACING_HEIGHT;
        }

        // Proses Additional Info dengan pagination per baris
        if (data.additional_info) {
            // Parse additional info untuk bullet points dan hitung tinggi
            const { intro, bullets } = extractBulletPoints(data.additional_info);
            
            // Tambahkan spacing sebelum section baru
            currentPageHeight += SECTION_SPACING_HEIGHT;
            
            // Hitung perkiraan tinggi minimal untuk additional info section
            const minAdditionalInfoHeight = SECTION_HEADING_HEIGHT + 
                (intro ? PARAGRAPH_HEIGHT : 0) + 
                (bullets.length * BULLET_POINT_HEIGHT);
            
            // Cek jika additional info section tidak akan muat di halaman ini
            if (currentPageHeight + minAdditionalInfoHeight > PAGE_HEIGHT - 40) {
                pageContents.push(currentPage);
                currentPage = [];
                currentPageHeight = 0;
            }
            
            // Tambahkan heading
            currentPage.push(
                <div key="additional_info_title" className="cv-section mb-4 mt-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200" style={{ fontFamily: 'Arial, sans-serif' }}>Additional Info</h2>
                </div>
            );
            currentPageHeight += SECTION_HEADING_HEIGHT;
            
            // Proses paragraf intro jika ada
            if (intro) {
                // Tambahkan paragraf intro
                currentPage.push(
                    <p key="additional_info_intro" className="text-gray-600 mt-1">{intro}</p>
                );
                currentPageHeight += PARAGRAPH_HEIGHT;
            }
            
            // Proses setiap bullet point satu per satu
            bullets.forEach((bullet, bulletIndex) => {
                // Tambahkan bullet point
                currentPage.push(
                    <div key={`bullet_additional_info_${bulletIndex}`} style={{
                        display: 'flex',
                        marginBottom: '0.25rem'
                    }} className="text-gray-600">
                        <div style={{ width: '1em', flexShrink: 0 }}>•</div>
                        <div>{bullet}</div>
                    </div>
                );
                currentPageHeight += BULLET_POINT_HEIGHT;
            });
        }
        
        // Tambahkan halaman terakhir jika masih ada konten
        if (currentPage.length > 0) {
            pageContents.push(currentPage);
        }
        
        // Jika tidak ada halaman yang dibuat, buat halaman dengan header saja
        if (pageContents.length === 0) {
            pageContents.push(currentPage);
        }
        
        setPages(pageContents);
    }, [data]);

    // Fungsi helper untuk memastikan semua deskripsi di-render dengan benar (untuk kompatibilitas)
    const renderDescription = (description: string, itemIndex: number): React.ReactNode[] => {
        if (!description) return [];
        
        // Jika deskripsi sudah berformat dengan bullet points
        if (description.includes('• ')) {
            const parts = description.split('• ');
            const result: React.ReactNode[] = [];
            
            // Paragraph awal (jika ada)
            if (parts[0].trim()) {
                result.push(<p key={`intro-${itemIndex}`}>{parts[0].trim()}</p>);
            }
            
            // Bullet points
            for (let i = 1; i < parts.length; i++) {
                if (parts[i].trim()) {
                    result.push(
                        <div key={`bullet-${itemIndex}-${i}`} style={{
                            display: 'flex',
                            marginBottom: '0.25rem'
                        }}>
                            <div style={{ width: '1em', flexShrink: 0 }}>•</div>
                            <div>{parts[i].trim()}</div>
                        </div>
                    );
                }
            }
            
            return result;
        }
        
        // Alternatif: coba deteksi format bullet dengan regex jika format '• ' tidak ditemukan
        if (description.match(/[\n\r][-*•][\s]/) || description.includes('\n- ')) {
            // Split by newlines and process each line
            const lines = description.split(/[\n\r]+/);
            return lines.map((line, i) => {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.startsWith('• ')) {
                    return (
                        <div key={`bullet-${itemIndex}-${i}`} style={{
                            display: 'flex',
                            marginBottom: '0.25rem'
                        }}>
                            <div style={{ width: '1em', flexShrink: 0 }}>•</div>
                            <div>{trimmedLine.substring(2)}</div>
                        </div>
                    );
                }
                return <p key={`text-${itemIndex}-${i}`}>{trimmedLine}</p>;
            });
        }
        
        // Jika tidak ada format khusus, tampilkan sebagai paragraf biasa
        return [<p key={`plain-${itemIndex}`}>{description}</p>];
    };

    if (!data || Object.keys(data).length === 0) {
        return (
            <div className="cv-preview-empty flex items-center justify-center h-full">
                <p className="text-gray-500">Preview CV will appear here</p>
            </div>
        );
    }

    return (
        <div className={`cv-container mx-auto relative flex flex-col items-center justify-center ${!isPdfMode ? 'bg-gray-100' : ''}`} style={{ maxWidth: '100%' }}>
            <style dangerouslySetInnerHTML={{ __html: pageBreakStyle }} />
            
            {!isPdfMode && showZoomControls && (
                <div className="zoom-controls absolute right-3 top-3 flex items-center gap-2 bg-white p-2 rounded-lg shadow-md z-10">
                    <span className="text-sm font-medium">25%</span>
                    <input
                        type="range"
                        min="25"
                        max="200"
                        step="5"
                        value={zoomLevel}
                        onChange={handleZoomChange}
                        className="w-32 accent-blue-600"
                        title="Zoom"
                    />
                    <span className="text-sm font-medium">200%</span>
                    <span className="ml-2 px-2 py-1 bg-gray-100 rounded-md text-sm font-bold">{zoomLevel}%</span>
                    <button
                        onClick={toggleZoomControls}
                        className="ml-1 w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full"
                        title="Hide Zoom Control"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                    </button>
                </div>
            )}
            
            {!isPdfMode && !showZoomControls && (
                <button
                    onClick={toggleZoomControls}
                    className="absolute right-3 top-3 w-9 h-9 flex items-center justify-center bg-white hover:bg-gray-100 rounded-full shadow-md z-10"
                    title="Show Zoom Control"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </button>
            )}

            <div className="cv-multi-page-container" 
                 style={{
                     transform: !isPdfMode ? `scale(${(zoomLevel / 100) * 0.65})` : 'none',
                     transformOrigin: 'top center',
                     transition: 'transform 0.2s ease',
                 }}
                 ref={cvContentRef}>
                {pages.map((pageContent, index) => (
                    <div key={`page-${index}`} className="relative mb-6">
                        {createPage(pageContent, index, pages.length)}
                        {index < pages.length - 1 && <div className="html2pdf__page-break"></div>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CV;
