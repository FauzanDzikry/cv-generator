import {
    ATTRIBUTION_TEXT,
    CONTENT_WIDTH_MM,
    MARGIN_BOTTOM,
    MARGIN_LEFT,
    MARGIN_RIGHT,
    MARGIN_TOP,
    PAGE_WIDTH_MM,
    pageContentStyle,
    pageOuterStyle,
} from '@/lib/cv-page-layout';
import { MAX_CONTENT_HEIGHT_PX, SemanticBlock, measureBlocks, paginateBlocks } from '@/lib/cv-pagination';
import type { CVData, Skill } from '@/types/cv';
import React, { useEffect, useMemo, useRef, useState } from 'react';

export const pageBreakStyle = `
@media print {
    .cv-page {
        page-break-after: always !important;
        break-after: page !important;
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
    }
    
    .cv-page:last-of-type, .cv-page:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
    }
    
    .zoom-controls,
    .cv-margin-guide {
        display: none !important;
    }
}

.pdf-export-mode .cv-page {
    page-break-after: always !important;
    break-after: page !important;
    margin: 0 !important;
    box-shadow: none !important;
    border: none !important;
}

.pdf-export-mode .cv-page:last-of-type,
.pdf-export-mode .cv-page:last-child {
    page-break-after: auto !important;
    break-after: auto !important;
}

.pdf-export-mode .zoom-controls,
.pdf-export-mode .cv-margin-guide,
.cv-for-pdf-mode .cv-margin-guide {
    display: none !important;
}

.pdf-export-mode {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
    background-color: white !important;
    width: ${PAGE_WIDTH_MM}mm !important;
    padding: 0 !important;
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
    margin: 0 !important;
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

.cv-for-pdf-mode .skills-container,
.pdf-export-mode .skills-container {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 2rem !important;
    justify-content: flex-start !important;
    width: 100% !important;
}

.cv-for-pdf-mode .skills-column,
.pdf-export-mode .skills-column {
    flex: 1 1 auto !important;
    min-width: 120px !important;
    max-width: 200px !important;
    font-family: Arial, sans-serif !important;
}
`;

const formatDate = (dateString: string) => {
    if (!dateString) return '';

    const parts = dateString.split('-');
    if (parts.length === 2 || parts.length === 3) {
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    return dateString;
};

const formatPhoneForWhatsApp = (phone: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.substring(1);
    }
    return cleanPhone;
};

const calculateDuration = (startDate: string, endDate: string, isCurrent: boolean = false) => {
    if (!startDate) return '';

    const start = new Date(startDate);
    const end = isCurrent ? new Date() : new Date(endDate || startDate);

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();

    if (months < 0) {
        years--;
        months += 12;
    }

    let durationStr = '(';
    if (years > 0) {
        durationStr += `${years} yr${years > 1 ? 's' : ''} `;
    }
    if (months > 0 || years === 0) {
        durationStr += `${months} mo${months > 1 ? 's' : ''}`;
    }
    durationStr += ')';

    return durationStr;
};

interface CVProps {
    data: CVData;
    isPdfMode?: boolean;
}

