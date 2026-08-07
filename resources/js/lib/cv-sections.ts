import type { AddOnSectionKey, CVData, CVSectionKey, CVType, EnabledSections } from '@/types/cv';

export const SECTION_ORDER_BY_CV_TYPE: Record<CVType, CVSectionKey[]> = {
    professional: [
        'personal',
        'summary',
        'work_experience',
        'portfolios',
        'skills',
        'certifications',
        'education',
        'organizations',
        'languages',
        'additional_info',
    ],
    fresh_graduate: [
        'personal',
        'summary',
        'education',
        'organizations',
        'portfolios',
        'accomplishments',
        'skills',
        'certifications',
        'languages',
        'additional_info',
    ],
};

export const AVAILABLE_ADD_ONS_BY_CV_TYPE: Record<CVType, AddOnSectionKey[]> = {
    professional: ['portfolios', 'certifications', 'organizations', 'languages', 'additional_info'],
    fresh_graduate: ['organizations', 'portfolios', 'accomplishments', 'certifications', 'languages', 'additional_info'],
};

export const ADD_ON_LABELS: Record<AddOnSectionKey, string> = {
    portfolios: 'Portfolio',
    certifications: 'Licenses & Certifications',
    accomplishments: 'Accomplishments',
    organizations: 'Organizations',
    languages: 'Languages',
    additional_info: 'Additional Information',
};

export const DEFAULT_ENABLED_SECTIONS: EnabledSections = {
    portfolios: false,
    certifications: false,
    accomplishments: false,
    organizations: false,
    languages: false,
    additional_info: false,
};

export function getEnabledSections(value: unknown): EnabledSections {
    if (!value || typeof value !== 'object') return { ...DEFAULT_ENABLED_SECTIONS };

    return Object.fromEntries(
        Object.keys(DEFAULT_ENABLED_SECTIONS).map((key) => [key, Boolean((value as Record<string, unknown>)[key])]),
    ) as EnabledSections;
}

export function hasMeaningfulSectionData(data: CVData, section: CVSectionKey): boolean {
    switch (section) {
        case 'work_experience':
            return data.work_experience.some((item) => Boolean(item.company || item.position || item.description));
        case 'accomplishments':
            return data.accomplishments?.some((item) => Boolean(item.description)) ?? false;
        default:
            return false;
    }
}
