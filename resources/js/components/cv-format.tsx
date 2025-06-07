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
    
    /* Sembunyikan kontrol zoom dan indikator halaman saat print */
    .zoom-controls, 
    .page-number-indicator {
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
    padding: 2cm !important;
    border: none !important;
    box-shadow: none !important;
    margin: 0 !important;
    overflow: hidden !important;
}

/* Style untuk mode PDF */
.cv-for-pdf-mode {
    background-color: white;
    font-family: Arial, sans-serif;
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
}

.cv-for-pdf-mode h2 {
    font-size: 16pt !important;
    margin-bottom: 6pt !important;
}

.cv-for-pdf-mode p, 
.cv-for-pdf-mode div {
    font-size: 11pt !important;
    line-height: 1.5 !important;
}

.cv-for-pdf-mode .cv-header {
    padding-bottom: 1rem !important;
}

.pdf-export-mode * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* Sembunyikan kontrol zoom dan indikator halaman dalam mode PDF */
.cv-for-pdf-mode .zoom-controls,
.cv-for-pdf-mode .page-number-indicator {
    display: none !important;
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
    const PAGE_HEIGHT = 950; // Tinggi halaman dalam piksel (area konten)

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

    // Fungsi untuk membagi konten ke beberapa halaman
    useEffect(() => {
        if (!data || Object.keys(data).length === 0) return;

        // Buat array untuk menampung konten tiap halaman
        let pageContents: React.ReactNode[] = [];
        
        // Konstanta tinggi elemen
        const SECTION_HEADING_HEIGHT = 60;   // Tinggi heading section
        const ITEM_HEADING_HEIGHT = 70;      // Tinggi heading item (misal: nama perusahaan, posisi)
        const BULLET_POINT_HEIGHT = 30;      // Tinggi per bullet point
        const PARAGRAPH_HEIGHT = 50;         // Tinggi paragraf normal
        const SPACING_HEIGHT = 20;           // Tinggi spacing antar item
        const SECTION_SPACING_HEIGHT = 30;   // Tinggi spacing antar section
        
        // Fungsi untuk membuat halaman CV
        const createPage = (content: React.ReactNode) => (
            <div 
                className="cv-page bg-white shadow-lg rounded-lg mb-8"
                style={{
                    width: '21cm',
                    height: '29.7cm',
                    padding: '2cm',
                    boxSizing: 'border-box',
                    fontSize: '11pt',
                    lineHeight: '1.5',
                    backgroundColor: 'white',
                    boxShadow: '0 0 10px rgba(83, 81, 81, 0.2)',
                    margin: '0 auto',
                    marginTop: '40px',
                    position: 'relative',
                    overflowY: 'hidden'
                }}
            >
                {content}
            </div>
        );

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
                        <h1 className={`text-3xl font-bold text-gray-900 ${!data.is_use_photo ? 'text-center' : ''}`}>{data.name}</h1>

                        {data.is_use_photo ? <div className="mt-3 text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-1">
                            {data.address && <p className="flex items-center gap-2"><span>{data.is_use_photo ? '📍' : ''}</span>{data.address}</p>}
                            {data.phone && <p className="flex items-center gap-2">
                                <span>{data.is_use_photo ? '📱' : ''}</span>
                                <a 
                                    href={`https://wa.me/${formatPhoneForWhatsApp(data.phone)}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="hover:text-blue-600 hover:underline"
                                >
                                    {data.phone}
                                </a>
                            </p>}
                            {data.email && <p className="flex items-center gap-2"><span>{data.is_use_photo ? '✉️' : ''}</span>{data.email}</p>}
                            {data.linkedin && <p className="flex items-center gap-2"><span>{data.is_use_photo ? '🔗' : ''}</span>{data.linkedin}</p>}
                        </div> :
                            <div className="mt-3 text-gray-700 text-center">
                                <div className="flex flex-wrap justify-center gap-2 mb-2">
                                    {data.phone && <p className="whitespace-nowrap">
                                        <a 
                                            href={`https://wa.me/${formatPhoneForWhatsApp(data.phone)}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="hover:text-blue-600 hover:underline"
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

        // Perkiraan tinggi header dan summary
        const headerHeight = 150;
        const summaryHeight = data.summary ? 100 : 0;
        let currentPageHeight = headerHeight;

        // Summary juga biasanya di halaman pertama
        if (data.summary) {
            currentPage.push(
                <div key="summary" className="cv-section mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200">Summary</h2>
                    <p className="text-gray-700">{data.summary}</p>
                </div>
            );
            
            // Tambahkan tinggi summary dan spacing setelah section
            currentPageHeight += summaryHeight + SECTION_SPACING_HEIGHT;
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

        // Fungsi untuk memproses section dengan paginasi per baris
        const processSectionWithLineBreak = (sectionTitle: string, items: any[], renderItem: (item: any, index: number) => React.ReactNode) => {
            // Tambahkan spacing sebelum section baru
            currentPageHeight += SECTION_SPACING_HEIGHT;
            
            // Tambahkan heading section
            currentPage.push(
                <div key={`${sectionTitle}_title`} className="cv-section-heading mb-4 mt-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200">{sectionTitle}</h2>
                </div>
            );
            currentPageHeight += SECTION_HEADING_HEIGHT;
            
            // Variabel untuk melacak apakah item sedang diproses di tengah konten
            let isProcessingItem = false;
            let currentItemIndex = -1;
            
            items.forEach((item, index) => {
                // Render item heading
                const itemElement = renderItem(item, index);
                
                // Ambil deskripsi dan parse bullet points untuk menghitung perkiraan tinggi total item
                const description = item.description || '';
                const { intro, bullets } = extractBulletPoints(description);
                
                // Jika memulai item baru
                if (currentItemIndex !== index) {
                    currentItemIndex = index;
                    isProcessingItem = true;
                    
                    // Cek apakah header item akan melebihi halaman
                    if (currentPageHeight + ITEM_HEADING_HEIGHT > PAGE_HEIGHT - 5) {
                        // Jika melebihi, pindah ke halaman baru
                        pageContents.push(createPage(currentPage));
                        currentPage = [];
                        currentPageHeight = 0;
                    }
                    
                    // Tambahkan header item
                    currentPage.push(itemElement);
                    currentPageHeight += ITEM_HEADING_HEIGHT;
                }
                
                // Proses paragraf intro jika ada
                if (intro) {
                    // Cek jika paragraf intro akan melebihi halaman ini
                    if (currentPageHeight + PARAGRAPH_HEIGHT > PAGE_HEIGHT - 5) {
                        // Pindah ke halaman baru jika tidak muat
                        pageContents.push(createPage(currentPage));
                        currentPage = [];
                        currentPageHeight = 0;
                    }
                    
                    // Tambahkan paragraf intro
                    currentPage.push(
                        <p key={`intro_${sectionTitle}_${index}`} className="text-gray-600 mt-1">{intro}</p>
                    );
                    currentPageHeight += PARAGRAPH_HEIGHT;
                }
                
                // Proses setiap bullet point satu per satu
                if (bullets.length > 0) {
                    bullets.forEach((bullet, bulletIndex) => {
                        // Cek jika bullet point ini akan melebihi halaman
                        if (currentPageHeight + BULLET_POINT_HEIGHT > PAGE_HEIGHT - 5) {
                            // Pindah ke halaman baru untuk bullet point berikutnya
                            pageContents.push(createPage(currentPage));
                            currentPage = [];
                            currentPageHeight = 0;
                        }
                        
                        // Tambahkan bullet point
                        currentPage.push(
                            <div key={`bullet_${sectionTitle}_${index}_${bulletIndex}`} style={{
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
                
                // Tambahkan spacing setelah item
                currentPageHeight += SPACING_HEIGHT;
                isProcessingItem = false;
            });
        };

        // Proses Work Experience dengan pagination per baris
        if (data.work_experience && data.work_experience.length > 0 && data.work_experience[0].company) {
            processSectionWithLineBreak(
                "Work Experience",
                data.work_experience.filter(work => work.company),
                (work, index) => (
                    <div key={`work_header_${index}`} className="mb-2">
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold text-gray-800">{work.position}</h3>
                            <span className="text-sm text-gray-600 font-semibold">
                                {formatDate(work.start_date)} - {work.is_current ? 'Present' : formatDate(work.end_date)} {calculateDuration(work.start_date, work.end_date, work.is_current)}
                            </span>
                        </div>
                        <h4 className="text-md text-gray-700 font-semibold">{work.company}, {work.company_location} ({work.location_type})</h4>
                    </div>
                )
            );
            
            // Tambahkan spacing setelah section
            currentPageHeight += SECTION_SPACING_HEIGHT;
        }

        // Proses Education dengan pagination per baris
        if (data.education && data.education.length > 0 && data.education[0].institution) {
            processSectionWithLineBreak(
                "Education",
                data.education.filter(edu => edu.institution),
                (edu, index) => (
                    <div key={`edu_header_${index}`} className="mb-2">
                        <div className="flex justify-between items-start">
                            <h3 className="text-md font-semibold text-gray-800">{edu.degree} {edu.degree ? ',' : ''} {edu.field}</h3>
                            <span className="text-sm text-gray-600 font-semibold">
                                {formatDate(edu.start_date)} - {formatDate(edu.end_date)}
                            </span>
                        </div>
                        <h4 className="text-md text-gray-700 font-semibold">{edu.institution}</h4>
                    </div>
                )
            );
            
            // Tambahkan spacing setelah section
            currentPageHeight += SECTION_SPACING_HEIGHT;
        }

        // Proses Skills section
        if (data.skills && data.skills.length > 0 && data.skills[0].name) {
            // Tambahkan spacing sebelum section baru
            currentPageHeight += SECTION_SPACING_HEIGHT;
            
            // Cek jika heading tidak akan muat di halaman ini
            if (currentPageHeight + SECTION_HEADING_HEIGHT > PAGE_HEIGHT - 5) {
                pageContents.push(createPage(currentPage));
                currentPage = [];
                currentPageHeight = 0;
            }
            
            // Tambahkan heading skills
            currentPage.push(
                <div key="skills_title" className="cv-section mb-4 mt-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200">Skills</h2>
                </div>
            );
            currentPageHeight += SECTION_HEADING_HEIGHT;
            
            // Tambahkan container untuk skills
            currentPage.push(
                <div key="skills_container" className="grid grid-cols-4 gap-1">
                </div>
            );
            
            // Proses setiap skill
            data.skills.forEach((skill, index) => {
                const skillItemHeight = 30; // Tinggi item skill
                
                // Cek jika skill item tidak akan muat di halaman ini
                if (currentPageHeight + skillItemHeight > PAGE_HEIGHT - 5) {
                    pageContents.push(createPage(currentPage));
                    currentPage = [];
                    currentPageHeight = 0;
                    
                    // Tambahkan container baru untuk skills di halaman baru
                    currentPage.push(
                        <div key={`skills_container_new_page`} className="grid grid-cols-4 gap-1">
                        </div>
                    );
                }
                
                // Tambahkan skill item
                currentPage.push(
                    <div key={`skill_${index}`} className="flex items-center">
                        <span className="text-gray-700">• {skill.name}</span>
                    </div>
                );
                currentPageHeight += skillItemHeight;
            });
        }

        // Proses Portfolios dengan pagination per baris
        if (data.portfolios && data.portfolios.length > 0 && data.portfolios[0].title) {
            processSectionWithLineBreak(
                "Portfolios",
                data.portfolios.filter(portfolio => portfolio.title),
                (portfolio, index) => (
                    <div key={`portfolio_header_${index}`} className="mb-2">
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold text-gray-800">
                                {portfolio.title} (
                                <a
                                    href={portfolio.link.startsWith('http') ? portfolio.link : `https://${portfolio.link}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 hover:underline"
                                >
                                    {portfolio.link}
                                </a>
                                )
                            </h3>
                        </div>
                    </div>
                )
            );
            
            // Tambahkan spacing setelah section
            currentPageHeight += SECTION_SPACING_HEIGHT;
        }

        // Proses Accomplishments dengan pagination per baris
        if (data.accomplishments && data.accomplishments.length > 0 && data.accomplishments[0].description) {
            processSectionWithLineBreak(
                "Accomplishments",
                data.accomplishments.filter(acc => acc.description),
                (accomplishment, index) => (
                    <div key={`accomplishment_header_${index}`} className="mb-2">
                        {/* Accomplishment entries don't have their own headers, so we return an empty div */}
                    </div>
                )
            );
            
            // Tambahkan spacing setelah section
            currentPageHeight += SECTION_SPACING_HEIGHT;
        }

        // Proses Organizations dengan pagination per baris
        if (data.organizations && data.organizations.length > 0 && data.organizations[0].name) {
            processSectionWithLineBreak(
                "Organization",
                data.organizations.filter(org => org.name),
                (org, index) => (
                    <div key={`org_header_${index}`} className="mb-2">
                        <div className="flex justify-between items-start">
                            <h3 className="text-md font-semibold text-gray-800">{org.position}, {org.name}</h3>
                            <span className="text-sm text-gray-600 font-semibold">
                                {formatDate(org.start_date)} - {formatDate(org.end_date)}
                            </span>
                        </div>
                    </div>
                )
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
            // Tingkatkan batas minimum konten untuk pindah halaman
            if ((currentPageHeight + totalLanguagesHeight > PAGE_HEIGHT - 50) && currentPageHeight > PAGE_HEIGHT * 0.7) {
                pageContents.push(createPage(currentPage));
                currentPage = [];
                currentPageHeight = 0;
            }
            
            // Tambahkan spacing sebelum section baru
            currentPageHeight += SECTION_SPACING_HEIGHT;
            
            // Tambahkan heading languages
            currentPage.push(
                <div key="languages_title" className="cv-section mb-4 mt-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200">Languages</h2>
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
                if (currentPageHeight + langItemHeight > PAGE_HEIGHT - 5) {
                    pageContents.push(createPage(currentPage));
                    currentPage = [];
                    currentPageHeight = 0;
                }
                
                // Tambahkan language item
                currentPage.push(
                    <li key={`lang_${index}`} className="mb-1">
                        <span className="text-gray-700 font-medium">{lang.language}</span>
                        <span className="ml-2 text-gray-600">({levelText})</span>
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
            
            // Cek jika heading tidak akan muat di halaman ini
            if (currentPageHeight + SECTION_HEADING_HEIGHT > PAGE_HEIGHT - 5) {
                pageContents.push(createPage(currentPage));
                currentPage = [];
                currentPageHeight = 0;
            }
            
            // Tambahkan heading
            currentPage.push(
                <div key="additional_info_title" className="cv-section mb-4 mt-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200">Additional Info</h2>
                </div>
            );
            currentPageHeight += SECTION_HEADING_HEIGHT;
            
            // Proses paragraf intro jika ada
            if (intro) {
                // Cek jika paragraf intro tidak akan muat di halaman ini
                if (currentPageHeight + PARAGRAPH_HEIGHT > PAGE_HEIGHT - 5) {
                    pageContents.push(createPage(currentPage));
                    currentPage = [];
                    currentPageHeight = 0;
                }
                
                // Tambahkan paragraf intro
                currentPage.push(
                    <p key="additional_info_intro" className="text-gray-600 mt-1">{intro}</p>
                );
                currentPageHeight += PARAGRAPH_HEIGHT;
            }
            
            // Proses setiap bullet point satu per satu
            bullets.forEach((bullet, bulletIndex) => {
                // Cek jika bullet point tidak akan muat di halaman ini
                if (currentPageHeight + BULLET_POINT_HEIGHT > PAGE_HEIGHT - 5) {
                    pageContents.push(createPage(currentPage));
                    currentPage = [];
                    currentPageHeight = 0;
                }
                
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
            pageContents.push(createPage(currentPage));
        }
        
        // Jika tidak ada halaman yang dibuat, buat halaman dengan header saja
        if (pageContents.length === 0) {
            pageContents.push(createPage(currentPage));
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
                {pages.map((page, index) => (
                    <div key={`page-${index}`} className="relative mb-8">
                        {page}
                        <div className="page-number-indicator absolute bottom-2 text-center w-full text-xs text-gray-400 mb-5">
                            Page {index + 1} of {pages.length}
                        </div>
                        {index < pages.length - 1 && <div className="html2pdf__page-break"></div>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CV;
