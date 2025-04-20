import React from 'react';

interface WorkExperience {
    company: string;
    position: string;
    start_date: string;
    end_date: string;
    description: string;
    is_current?: boolean;
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

interface Certification {
    name: string;
    organization: string;
    start_year: string;
    end_year: string;
    is_time_limited?: boolean;
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
    work_experience: WorkExperience[];
    education: Education[];
    skills: Skill[];
    certifications: Certification[];
    languages: Language[];
    portfolios?: any[];
    accomplishments?: any[];
    organizations?: any[];
    additional_info?: string;
}

interface CVProps {
    data: CVData;
}

const CV: React.FC<CVProps> = ({ data }) => {
    if (!data || Object.keys(data).length === 0) {
        return (
            <div className="cv-preview-empty flex items-center justify-center h-full">
                <p className="text-gray-500">Preview CV akan muncul di sini</p>
            </div>
        );
    }

    return (
        <div className="cv-container mx-auto" style={{ maxWidth: '100%' }}>
            <div className="cv-preview bg-white shadow-lg rounded-lg" style={{
                width: '21cm',
                minHeight: '29.7cm',
                margin: '0 auto',
                padding: '2cm',
                boxSizing: 'border-box',
                overflowX: 'hidden',
                overflowY: 'auto',
                fontSize: '11pt',
                lineHeight: '1.5',
                backgroundColor: 'white',
                position: 'relative',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)'
            }}>
                {/* Header / Informasi Pribadi */}
                <div className="cv-header mb-6 pb-4 border-b-2 border-gray-200">
                    <h1 className="text-3xl font-bold text-gray-900">{data.name || 'Nama Lengkap'}</h1>
                    
                    <div className="mt-3 text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-1">
                        {data.address && <p className="flex items-center gap-2"><span>📍</span>{data.address}</p>}
                        {data.phone && <p className="flex items-center gap-2"><span>📱</span>{data.phone}</p>}
                        {data.email && <p className="flex items-center gap-2"><span>✉️</span>{data.email}</p>}
                        {data.linkedin && <p className="flex items-center gap-2"><span>🔗</span>{data.linkedin}</p>}
                    </div>
                </div>

                {/* Ringkasan / Summary */}
                {data.summary && (
                    <div className="cv-summary mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Ringkasan Profesional</h2>
                        <p className="text-gray-700">{data.summary}</p>
                    </div>
                )}

                {/* Pengalaman Kerja */}
                {data.work_experience && data.work_experience.length > 0 && data.work_experience[0].company && (
                    <div className="cv-work mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-3">Pengalaman Kerja</h2>
                        {data.work_experience.map((work, index) => (
                            work.company && (
                                <div key={index} className="mb-4">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-medium text-gray-800">{work.position}</h3>
                                        <span className="text-sm text-gray-600">
                                            {work.start_date} - {work.is_current ? 'Sekarang' : work.end_date}
                                        </span>
                                    </div>
                                    <h4 className="text-md text-gray-700">{work.company}</h4>
                                    <p className="text-gray-600 mt-1">{work.description}</p>
                                </div>
                            )
                        ))}
                    </div>
                )}

                {/* Pendidikan */}
                {data.education && data.education.length > 0 && data.education[0].institution && (
                    <div className="cv-education mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-3">Pendidikan</h2>
                        {data.education.map((edu, index) => (
                            edu.institution && (
                                <div key={index} className="mb-4">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-medium text-gray-800">{edu.institution}</h3>
                                        <span className="text-sm text-gray-600">
                                            {edu.start_date} - {edu.end_date}
                                        </span>
                                    </div>
                                    <h4 className="text-md text-gray-700">{edu.degree} {edu.degree ? '-' : ''} {edu.field}</h4>
                                    {edu.description && <p className="text-gray-600 mt-1">{edu.description}</p>}
                                </div>
                            )
                        ))}
                    </div>
                )}

                {/* Keahlian */}
                {data.skills && data.skills.length > 0 && (
                    <div className="cv-skills mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-3">Keahlian</h2>
                        <div className="grid grid-cols-3 gap-2">
                            {data.skills.map((skill, index) => (
                                <div key={index} className="flex items-center">
                                    <span className="text-gray-700">• {skill.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sertifikasi */}
                {data.certifications && data.certifications.length > 0 && data.certifications[0].name && (
                    <div className="cv-certifications mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-3">Sertifikasi</h2>
                        {data.certifications.map((cert, index) => (
                            cert.name && (
                                <div key={index} className="mb-3">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-medium text-gray-800">{cert.name}</h3>
                                        <span className="text-sm text-gray-600">
                                            {cert.start_year} - {cert.is_time_limited ? cert.end_year : 'Tidak ada batas waktu'}
                                        </span>
                                    </div>
                                    <h4 className="text-md text-gray-700">{cert.organization}</h4>
                                    {cert.description && <p className="text-gray-600 mt-1">{cert.description}</p>}
                                </div>
                            )
                        ))}
                    </div>
                )}

                {/* Bahasa */}
                {data.languages && data.languages.length > 0 && data.languages[0].language && (
                    <div className="cv-languages mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-3">Kemampuan Bahasa</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {data.languages.map((lang, index) => (
                                <div key={index} className="flex items-center">
                                    <span className="text-gray-700">{lang.language}</span>
                                    <span className="ml-2 text-gray-600">- {lang.level}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CV;
