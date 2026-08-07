export interface WorkExperience {
    company: string;
    company_location: string;
    position: string;
    location_type: string;
    start_date: string;
    end_date: string;
    description: string;
    is_current: boolean;
}

export interface Education {
    institution: string;
    degree: string;
    field: string;
    start_date: string;
    end_date: string;
    description: string;
}

export interface Skill {
    name: string;
}

export interface Portfolio {
    title: string;
    link: string;
    description: string;
}

export interface Certification {
    name: string;
    organization: string;
    start_year: string;
    end_year: string;
    is_time_limited?: boolean;
    description: string;
    credential_id?: string;
}

export interface Accomplishment {
    description: string;
}

export interface Organization {
    name: string;
    position: string;
    start_date: string;
    end_date: string;
    description: string;
    is_current?: boolean;
}

export interface Language {
    language: string;
    level?: string;
    has_certification: boolean;
    test_name?: string;
    issuing_organization?: string;
    score?: string;
    issue_date?: string;
    expiration_date?: string;
    is_time_limited: boolean;
}

export type CVType = 'professional' | 'fresh_graduate';

export type CVSectionKey =
    | 'personal'
    | 'summary'
    | 'work_experience'
    | 'education'
    | 'organizations'
    | 'portfolios'
    | 'accomplishments'
    | 'skills'
    | 'certifications'
    | 'languages'
    | 'additional_info';

export type AddOnSectionKey = 'portfolios' | 'certifications' | 'accomplishments' | 'organizations' | 'languages' | 'additional_info';

export type EnabledSections = Record<AddOnSectionKey, boolean>;

export interface CVCustomFields {
    is_use_photo?: boolean;
    photo_base64?: string | null;
    enabled_sections?: Partial<EnabledSections>;
}

export interface CVData {
    cv_type?: CVType;
    id?: string;
    user_id?: string;
    cv_name?: string | null;
    name: string;
    address: string;
    phone: string;
    email: string;
    linkedin?: string | null;
    summary: string;
    is_use_photo?: boolean;
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
    custom_fields?: CVCustomFields | null;
    created_at?: string;
    updated_at?: string;
}

export interface CvItem {
    id: string;
    cv_name?: string | null;
    name: string;
    email: string;
    created_at: string;
    updated_at: string;
}
