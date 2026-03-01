import React, { useState, useEffect, useRef, ReactElement, useMemo } from 'react';
import ReactDOM from 'react-dom';

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
    
    .zoom-controls {
        display: none !important;
    }
}

.pdf-export-mode {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
    background-color: white !important;
    height: auto !important;
    width: 21cm !important;
    padding: 1cm !important;
    border: none !important;
    box-shadow: none !important;
    margin: 0 !important;
    overflow: hidden !important;
    font-family: Arial, sans-serif !important;
    color: #000 !important;
}

.cv-for-pdf-mode {
    background-color: white;
    font-family: Arial, sans-serif !important;
    color: #000 !important;
}

.cv-for-pdf-mode .cv-page {
    box-shadow: none !important;
    border: none !important;
}

.cv-for-pdf-mode h1 {
    font-size: 12pt !important;
    margin-bottom: 6pt !important;
    margin-top: 0 !important;
    text-align: inherit !important;
    font-family: Arial, sans-serif !important;
    color: #000 !important;
}

.cv-for-pdf-mode h2 {
    font-size: 11pt !important;
    margin-bottom: 4pt !important;
    font-family: Arial, sans-serif !important;
    color: #000 !important;
}

.cv-for-pdf-mode p,
.cv-for-pdf-mode div {
    font-size: 10pt !important;
    line-height: 1.5 !important;
    font-family: Arial, sans-serif !important;
    color: #000 !important;
}

.cv-for-pdf-mode .cv-header {
    padding-bottom: 1rem !important;
}

.pdf-export-mode * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-family: Arial, sans-serif !important;
    color: #000 !important;
}

.cv-for-pdf-mode .zoom-controls {
    display: none !important;
}

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

.cv-page {
    font-family: Arial, sans-serif !important;
    color: #000 !important;
    font-size: 10pt !important;
}

.cv-page * {
    font-family: Arial, sans-serif !important;
    color: #000 !important;
}

.cv-page h1 { font-size: 12pt !important; }
.cv-page h2 { font-size: 12pt !important; }
.cv-page h3, .cv-page h4 { font-size: 11pt !important; }
.cv-page p, .cv-page span, .cv-page div, .cv-page li { font-size: 10pt !important; }
.cv-page .cv-body-text,
.cv-page p, .cv-page div.cv-body-text { text-align: justify !important; }
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
    let cleanNumber = phone.replace(/\D/g, '');
    if (cleanNumber.startsWith('62')) {
        return cleanNumber;
    }
    if (cleanNumber.startsWith('0')) {
        return '62' + cleanNumber.substring(1);
    }
    return '62' + cleanNumber;
};

