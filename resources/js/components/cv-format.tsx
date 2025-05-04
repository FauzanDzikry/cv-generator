import React, { useState, useEffect, useRef, ReactElement } from 'react';
import ReactDOM from 'react-dom';

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
}

const CV: React.FC<CVProps> = ({ data }) => {
    const [zoomLevel, setZoomLevel] = useState(100);
    const [showZoomControls, setShowZoomControls] = useState(true);
    const cvContentRef = useRef<HTMLDivElement>(null);

    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setZoomLevel(parseInt(e.target.value));
    };

    const toggleZoomControls = () => {
        setShowZoomControls(prev => !prev);
    };

    // Fungsi helper untuk memastikan semua deskripsi di-render dengan benar
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
        <div className="cv-container mx-auto relative flex justify-center bg-gray-100" style={{ maxWidth: '100%' }}>
            {showZoomControls ? (
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
            ) : (
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

            <div className="cv-single-page-container">
                <div 
                    className="cv-page bg-white shadow-lg rounded-lg"
                    style={{
                        width: '21cm',
                        height: '29.7cm',
                        padding: '2cm',
                        boxSizing: 'border-box',
                        fontSize: '11pt',
                        lineHeight: '1.5',
                        backgroundColor: 'white',
                        boxShadow: '0 0 10px rgba(83, 81, 81, 0.2)',
                        transform: `scale(${(zoomLevel / 100) * 0.65})`,
                        transformOrigin: 'top center',
                        transition: 'transform 0.2s ease',
                        margin: '0 auto',
                        marginBottom: '2rem',
                        overflowY: 'visible'
                    }}
                    ref={cvContentRef}
                >
                    {/* Header / Personal Information */}
                    <div className="cv-header pb-4">
                        <div className="flex items-start justify-between">
                            {data.is_use_photo && data.photo && (
                                <div className="w-1/4 flex justify-start">
                                    <div className="h-32 w-32 rounded-full overflow-hidden border-2 border-gray-300">
                                        <img
                                            src={URL.createObjectURL(data.photo)}
                                            alt={`${data.name}'s photo`}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className={`${data.is_use_photo && data.photo ? 'w-3/4' : 'w-full'}`}>
                                <h1 className={`text-3xl font-bold text-gray-900 ${!data.is_use_photo ? 'text-center' : ''}`}>{data.name}</h1>

                                {data.is_use_photo ? <div className="mt-3 text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-1">
                                    {data.address && <p className="flex items-center gap-2"><span>{data.is_use_photo ? '📍' : ''}</span>{data.address}</p>}
                                    {data.phone && <p className="flex items-center gap-2"><span>{data.is_use_photo ? '📱' : ''}</span>{data.phone}</p>}
                                    {data.email && <p className="flex items-center gap-2"><span>{data.is_use_photo ? '✉️' : ''}</span>{data.email}</p>}
                                    {data.linkedin && <p className="flex items-center gap-2"><span>{data.is_use_photo ? '🔗' : ''}</span>{data.linkedin}</p>}
                                </div> :
                                    <div className="mt-3 text-gray-700 text-center">
                                        <div className="flex flex-wrap justify-center gap-2 mb-2">
                                            {data.phone && <p className="whitespace-nowrap">{data.phone}</p>}
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

                    {/* Summary */}
                    {data.summary && (
                        <div className="cv-section mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200">Summary</h2>
                            <p className="text-gray-700">{data.summary}</p>
                        </div>
                    )}

                    {/* Work Experience */}
                    {data.work_experience && data.work_experience.length > 0 && data.work_experience[0].company && (
                        <div className="cv-section mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200">Work Experience</h2>
                            {data.work_experience.map((work, index) => (
                                work.company && (
                                    <div key={index} className="mb-4">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-semibold text-gray-800">{work.position}</h3>
                                            <span className="text-sm text-gray-600 font-semibold">
                                                {formatDate(work.start_date)} - {work.is_current ? 'Present' : formatDate(work.end_date)} {calculateDuration(work.start_date, work.end_date, work.is_current)}
                                            </span>
                                        </div>
                                        <h4 className="text-md text-gray-700 font-semibold">{work.company}, {work.company_location} ({work.location_type})</h4>
                                        <div className="text-gray-600 mt-1">
                                            {renderDescription(work.description, index)}
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    )}

                    {/* Education */}
                    {data.education && data.education.length > 0 && data.education[0].institution && (
                        <div className="cv-section mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200">Education</h2>
                            {data.education.map((edu, index) => (
                                edu.institution && (
                                    <div key={index} className="mb-4">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-md font-semibold text-gray-800">{edu.degree} {edu.degree ? ',' : ''} {edu.field}</h3>
                                            <span className="text-sm text-gray-600 font-semibold">
                                                {formatDate(edu.start_date)} - {formatDate(edu.end_date)}
                                            </span>
                                        </div>
                                        <h4 className="text-md text-gray-700 font-semibold">{edu.institution}</h4>
                                        <div className="text-gray-600 mt-1">
                                            {renderDescription(edu.description, index)}
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    )}

                    {/* Skills */}
                    {data.skills && data.skills.length > 0 && data.skills[0].name && (
                        <div className="cv-section mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200">Skills</h2>
                            <div className="grid grid-cols-4 gap-1">
                                {data.skills.map((skill, index) => (
                                    <div key={index} className="flex items-center">
                                        <span className="text-gray-700">• {skill.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Portfolios */}
                    {data.portfolios && data.portfolios.length > 0 && data.portfolios[0].title && (
                        <div className="cv-section mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200">Portfolios</h2>
                            {data.portfolios.map((portfolio, index) => (
                                portfolio.title && (
                                    <div key={index} className="mb-3">
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
                                        {portfolio.description && (
                                            <div className="text-gray-600 mt-1">
                                                {renderDescription(portfolio.description, index)}
                                            </div>
                                        )}
                                    </div>
                                )
                            ))}
                        </div>
                    )}

                    {/* License & Certification */}
                    {data.certifications && data.certifications.length > 0 && data.certifications[0].name && (
                        <div className="cv-section mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200">License & Certification</h2>
                            {data.certifications.map((cert, index) => (
                                cert.name && (
                                    <div key={index} className="mb-3">
                                        <h3 className="text-lg font-semibold text-gray-800">{cert.name} <span className="font-normal">({cert.organization})</span></h3>
                                        <h4 className="text-md text-gray-700">Issued {formatDate(cert.start_year)} {cert.is_time_limited ? `- ${formatDate(cert.end_year)}` : ''}</h4>
                                        {cert.credential_id && <p className="text-gray-600 mt-1">Credential ID : {cert.credential_id}</p>}
                                    </div>
                                )
                            ))}
                        </div>
                    )}

                    {/* Accomplishments */}
                    {data.accomplishments && data.accomplishments.length > 0 && data.accomplishments[0].description && (
                        <div className="cv-section mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200">Accomplishments</h2>
                            {data.accomplishments.map((accomplishment, index) => (
                                accomplishment.description && (
                                    <div key={index} className="mb-3">
                                        {accomplishment.description && (
                                            <div className="text-gray-600 mt-1">
                                                {renderDescription(accomplishment.description, index)}
                                            </div>
                                        )}
                                    </div>
                                )
                            ))}
                        </div>
                    )}

                    {/* Organization */}
                    {data.organizations && data.organizations.length > 0 && data.organizations[0].name && (
                        <div className="cv-section mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200">Organization</h2>
                            {data.organizations.map((org, index) => (
                                org.name && (
                                    <div key={index} className="mb-4">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-md font-semibold text-gray-800">{org.position}, {org.name}</h3>
                                            <span className="text-sm text-gray-600 font-semibold">
                                                {formatDate(org.start_date)} - {formatDate(org.end_date)}
                                            </span>
                                        </div>
                                        <div className="text-gray-600 mt-1">
                                            {renderDescription(org.description, index)}
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    )}

                    {/* Languages */}
                    {data.languages && data.languages.length > 0 && data.languages[0].language && (
                        <div className="cv-section mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200">Languages</h2>
                            <ul className="list-disc pl-5">
                                {data.languages.map((lang, index) => {
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
                                    return (
                                        <li key={index} className="mb-1">
                                            <span className="text-gray-700 font-medium">{lang.language}</span>
                                            <span className="ml-2 text-gray-600">({levelText})</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {/* Additional Info */}
                    {data.additional_info && (
                        <div className="cv-section mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200">Additional Info</h2>
                            <div className="text-gray-600 mt-1">
                                {renderDescription(data.additional_info, 0)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CV;