const extractBulletPoints = (description: string): { intro?: string; bullets: string[] } => {
    if (!description) return { bullets: [] };
    const result: { intro?: string; bullets: string[] } = { bullets: [] };

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
        const introLines: string[] = [];

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

function buildSemanticBlocks(data: CVData): SemanticBlock[] {
    const blocks: SemanticBlock[] = [];
    if (!data || Object.keys(data).length === 0) return blocks;

    blocks.push({
        key: 'cv-header',
        kind: 'header',
        keepWithNext: Boolean(data.summary),
        content: (
            <div className="cv-header pb-4">
                <div className="flex items-start justify-between">
                    {data.is_use_photo && (data.photo || data.photoPreview) && (
                        <div className="flex w-1/4 justify-start">
                            <div className="h-32 w-32 overflow-hidden rounded-full border-2 border-gray-300">
                                <img
                                    src={data.photoPreview || (data.photo ? URL.createObjectURL(data.photo) : '')}
                                    alt={`${data.name}'s photo`}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        </div>
                    )}

                    <div className={`${data.is_use_photo && (data.photo || data.photoPreview) ? 'w-3/4' : 'w-full'}`}>
                        <h1
                            className={`font-bold text-gray-900 ${!data.is_use_photo ? 'text-center' : ''}`}
                            style={{ fontFamily: 'Arial, sans-serif', fontSize: '12pt' }}
                        >
                            {data.name}
                        </h1>

                        {data.is_use_photo ? (
                            <div
                                className="mt-3 grid grid-cols-1 gap-1 text-gray-700 md:grid-cols-2"
                                style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}
                            >
                                {data.address && (
                                    <p className="flex items-center gap-2">
                                        <span>📍</span>
                                        {data.address}
                                    </p>
                                )}
                                {data.phone && (
                                    <p className="flex items-center gap-2">
                                        <span>📱</span>
                                        <a
                                            href={`https://wa.me/${formatPhoneForWhatsApp(data.phone)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-blue-600 hover:underline"
                                            style={{ fontFamily: 'Arial, sans-serif' }}
                                        >
                                            {data.phone}
                                        </a>
                                    </p>
                                )}
                                {data.email && (
                                    <p className="flex items-center gap-2">
                                        <span>✉️</span>
                                        {data.email}
                                    </p>
                                )}
                                {data.linkedin && (
                                    <p className="flex items-center gap-2">
                                        <span>🔗</span>
                                        {data.linkedin}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="mt-3 text-center text-gray-700" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {data.phone && (
                                        <p className="whitespace-nowrap">
                                            <a
                                                href={`https://wa.me/${formatPhoneForWhatsApp(data.phone)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:text-blue-600 hover:underline"
                                                style={{ fontFamily: 'Arial, sans-serif' }}
                                            >
                                                {data.phone}
                                            </a>
                                        </p>
                                    )}
                                    {data.phone && data.email && <span className="whitespace-nowrap">|</span>}
                                    {data.email && <p className="overflow-hidden text-ellipsis whitespace-nowrap">{data.email}</p>}
                                    {(data.phone || data.email) && data.linkedin && <span className="whitespace-nowrap">|</span>}
                                    {data.linkedin && <p className="overflow-hidden text-ellipsis whitespace-nowrap">{data.linkedin}</p>}
                                    {(data.phone || data.email || data.linkedin) && data.address && <span className="whitespace-nowrap">|</span>}
                                    {data.address && <p className="max-w-full break-words">{data.address}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ),
    });

    const addSectionHeading = (title: string, key: string) => {
        blocks.push({
            key,
            kind: 'section-heading',
            keepWithNext: true,
            content: (
                <div className="cv-section mt-4 mb-3">
                    <h2
                        className="mb-2 border-b-2 border-gray-200 pb-1 font-semibold text-gray-800"
                        style={{ fontFamily: 'Arial, sans-serif', fontSize: '12pt' }}
                    >
                        {title}
                    </h2>
                </div>
            ),
        });
    };

    const pushDescriptionBlocks = (description: string, parentKey?: string, prefix = '') => {
        if (!description) return;
        const { intro, bullets } = extractBulletPoints(description);
        if (intro) {
            blocks.push({
                key: `${prefix || parentKey}-intro`,
                kind: 'paragraph',
                keepWithNext: false,
                parentItemKey: parentKey,
                content: (
                    <p
                        className="cv-body-text mb-1 text-gray-600"
                        style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', textAlign: 'justify' }}
                    >
                        {intro}
                    </p>
                ),
            });
        }
        if (bullets && bullets.length > 0) {
            bullets.forEach((bullet, idx) => {
                blocks.push({
                    key: `${prefix || parentKey}-bullet-${idx}`,
                    kind: 'bullet',
                    keepWithNext: false,
                    parentItemKey: parentKey,
                    content: (
                        <div
                            style={{
                                display: 'flex',
                                marginBottom: '0.25rem',
                                fontFamily: 'Arial, sans-serif',
                                fontSize: '10pt',
                                textAlign: 'justify',
                            }}
                            className="cv-body-text text-gray-600"
                        >
                            <div style={{ width: '1em', flexShrink: 0 }}>•</div>
                            <div>{bullet}</div>
                        </div>
                    ),
                });
            });
        }
    };

    if (data.summary) {
        addSectionHeading('Summary', 'sec-summary');
        pushDescriptionBlocks(data.summary, undefined, 'summary');
    }

    if (data.work_experience && data.work_experience.length > 0 && data.work_experience[0].company) {
        addSectionHeading('Work Experience', 'sec-work');
        data.work_experience
            .filter((work) => work.company)
            .forEach((work, index) => {
                const itemKey = `work-head-${index}`;
                const headContent = (
                    <div className="mt-2 mb-1">
                        <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                {work.position}
                            </h3>
                            <span className="font-semibold text-gray-600" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                {formatDate(work.start_date)} - {work.is_current ? 'Present' : formatDate(work.end_date)}{' '}
                                {calculateDuration(work.start_date, work.end_date, work.is_current)}
                            </span>
                        </div>
                        <h4 className="font-semibold text-gray-700" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                            {work.company}, {work.company_location} ({work.location_type})
                        </h4>
                    </div>
                );
                const contContent = (
                    <div className="mt-2 mb-1">
                        <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                {work.position} <span className="font-normal text-gray-500 italic">(continued)</span>
                            </h3>
                            <span className="font-semibold text-gray-600" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                {formatDate(work.start_date)} - {work.is_current ? 'Present' : formatDate(work.end_date)}{' '}
                                {calculateDuration(work.start_date, work.end_date, work.is_current)}
                            </span>
                        </div>
                        <h4 className="font-semibold text-gray-700" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                            {work.company}, {work.company_location} ({work.location_type})
                        </h4>
                    </div>
                );

                blocks.push({
                    key: itemKey,
                    kind: 'item-heading',
                    keepWithNext: true,
                    content: headContent,
                    continuedContent: contContent,
                });

                pushDescriptionBlocks(work.description || '', itemKey);
            });
    }

    if (data.education && data.education.length > 0 && data.education[0].institution) {
        addSectionHeading('Education', 'sec-edu');
        data.education
            .filter((edu) => edu.institution)
            .forEach((edu, index) => {
                const itemKey = `edu-head-${index}`;
                const headContent = (
                    <div className="mt-2 mb-1">
                        <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                {edu.degree} {edu.degree ? ',' : ''} {edu.field}
                            </h3>
                            <span className="font-semibold text-gray-600" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                {formatDate(edu.start_date)} - {formatDate(edu.end_date)}
                            </span>
                        </div>
                        <h4 className="font-semibold text-gray-700" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                            {edu.institution}
                        </h4>
                    </div>
                );
                const contContent = (
                    <div className="mt-2 mb-1">
                        <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                {edu.degree} {edu.degree ? ',' : ''} {edu.field} <span className="font-normal text-gray-500 italic">(continued)</span>
                            </h3>
                            <span className="font-semibold text-gray-600" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                {formatDate(edu.start_date)} - {formatDate(edu.end_date)}
                            </span>
                        </div>
                        <h4 className="font-semibold text-gray-700" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                            {edu.institution}
                        </h4>
                    </div>
                );

                blocks.push({
                    key: itemKey,
                    kind: 'item-heading',
                    keepWithNext: true,
                    content: headContent,
                    continuedContent: contContent,
                });
                pushDescriptionBlocks(edu.description || '', itemKey);
            });
    }

    if (data.skills && data.skills.length > 0 && data.skills[0].name) {
        addSectionHeading('Skills', 'sec-skills');
        const skillsPerColumn = 3;
        const totalColumns = Math.ceil(data.skills.length / skillsPerColumn);
        const skillColumns: Skill[][] = [];
        for (let i = 0; i < totalColumns; i++) {
            const startIndex = i * skillsPerColumn;
            const endIndex = startIndex + skillsPerColumn;
            skillColumns.push(data.skills.slice(startIndex, endIndex));
        }
        blocks.push({
            key: 'skills-grid',
            kind: 'skills-grid',
            keepWithNext: false,
            content: (
                <div
                    className="skills-container mt-2"
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '2rem',
                        justifyContent: 'flex-start',
                    }}
                >
                    {skillColumns.map((column, columnIndex) => (
                        <div
                            key={`skills_col_${columnIndex}`}
                            className="skills-column"
                            style={{
                                flex: '1 1 auto',
                                minWidth: '120px',
                                maxWidth: '200px',
                                fontFamily: 'Arial, sans-serif',
                            }}
                        >
                            {column.map((skill, skillIndex) => (
                                <div key={`skill_${columnIndex}_${skillIndex}`} className="mb-1">
                                    <span className="text-gray-700" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt' }}>
                                        • {skill.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            ),
        });
    }

    if (data.portfolios && data.portfolios.length > 0 && data.portfolios[0].title) {
        addSectionHeading('Portfolios', 'sec-portfolios');
        data.portfolios
            .filter((p) => p.title)
            .forEach((portfolio, index) => {
                const itemKey = `portfolio-head-${index}`;
                const headContent = (
                    <div className="mt-2 mb-1">
                        <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                {portfolio.title} (
                                <a
                                    href={portfolio.link && portfolio.link.startsWith('http') ? portfolio.link : `https://${portfolio.link}`}
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
                );
                blocks.push({
                    key: itemKey,
                    kind: 'item-heading',
                    keepWithNext: Boolean(portfolio.description),
                    content: headContent,
                });
                pushDescriptionBlocks(portfolio.description || '', itemKey);
            });
    }

    if (data.certifications && data.certifications.length > 0 && data.certifications[0].name) {
        addSectionHeading('Certifications', 'sec-certifications');
        data.certifications
            .filter((c) => c.name)
            .forEach((cert, index) => {
                const itemKey = `cert-head-${index}`;
                const headContent = (
                    <div className="mt-2 mb-1">
                        <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                {cert.name}
                            </h3>
                            <span className="font-semibold text-gray-600" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                {cert.start_year} - {cert.end_year || (cert.is_time_limited ? '' : 'No Expiration')}
                            </span>
                        </div>
                        <h4 className="font-semibold text-gray-700" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                            {cert.organization} {cert.credential_id ? `(ID: ${cert.credential_id})` : ''}
                        </h4>
                    </div>
                );
                const contContent = (
                    <div className="mt-2 mb-1">
                        <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                {cert.name} <span className="font-normal text-gray-500 italic">(continued)</span>
                            </h3>
                            <span className="font-semibold text-gray-600" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                {cert.start_year} - {cert.end_year || (cert.is_time_limited ? '' : 'No Expiration')}
                            </span>
                        </div>
                        <h4 className="font-semibold text-gray-700" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                            {cert.organization} {cert.credential_id ? `(ID: ${cert.credential_id})` : ''}
                        </h4>
                    </div>
                );
                blocks.push({
                    key: itemKey,
                    kind: 'item-heading',
                    keepWithNext: Boolean(cert.description),
                    content: headContent,
                    continuedContent: contContent,
                });
                pushDescriptionBlocks(cert.description || '', itemKey);
            });
    }

    if (data.accomplishments && data.accomplishments.length > 0 && data.accomplishments[0].description) {
        addSectionHeading('Accomplishments', 'sec-accomp');
        data.accomplishments
            .filter((a) => a.description)
            .forEach((acc, index) => {
                pushDescriptionBlocks(acc.description, undefined, `accomp-${index}`);
            });
    }

    if (data.organizations && data.organizations.length > 0 && data.organizations[0].name) {
        addSectionHeading('Organization', 'sec-org');
        data.organizations
            .filter((o) => o.name)
            .forEach((org, index) => {
                const itemKey = `org-head-${index}`;
                const headContent = (
                    <div className="mt-2 mb-1">
                        <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                {org.position}, {org.name}
                            </h3>
                            <span className="font-semibold text-gray-600" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                {formatDate(org.start_date)} - {formatDate(org.end_date)}
                            </span>
                        </div>
                    </div>
                );
                const contContent = (
                    <div className="mt-2 mb-1">
                        <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                {org.position}, {org.name} <span className="font-normal text-gray-500 italic">(continued)</span>
                            </h3>
                            <span className="font-semibold text-gray-600" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                                {formatDate(org.start_date)} - {formatDate(org.end_date)}
                            </span>
                        </div>
                    </div>
                );
                blocks.push({
                    key: itemKey,
                    kind: 'item-heading',
                    keepWithNext: Boolean(org.description),
                    content: headContent,
                    continuedContent: contContent,
                });
                pushDescriptionBlocks(org.description || '', itemKey);
            });
    }

    if (data.languages && data.languages.length > 0 && data.languages[0].language) {
        addSectionHeading('Languages', 'sec-languages');
        const langItems = data.languages
            .filter((l) => l.language)
            .map((lang, index) => {
                let levelText = '';
                switch (lang.level) {
                    case 'Native':
                        levelText = 'Native or bilingual proficiency';
                        break;
                    case 'Fluent':
                        levelText = 'Full professional proficiency';
                        break;
                    case 'Advanced':
                        levelText = 'Professional working proficiency';
                        break;
                    case 'Intermediate':
                        levelText = 'Limited working proficiency';
                        break;
                    case 'Basic':
                        levelText = 'Elementary proficiency';
                        break;
                    default:
                        levelText = lang.level;
                }
                return (
                    <li key={`lang_${index}`} className="mb-1" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt' }}>
                        <span className="font-medium text-gray-700">{lang.language}</span>
                        <span className="ml-2 text-gray-600">({levelText})</span>
                    </li>
                );
            });
        blocks.push({
            key: 'languages-list',
            kind: 'languages-list',
            keepWithNext: false,
            content: <ul className="mt-2 list-disc pl-5">{langItems}</ul>,
        });
    }

    if (data.additional_info) {
        addSectionHeading('Additional Info', 'sec-additional');
        pushDescriptionBlocks(data.additional_info, undefined, 'additional-info');
    }

    return blocks;
}

const CV: React.FC<CVProps> = ({ data, isPdfMode = false }) => {
    const [zoomLevel, setZoomLevel] = useState(100);
    const [showZoomControls, setShowZoomControls] = useState(false);
    const [pageKeys, setPageKeys] = useState<string[][]>([]);
    const cvContentRef = useRef<HTMLDivElement>(null);
    const measurementRef = useRef<HTMLDivElement>(null);
    const lastSignatureRef = useRef<string>('');

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
            setShowZoomControls((prev) => !prev);
        }
    };

    const blocks: SemanticBlock[] = useMemo(() => buildSemanticBlocks(data), [data]);
    const blockMap = useMemo(() => {
        const map = new Map<string, SemanticBlock>();
        blocks.forEach((b) => map.set(b.key, b));
        return map;
    }, [blocks]);

    useEffect(() => {
        let active = true;

        const performPagination = async () => {
            if (typeof document !== 'undefined' && 'fonts' in document) {
                try {
                    await document.fonts.ready;
                } catch (e) {
                    // Ignore font ready errors
                }
            }

            if (measurementRef.current) {
                const images = Array.from(measurementRef.current.querySelectorAll('img'));
                await Promise.all(
                    images.map((img) => {
                        if (img.complete) return Promise.resolve();
                        return new Promise((resolve) => {
                            img.onload = resolve;
                            img.onerror = resolve;
                        });
                    }),
                );
            }

            if (!active || !measurementRef.current) return;

            const measured = measureBlocks(measurementRef.current, blocks);
            const computedPages = paginateBlocks(measured, MAX_CONTENT_HEIGHT_PX);

            const signature = JSON.stringify(computedPages);
            if (signature !== lastSignatureRef.current) {
                lastSignatureRef.current = signature;
                setPageKeys(computedPages);
            }
        };

        performPagination();
        const timer = setTimeout(performPagination, 150);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [blocks]);

    const activePageKeys = pageKeys.length > 0 ? pageKeys : [blocks.map((b) => b.key)];

    const createPage = (content: React.ReactNode, pageIndex?: number, totalPages?: number) => (
        <div
            className={`cv-page ${!isPdfMode ? 'mb-8 rounded-lg shadow-lg' : 'm-0 rounded-none border-none shadow-none'}`}
            style={{
                ...pageOuterStyle,
                marginBottom: !isPdfMode ? undefined : '0',
                marginTop: !isPdfMode ? undefined : '0',
                boxShadow: !isPdfMode ? undefined : 'none',
                border: !isPdfMode ? undefined : 'none',
            }}
        >
            {!isPdfMode && (
                <>
                    <div
                        className="cv-margin-guide"
                        aria-hidden="true"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: `${MARGIN_TOP}mm`,
                            backgroundColor: 'rgba(239, 68, 68, 0.06)',
                            pointerEvents: 'none',
                            zIndex: 10,
                        }}
                    />
                    <div
                        className="cv-margin-guide"
                        aria-hidden="true"
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: `${MARGIN_BOTTOM}mm`,
                            backgroundColor: 'rgba(239, 68, 68, 0.06)',
                            pointerEvents: 'none',
                            zIndex: 10,
                        }}
                    />
                    <div
                        className="cv-margin-guide"
                        aria-hidden="true"
                        style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: 0,
                            width: `${MARGIN_LEFT}mm`,
                            backgroundColor: 'rgba(239, 68, 68, 0.06)',
                            pointerEvents: 'none',
                            zIndex: 10,
                        }}
                    />
                    <div
                        className="cv-margin-guide"
                        aria-hidden="true"
                        style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            right: 0,
                            width: `${MARGIN_RIGHT}mm`,
                            backgroundColor: 'rgba(239, 68, 68, 0.06)',
                            pointerEvents: 'none',
                            zIndex: 10,
                        }}
                    />
                </>
            )}
            <div className="cv-page-content flex flex-col" style={pageContentStyle}>
                {content}
            </div>
            {typeof pageIndex === 'number' && typeof totalPages === 'number' && (
                <div
                    className="cv-footer page-number-indicator flex items-center justify-between"
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: `${MARGIN_LEFT}mm`,
                        right: `${MARGIN_RIGHT}mm`,
                        height: `${MARGIN_BOTTOM}mm`,
                        fontSize: '8pt',
                        color: '#64748b',
                        fontFamily: 'Arial, sans-serif',
                        textAlign: 'left',
                        pointerEvents: 'none',
                        zIndex: 15,
                    }}
                >
                    <span className="cv-attribution">{ATTRIBUTION_TEXT}</span>
                    <span className="cv-page-number">
                        {pageIndex + 1} of {totalPages}
                    </span>
                </div>
            )}
        </div>
    );

    if (!data || Object.keys(data).length === 0) {
        return (
            <div className="cv-preview-empty flex h-full items-center justify-center">
                <p className="text-gray-500">Preview CV will appear here</p>
            </div>
        );
    }

    return (
        <div
            className={`cv-container relative mx-auto flex flex-col items-center justify-center ${!isPdfMode ? 'bg-gray-100' : ''}`}
            style={{ maxWidth: '100%' }}
        >
            <style dangerouslySetInnerHTML={{ __html: pageBreakStyle }} />

            {!isPdfMode && showZoomControls && (
                <div className="zoom-controls absolute top-3 right-3 z-10 flex items-center gap-2 rounded-lg bg-white p-2 shadow-md">
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
                    <span className="ml-2 rounded-md bg-gray-100 px-2 py-1 text-sm font-bold">{zoomLevel}%</span>
                    <button
                        onClick={toggleZoomControls}
                        className="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
                        title="Hide Zoom Control"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                        </svg>
                    </button>
                </div>
            )}

            {!isPdfMode && !showZoomControls && (
                <button
                    onClick={toggleZoomControls}
                    className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-100"
                    title="Show Zoom Control"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                    </svg>
                </button>
            )}

            {/* Offscreen exact-width measurement surface without zoom or transitions */}
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    top: '-99999px',
                    left: '-99999px',
                    width: `${CONTENT_WIDTH_MM}mm`,
                    visibility: 'hidden',
                    pointerEvents: 'none',
                    zIndex: -1,
                }}
            >
                <div
                    ref={measurementRef}
                    className="cv-page-content flex flex-col"
                    style={{ ...pageContentStyle, width: '100%', minHeight: 'auto', paddingBottom: '0' }}
                >
                    {blocks.map((block) => (
                        <div key={block.key} data-cv-block-key={block.key} data-cv-kind={block.kind} className="cv-semantic-block">
                            {block.content}
                        </div>
                    ))}
                </div>
            </div>

            <div
                className="cv-multi-page-container"
                style={{
                    transform: !isPdfMode ? `scale(${(zoomLevel / 100) * 0.65})` : 'none',
                    transformOrigin: 'top center',
                    transition: 'transform 0.2s ease',
                }}
                ref={cvContentRef}
            >
                {activePageKeys.map((pageContentKeys, index) => (
                    <div key={`page-${index}`} className={`relative ${!isPdfMode ? 'mb-6' : 'm-0 p-0'}`}>
                        {createPage(
                            pageContentKeys.map((key) => {
                                if (key.startsWith('cont::')) {
                                    const parts = key.split('::');
                                    const originalKey = parts[1];
                                    const block = blockMap.get(originalKey);
                                    if (block && block.continuedContent) {
                                        return (
                                            <div
                                                key={key}
                                                data-cv-block-key={key}
                                                data-cv-kind="item-heading-continued"
                                                className="cv-semantic-block"
                                            >
                                                {block.continuedContent}
                                            </div>
                                        );
                                    }
                                }
                                const block = blockMap.get(key);
                                if (!block) return null;
                                return (
                                    <div key={key} data-cv-block-key={key} data-cv-kind={block.kind} className="cv-semantic-block">
                                        {block.content}
                                    </div>
                                );
                            }),
                            index,
                            activePageKeys.length,
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CV;