const calculateDuration = (startDate: string, endDate: string, isCurrent: boolean = false) => {
    try {
        const start = new Date(startDate);
        const end = isCurrent ? new Date() : new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return '';
        }

        let months = (end.getFullYear() - start.getFullYear()) * 12;
        months += end.getMonth() - start.getMonth();

        if (end.getDate() < start.getDate()) {
            months--;
        }

        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;

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
    const PAGE_HEIGHT = 890;

    useEffect(() => {
        const styleElement = document.createElement('style');
        styleElement.innerHTML = pageBreakStyle;
        document.head.appendChild(styleElement);

        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

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

    const SECTION_HEADING_HEIGHT = 40;
    const ITEM_HEADING_HEIGHT = 45;
    const BULLET_POINT_HEIGHT = 20;
    const WORK_BULLET_POINT_HEIGHT = 25;
    const PARAGRAPH_HEIGHT = 30;
    const SPACING_HEIGHT = 10;
    const SECTION_SPACING_HEIGHT = 15;
    const LINE_HEIGHT = 16;
    const BORDER_LINE_HEIGHT = 8;
    const RESERVED_BOTTOM_HEIGHT = 60;

    const SECTION_TITLE_LINES = Math.ceil(SECTION_HEADING_HEIGHT / LINE_HEIGHT);

    const createPage = (content: React.ReactNode, pageIndex?: number, totalPages?: number) => (
        <div 
            className="cv-page bg-white shadow-lg rounded-lg mb-8"
            style={{
                width: '21cm',
                height: '29.7cm',
                padding: '1cm',
                boxSizing: 'border-box',
                fontSize: '10pt',
                lineHeight: '1.5',
                backgroundColor: 'white',
                color: '#000',
                boxShadow: '0 0 10px rgba(83, 81, 81, 0.2)',
                margin: '0 auto',
                marginTop: '40px',
                position: 'relative',
                overflowY: 'hidden',
                fontFamily: 'Arial, sans-serif'
            }}
        >
            <div style={{ minHeight: 'calc(100% - 60px)', paddingBottom: '20px', position: 'relative', zIndex: 1 }}>
                {content}
            </div>
            {typeof pageIndex === 'number' && typeof totalPages === 'number' && (
                <div 
                    className="page-number-indicator"
                    style={{
                        position: 'absolute',
                        bottom: '1cm',
                        left: '1cm',
                        right: '1cm',
                        textAlign: 'center',
                        fontSize: '10pt',
                        color: '#000',
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

    useEffect(() => {
        if (!data || Object.keys(data).length === 0) return;

        let pageContents: React.ReactNode[][] = [];
        let currentPage: React.ReactNode[] = [];

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
                        <h1 className={`font-bold text-gray-900 ${!data.is_use_photo ? 'text-center' : ''}`} style={{ fontFamily: 'Arial, sans-serif', fontSize: '12pt' }}>{data.name}</h1>

                        {data.is_use_photo ? <div className="mt-3 text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-1" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
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
                            <div className="mt-3 text-gray-700 text-center" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                <div className="flex flex-wrap justify-center gap-2">
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
                                    {(data.phone || data.email || data.linkedin) && data.address && <span className="whitespace-nowrap">|</span>}
                                    {data.address && <p className="break-words max-w-full">{data.address}</p>}
                                </div>
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
                    <h2 className="font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12pt' }}>Summary</h2>
                    <p className="text-gray-700 cv-body-text" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', textAlign: 'justify' }}>{data.summary}</p>
                </div>
            );
            
            // Tambahkan tinggi summary dan spacing setelah section
            currentPageHeight += SECTION_HEADING_HEIGHT + SECTION_SPACING_HEIGHT;
        }

        // Fungsi untuk menganalisis bullet points dari deskripsi
        const extractBulletPoints = (description: string): {intro?: string, bullets: string[]} => {
            if (!description) return { bullets: [] };
            
            const result: {intro?: string, bullets: string[]} = { bullets: [] };
            
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
            
            if (description.trim()) {
                result.intro = description.trim();
            }
            
            return result;
        };

        const calculateTextHeight = (text: string, maxWidth: number = 400): number => {
            if (!text) return 0;
            const charsPerLine = Math.floor(maxWidth / 7.2);
            const lines = Math.ceil(text.length / charsPerLine);
            return Math.max(1, lines) * LINE_HEIGHT;
        };

        if (data.summary) {
            const summaryTextHeight = calculateTextHeight(data.summary, 500);
            currentPageHeight += summaryTextHeight;
        }

        const calculateItemHeight = (item: any, bulletHeight: number = BULLET_POINT_HEIGHT): number => {
            const description = item.description || '';
            const { intro, bullets } = extractBulletPoints(description);
            let totalHeight = ITEM_HEADING_HEIGHT;

            if (intro) {
                totalHeight += calculateTextHeight(intro);
            }

            bullets.forEach((bullet: string) => {
                totalHeight += calculateTextHeight(bullet);
            });
            totalHeight += SPACING_HEIGHT;
            return totalHeight;
        };

        const processSectionWithPreciseLineBreak = (
            sectionTitle: string,
            items: any[],
            renderItem: (item: any, index: number) => React.ReactNode,
            bulletHeight: number = BULLET_POINT_HEIGHT,
            marginThreshold: number = 15,
            itemHeaderLines: number = 2
        ) => {
            currentPageHeight += SECTION_SPACING_HEIGHT;

            const sectionTitleHeightPx = SECTION_TITLE_LINES * LINE_HEIGHT;
            if (currentPageHeight + sectionTitleHeightPx > PAGE_HEIGHT - marginThreshold) {
                pageContents.push(currentPage);
                currentPage = [];
                currentPageHeight = 0;
            }

            currentPage.push(
                <div key={`${sectionTitle}_title`} className="cv-section-heading mb-4 mt-3">
                    <h2 className="font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12pt' }}>{sectionTitle}</h2>
                </div>
            );
            currentPageHeight += sectionTitleHeightPx;

            const itemHeaderHeight = itemHeaderLines * LINE_HEIGHT;

            items.forEach((item, index) => {
                const isFirstItem = index === 0;
                if (!isFirstItem && currentPageHeight + itemHeaderHeight > PAGE_HEIGHT - marginThreshold) {
                    pageContents.push(currentPage);
                    currentPage = [];
                    currentPageHeight = 0;
                }

                currentPage.push(renderItem(item, index));
                currentPageHeight += itemHeaderHeight;

                const description = item.description || '';
                const { intro, bullets } = extractBulletPoints(description);
                if (intro) {
                    const introHeight = calculateTextHeight(intro);
                    if (!isFirstItem && currentPageHeight + introHeight > PAGE_HEIGHT - marginThreshold) {
                        pageContents.push(currentPage);
                        currentPage = [];
                        currentPageHeight = 0;
                    }
                    currentPage.push(
                        <p key={`intro_${sectionTitle}_${index}`} className="text-gray-600 mt-1 cv-body-text" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', textAlign: 'justify' }}>{intro}</p>
                    );
                    currentPageHeight += introHeight;
                }
                if (bullets.length > 0) {
                    bullets.forEach((bullet: string, bulletIndex: number) => {
                        const bHeight = calculateTextHeight(bullet);
                        if (!isFirstItem && currentPageHeight + bHeight > PAGE_HEIGHT - marginThreshold) {
                            pageContents.push(currentPage);
                            currentPage = [];
                            currentPageHeight = 0;
                        }
                        currentPage.push(
                            <div key={`bullet_${sectionTitle}_${index}_${bulletIndex}`} style={{
                                display: 'flex',
                                marginBottom: '0.25rem',
                                fontFamily: 'Arial, sans-serif',
                                fontSize: '10pt',
                                textAlign: 'justify'
                            }} className="text-gray-600 cv-body-text">
                                <div style={{ width: '1em', flexShrink: 0 }}>•</div>
                                <div>{bullet}</div>
                            </div>
                        );
                        currentPageHeight += bHeight;
                    });
                }

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
                            <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>{work.position}</h3>
                            <span className="text-gray-600 font-semibold" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                {formatDate(work.start_date)} - {work.is_current ? 'Present' : formatDate(work.end_date)} {calculateDuration(work.start_date, work.end_date, work.is_current)}
                            </span>
                        </div>
                        <h4 className="text-gray-700 font-semibold" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>{work.company}, {work.company_location} ({work.location_type})</h4>
                    </div>
                ),
                WORK_BULLET_POINT_HEIGHT,
                80,
                3
            );
        }

        if (data.education && data.education.length > 0 && data.education[0].institution) {
            processSectionWithPreciseLineBreak(
                "Education",
                data.education.filter((edu: Education) => edu.institution),
                (edu: Education, index: number) => (
                    <div key={`edu_header_${index}`} className="mb-2">
                        <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>{edu.degree} {edu.degree ? ',' : ''} {edu.field}</h3>
                            <span className="text-gray-600 font-semibold" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                {formatDate(edu.start_date)} - {formatDate(edu.end_date)}
                            </span>
                        </div>
                        <h4 className="text-gray-700 font-semibold" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>{edu.institution}</h4>
                    </div>
                ),
                BULLET_POINT_HEIGHT,
                0,
                2
            );
        }

        // Proses Skills section
        if (data.skills && data.skills.length > 0 && data.skills[0].name) {
            currentPageHeight += SECTION_SPACING_HEIGHT;

            const skillsSectionTitleHeight = SECTION_TITLE_LINES * LINE_HEIGHT;
            // Tambahkan heading skills
            currentPage.push(
                <div key="skills_title" className="cv-section mb-4 mt-6">
                    <h2 className="font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12pt' }}>Skills</h2>
                </div>
            );
            currentPageHeight += skillsSectionTitleHeight;

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
                                    <span className="text-gray-700" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt' }}>• {skill.name}</span>
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
                            <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                {portfolio.title} (
                                <a
                                    href={portfolio.link.startsWith('http') ? portfolio.link : `https://${portfolio.link}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 hover:underline"
                                    style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}
                                >
                                    {portfolio.link}
                                </a>
                                )
                            </h3>
                        </div>
                    </div>
                ),
                BULLET_POINT_HEIGHT,
                -100,
                2
            );
        }

        if (data.accomplishments && data.accomplishments.length > 0 && data.accomplishments[0].description) {
            processSectionWithPreciseLineBreak(
                "Accomplishments",
                data.accomplishments.filter((acc: Accomplishment) => acc.description),
                (accomplishment: Accomplishment, index: number) => (
                    <div key={`accomplishment_header_${index}`} className="mb-2" />
                ),
                BULLET_POINT_HEIGHT,
                -100,
                0
            );
        }

        if (data.organizations && data.organizations.length > 0 && data.organizations[0].name) {
            processSectionWithPreciseLineBreak(
                "Organization",
                data.organizations.filter((org: Organization) => org.name),
                (org: Organization, index: number) => (
                    <div key={`org_header_${index}`} className="mb-2">
                        <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>{org.position}, {org.name}</h3>
                            <span className="text-gray-600 font-semibold" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                {formatDate(org.start_date)} - {formatDate(org.end_date)}
                            </span>
                        </div>
                    </div>
                ),
                BULLET_POINT_HEIGHT,
                -100,
                2
            );
        }

        // Proses Languages dengan pagination per baris
        if (data.languages && data.languages.length > 0 && data.languages[0].language) {
            currentPageHeight += SECTION_SPACING_HEIGHT;

            const languagesSectionTitleHeight = SECTION_TITLE_LINES * LINE_HEIGHT;
            const languagesLimit = PAGE_HEIGHT - RESERVED_BOTTOM_HEIGHT;
            if (currentPageHeight + languagesSectionTitleHeight > languagesLimit) {
                pageContents.push(currentPage);
                currentPage = [];
                currentPageHeight = 0;
            }

            // Tambahkan heading languages
            currentPage.push(
                <div key="languages_title" className="cv-section mb-4 mt-6">
                    <h2 className="font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12pt' }}>Languages</h2>
                </div>
            );
            currentPageHeight += languagesSectionTitleHeight;

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
                
                const langItemHeight = 30;

                if (currentPageHeight + langItemHeight > languagesLimit) {
                    pageContents.push(currentPage);
                    currentPage = [];
                    currentPageHeight = 0;
                }
                
                // Tambahkan language item
                currentPage.push(
                    <li key={`lang_${index}`} className="mb-1" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt' }}>
                        <span className="text-gray-700 font-medium">{lang.language}</span>
                        <span className="ml-2 text-gray-600">({levelText})</span>
                    </li>
                );
                currentPageHeight += langItemHeight;
            });
        }

        // Proses Additional Info dengan pagination per baris
        if (data.additional_info) {
            const { intro, bullets } = extractBulletPoints(data.additional_info);

            currentPageHeight += SECTION_SPACING_HEIGHT;

            const additionalInfoSectionTitleHeight = SECTION_TITLE_LINES * LINE_HEIGHT;
            const contentLimit = PAGE_HEIGHT - RESERVED_BOTTOM_HEIGHT;
            if (currentPageHeight + additionalInfoSectionTitleHeight > contentLimit) {
                pageContents.push(currentPage);
                currentPage = [];
                currentPageHeight = 0;
            }

            currentPage.push(
                <div key="additional_info_title" className="cv-section mb-4 mt-6">
                    <h2 className="font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12pt' }}>Additional Info</h2>
                </div>
            );
            currentPageHeight += additionalInfoSectionTitleHeight;

            if (intro) {
                currentPage.push(
                    <p key="additional_info_intro" className="text-gray-600 mt-1 cv-body-text" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', textAlign: 'justify' }}>{intro}</p>
                );
                currentPageHeight += PARAGRAPH_HEIGHT;
            }
            bullets.forEach((bullet, bulletIndex) => {
                currentPage.push(
                    <div key={`bullet_additional_info_${bulletIndex}`} style={{
                        display: 'flex',
                        marginBottom: '0.25rem',
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '10pt',
                        textAlign: 'justify'
                    }} className="text-gray-600 cv-body-text">
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
