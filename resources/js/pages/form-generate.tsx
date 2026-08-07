import CV from '@/components/cv-format';
import FormProgress from '@/components/percentage';
import AppLayout from '@/layouts/layouts';
import { PAGE_WIDTH_MM } from '@/lib/cv-page-layout';
import {
    ADD_ON_LABELS,
    AVAILABLE_ADD_ONS_BY_CV_TYPE,
    getEnabledSections,
    hasMeaningfulSectionData,
    SECTION_ORDER_BY_CV_TYPE,
} from '@/lib/cv-sections';
import { sanitizeOklchColors } from '@/lib/utils';
import type { CVData, CVSectionKey, CVType } from '@/types/cv';
import { objectToFormData, type FormDataConvertible } from '@inertiajs/core';
import { Head, router, usePage } from '@inertiajs/react';
import { ChangeEvent, Children, FormEvent, isValidElement, ReactNode, useEffect, useRef, useState } from 'react';

type OrderedSectionKey = CVSectionKey | 'add_ons';

function OrderedSections({ order, children }: { order: OrderedSectionKey[]; children: ReactNode }) {
    const positions = new Map(order.map((key, index) => [key, index]));

    return (
        <>
            {Children.toArray(children).sort((left, right) => {
                const leftKey = isValidElement<{ 'data-section-key'?: OrderedSectionKey }>(left) ? left.props['data-section-key'] : undefined;
                const rightKey = isValidElement<{ 'data-section-key'?: OrderedSectionKey }>(right) ? right.props['data-section-key'] : undefined;
                return (positions.get(leftKey ?? 'personal') ?? 0) - (positions.get(rightKey ?? 'personal') ?? 0);
            })}
        </>
    );
}

const defaultFormData = {
    cv_type: 'professional' as CVType,
    cv_name: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    linkedin: '',
    summary: '',
    photo: null as File | null,
    is_use_photo: false,
    work_experience: [
        {
            company: '',
            company_location: '',
            position: '',
            location_type: '',
            start_date: '',
            end_date: '',
            description: '',
            is_current: false,
        },
    ],
    education: [
        {
            institution: '',
            degree: '',
            field: '',
            start_date: '',
            end_date: '',
            description: '',
        },
    ],
    skills: [{ name: '' }],
    portfolios: [{ title: '', link: '', description: '' }],
    certifications: [
        {
            name: '',
            organization: '',
            start_year: '',
            end_year: '',
            is_time_limited: false,
            description: '',
            credential_id: '',
        },
    ],
    languages: [
        {
            language: '',
            level: '',
            has_certification: false,
            test_name: '',
            issuing_organization: '',
            score: '',
            issue_date: '',
            expiration_date: '',
            is_time_limited: false,
        },
    ],
    accomplishments: [{ description: '' }],
    organizations: [
        {
            name: '',
            position: '',
            start_date: '',
            end_date: '',
            is_current: false,
            description: '',
        },
    ],
    additional_info: '',
};

const defaultAddOnSections = {
    portfolios: false,
    certifications: false,
    accomplishments: false,
    organizations: false,
    languages: false,
    additional_info: false,
};

function getInitialFormData() {
    try {
        const saved = localStorage.getItem('cvFormData');
        if (!saved) return defaultFormData;
        const parsed = JSON.parse(saved) as typeof defaultFormData;
        if (parsed.photo) parsed.photo = null;
        const workDefault = defaultFormData.work_experience[0];
        const eduDefault = defaultFormData.education[0];
        return {
            ...defaultFormData,
            ...parsed,
            cv_type: parsed.cv_type ?? 'professional',
            work_experience: (parsed.work_experience?.length ? parsed.work_experience : defaultFormData.work_experience).map(
                (item: typeof workDefault) => ({ ...workDefault, ...item }),
            ),
            education: (parsed.education?.length ? parsed.education : defaultFormData.education).map((item: typeof eduDefault) => ({
                ...eduDefault,
                ...item,
            })),
            skills: (parsed.skills?.length ? parsed.skills : defaultFormData.skills).map((s: { name: string }) => ({ name: s?.name ?? '' })),
            portfolios: (parsed.portfolios?.length ? parsed.portfolios : defaultFormData.portfolios).map(
                (p: { title: string; link: string; description: string }) => ({
                    title: p?.title ?? '',
                    link: p?.link ?? '',
                    description: p?.description ?? '',
                }),
            ),
            certifications: (parsed.certifications?.length ? parsed.certifications : defaultFormData.certifications).map(
                (c: (typeof defaultFormData.certifications)[0]) => ({ ...defaultFormData.certifications[0], ...c }),
            ),
            languages: (parsed.languages?.length ? parsed.languages : defaultFormData.languages).map((l: any) => ({
                language: l?.language ?? '',
                level: l?.level ?? '',
                has_certification: l?.has_certification ?? false,
                test_name: l?.test_name ?? '',
                issuing_organization: l?.issuing_organization ?? '',
                score: l?.score ?? '',
                issue_date: l?.issue_date ?? '',
                expiration_date: l?.expiration_date ?? '',
                is_time_limited: l?.is_time_limited ?? false,
            })),
            accomplishments: (parsed.accomplishments?.length ? parsed.accomplishments : defaultFormData.accomplishments).map(
                (a: { description: string }) => ({ description: a?.description ?? '' }),
            ),
            organizations: (parsed.organizations?.length ? parsed.organizations : defaultFormData.organizations).map(
                (o: (typeof defaultFormData.organizations)[0]) => ({ ...defaultFormData.organizations[0], ...o }),
            ),
        };
    } catch {
        return defaultFormData;
    }
}

function getInitialAddOnSections() {
    try {
        const saved = localStorage.getItem('cvAddOnSections');
        if (!saved) return getEnabledSections(defaultAddOnSections);
        return getEnabledSections(JSON.parse(saved));
    } catch {
        return getEnabledSections(defaultAddOnSections);
    }
}

function getInitialPhotoPreview(): string | null {
    try {
        const saved = localStorage.getItem('cvPhotoPreview');
        return saved && typeof saved === 'string' ? saved : null;
    } catch {
        return null;
    }
}

const PENDING_CV_SAVE_KEY = 'pendingCvSave';

function multipart(payload: Record<string, unknown>): FormData {
    return objectToFormData(payload as Record<string, FormDataConvertible>);
}

async function dataUrlToFile(dataUrl: string): Promise<File> {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    if (!['image/jpeg', 'image/png'].includes(blob.type)) {
        throw new Error('Invalid pending profile photo.');
    }

    return new File([blob], blob.type === 'image/png' ? 'profile.png' : 'profile.jpg', { type: blob.type });
}

type FormGenerateProps = {
    cv?: Record<string, unknown>;
    addOnSections?: Record<string, boolean>;
    isEdit?: boolean;
    cvId?: string;
};

function formDataFromCv(cv: Record<string, unknown>): typeof defaultFormData {
    const customFields = (cv.custom_fields as Record<string, unknown>) ?? {};
    const additionalInfo =
        typeof cv.additional_info === 'string'
            ? cv.additional_info
            : Array.isArray(cv.additional_info)
              ? (cv.additional_info as string[]).join('')
              : '';
    return {
        ...defaultFormData,
        cv_type: (cv.cv_type as CVType) ?? 'professional',
        cv_name: (cv.cv_name as string) ?? '',
        name: (cv.name as string) ?? '',
        address: (cv.address as string) ?? '',
        phone: (cv.phone as string) ?? '',
        email: (cv.email as string) ?? '',
        linkedin: (cv.linkedin as string) ?? '',
        summary: (cv.summary as string) ?? '',
        photo: null,
        is_use_photo: Boolean(customFields.is_use_photo),
        work_experience:
            Array.isArray(cv.work_experience) && (cv.work_experience as unknown[]).length
                ? (cv.work_experience as typeof defaultFormData.work_experience)
                : defaultFormData.work_experience,
        education:
            Array.isArray(cv.education) && (cv.education as unknown[]).length
                ? (cv.education as typeof defaultFormData.education)
                : defaultFormData.education,
        skills: Array.isArray(cv.skills) && (cv.skills as unknown[]).length ? (cv.skills as typeof defaultFormData.skills) : defaultFormData.skills,
        portfolios:
            Array.isArray(cv.portfolios) && (cv.portfolios as unknown[]).length
                ? (cv.portfolios as typeof defaultFormData.portfolios)
                : defaultFormData.portfolios,
        certifications:
            Array.isArray(cv.certifications) && (cv.certifications as unknown[]).length
                ? (cv.certifications as typeof defaultFormData.certifications)
                : defaultFormData.certifications,
        languages:
            Array.isArray(cv.languages) && (cv.languages as unknown[]).length
                ? (cv.languages as Array<Partial<(typeof defaultFormData.languages)[number]>>).map((language) => ({
                      ...defaultFormData.languages[0],
                      ...language,
                      issue_date: typeof language.issue_date === 'string' ? language.issue_date.slice(0, 7) : '',
                      expiration_date: typeof language.expiration_date === 'string' ? language.expiration_date.slice(0, 7) : '',
                  }))
                : defaultFormData.languages,
        accomplishments:
            Array.isArray(cv.accomplishments) && (cv.accomplishments as unknown[]).length
                ? (cv.accomplishments as typeof defaultFormData.accomplishments)
                : defaultFormData.accomplishments,
        organizations:
            Array.isArray(cv.organizations) && (cv.organizations as unknown[]).length
                ? (cv.organizations as typeof defaultFormData.organizations)
                : defaultFormData.organizations,
        additional_info: additionalInfo,
    };
}

export default function CvForm() {
    const { props } = usePage<{
        auth: { user: unknown };
        cv?: Record<string, unknown>;
        addOnSections?: Record<string, boolean>;
        isEdit?: boolean;
        cvId?: string;
    }>();
    const isGuest = !props.auth?.user;
    const isEdit = props.isEdit === true && props.cvId;
    const cvId = props.cvId as string | undefined;
    const initialFormData = props.cv ? formDataFromCv(props.cv) : getInitialFormData();
    const customFields = (props.cv?.custom_fields as Record<string, unknown> | undefined) ?? {};
    const initialAddOn = getEnabledSections(props.addOnSections ?? customFields.enabled_sections ?? getInitialAddOnSections());
    const initialPhoto = typeof props.cv?.photo_url === 'string' ? props.cv.photo_url : getInitialPhotoPreview();

    const [formData, setFormData] = useState(initialFormData);
    const [showPreview, setShowPreview] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return params.get('preview') === 'true';
        }
        return false;
    });
    const [pageLoaded, setPageLoaded] = useState(false);
    const [addOnSections, setAddOnSections] = useState(initialAddOn);
    const [photoPreview, setPhotoPreview] = useState<string | null>(initialPhoto);
    const [hasPersistedPhoto, setHasPersistedPhoto] = useState(Boolean(props.cv?.has_photo));
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [showLoginSaveModal, setShowLoginSaveModal] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [pendingCVType, setPendingCVType] = useState<CVType | null>(null);

    const fieldGroups = {
        personal: {
            label: 'Personal Information',
            fields: ['name', 'address', 'phone', 'email', 'linkedin', 'photo', 'is_use_photo'],
            requiredFields: ['name', 'address', 'phone', 'email'],
        },
        summary: {
            label: 'Summary',
            fields: ['summary'],
            requiredFields: ['summary'],
        },
        work_experience: {
            label: 'Professional Experience',
            fields: ['company', 'company_location', 'location_type', 'position', 'start_date', 'end_date', 'description'],
            isArray: true,
            requiredFields: ['company', 'company_location', 'location_type', 'position', 'start_date', 'end_date', 'description'],
        },
        education: {
            label: 'Education',
            fields: ['institution', 'degree', 'field', 'start_date', 'end_date', 'description'],
            isArray: true,
            requiredFields: ['institution', 'start_date', 'end_date', 'field'],
        },
        skills: {
            label: 'Skills',
            fields: ['name'],
            isArray: true,
            requiredFields: ['name'],
        },
        portfolios: {
            label: 'Portfolios',
            fields: ['title', 'link', 'description'],
            isArray: true,
            requiredFields: ['title', 'link', 'description'],
        },
        accomplishments: {
            label: 'Accomplishments',
            fields: ['description'],
            isArray: true,
            requiredFields: ['description'],
        },
        certifications: {
            label: 'Licenses & Certifications',
            fields: ['name', 'organization', 'start_year', 'end_year', 'description', 'credential_id'],
            isArray: true,
            requiredFields: ['name', 'organization', 'start_year'],
        },
        languages: {
            label: 'Languages',
            fields: ['language', 'test_name', 'issuing_organization', 'score', 'issue_date', 'expiration_date'],
            isArray: true,
            requiredFields: ['language'],
        },
        organizations: {
            label: 'Organizations',
            fields: ['name', 'position', 'start_date', 'end_date', 'description'],
            isArray: true,
            requiredFields: ['name', 'position', 'start_date', 'description'],
        },
        additional_info: {
            label: 'Additional Information',
            fields: ['additional_info'],
            requiredFields: ['additional_info'],
        },
    };
    const [formTouched, setFormTouched] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const cvRef = useRef<HTMLDivElement>(null);

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
        const cleanNumber = phone.replace(/\D/g, '');
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

    const cleanupAllOverlays = () => {
        try {
            const allOverlays = document.querySelectorAll('[id*="pdf-loading-overlay"]');
            allOverlays.forEach((overlay) => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            });
        } catch (error) {
            console.error('Error cleaning up overlays:', error);
        }
    };

    useEffect(() => {
        setTimeout(() => setPageLoaded(true), 100);

        if (
            !formTouched &&
            (formData.name ||
                formData.email ||
                formData.phone ||
                formData.work_experience.some((exp) => exp.company || exp.position) ||
                formData.education.some((edu) => edu.institution || edu.degree) ||
                formData.skills.length > 0)
        ) {
            setFormTouched(true);
        }

        return () => cleanupAllOverlays();
    }, []);

    useEffect(() => {
        if (isEdit) return;

        try {
            const formDataToSave = { ...formData };

            if (formDataToSave.photo) {
                formDataToSave.photo = null;
            }

            localStorage.setItem('cvFormData', JSON.stringify(formDataToSave));
            localStorage.setItem('cvAddOnSections', JSON.stringify(addOnSections));

            if (photoPreview) {
                localStorage.setItem('cvPhotoPreview', photoPreview);
            }
        } catch (error) {
            console.error('Error saving form data to localStorage:', error);
        }
    }, [formData, addOnSections, photoPreview]);

    useEffect(() => {
        if (!props.auth?.user || localStorage.getItem(PENDING_CV_SAVE_KEY) !== 'true') return;

        const rawForm = localStorage.getItem('cvFormData');
        const rawPhoto = localStorage.getItem('cvPhotoPreview');
        if (!rawForm) {
            localStorage.removeItem(PENDING_CV_SAVE_KEY);
            return;
        }

        const persistPendingCV = async () => {
            let payload: Record<string, unknown>;
            try {
                const parsed = JSON.parse(rawForm) as Record<string, unknown>;
                const { photo: _p, ...rest } = parsed;
                payload = {
                    ...rest,
                    custom_fields: {
                        is_use_photo: parsed.is_use_photo ?? false,
                        enabled_sections: getEnabledSections(JSON.parse(localStorage.getItem('cvAddOnSections') ?? '{}')),
                    },
                };
                if (rawPhoto) payload.photo = await dataUrlToFile(rawPhoto);
            } catch {
                localStorage.removeItem(PENDING_CV_SAVE_KEY);
                return;
            }

            const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.getAttribute('content');
            fetch(route('cvs.store'), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    ...(token ? { 'X-CSRF-TOKEN': token } : {}),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: multipart(payload),
                credentials: 'same-origin',
            })
                .then(async (res) => {
                    if (res.ok) {
                        const data = await res.json();
                        localStorage.removeItem(PENDING_CV_SAVE_KEY);
                        localStorage.removeItem('cvFormData');
                        localStorage.removeItem('cvAddOnSections');
                        localStorage.removeItem('cvPhotoPreview');
                        setSaveMessage({ type: 'success', text: 'CV saved to your account.' });

                        if (data && data.id) {
                            router.visit(route('cvs.edit', data.id));
                        }
                    } else {
                        localStorage.removeItem(PENDING_CV_SAVE_KEY);
                        setSaveMessage({ type: 'error', text: 'Failed to save CV. Please try again.' });
                    }
                })
                .catch(() => {
                    localStorage.removeItem(PENDING_CV_SAVE_KEY);
                    setSaveMessage({ type: 'error', text: 'Failed to save CV. Please try again.' });
                });
        };

        void persistPendingCV();
    }, [props.auth?.user]);

    useEffect(() => {
        if (!saveMessage) return;
        const t = setTimeout(() => setSaveMessage(null), 4000);
        return () => clearTimeout(t);
    }, [saveMessage]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            cleanupAllOverlays();
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                cleanupAllOverlays();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            cleanupAllOverlays();
        };
    }, []);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData({
            ...formData,
            [name]: checked,
        });
    };

    const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                alert('Please select a valid image file (JPEG, PNG, JPG)');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('Profile photo must not exceed 5MB');
                return;
            }

            setFormData({
                ...formData,
                photo: file,
            });

            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    if (ctx) {
                        const size = Math.min(img.width, img.height);

                        canvas.width = size;
                        canvas.height = size;

                        const offsetX = (img.width - size) / 2;
                        const offsetY = (img.height - size) / 2;

                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, size, size);

                        ctx.beginPath();
                        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
                        ctx.closePath();
                        ctx.clip();

                        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);

                        const dataUrl = canvas.toDataURL(file.type);
                        setPhotoPreview(dataUrl);
                        localStorage.setItem('cvPhotoPreview', dataUrl);
                    } else {
                        setPhotoPreview(reader.result as string);
                        localStorage.setItem('cvPhotoPreview', reader.result as string);
                    }
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleArrayChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
        index: number,
        arrayName: keyof typeof formData,
    ) => {
        const { name, value } = e.target;
        const updatedArray = [...(formData[arrayName] as any[])];
        updatedArray[index] = {
            ...updatedArray[index],
            [name]: value,
        };

        setFormData({
            ...formData,
            [arrayName]: updatedArray,
        });
    };

    const updateLanguage = (index: number, updates: Partial<(typeof defaultFormData.languages)[number]>) => {
        setFormData((current) => ({
            ...current,
            languages: current.languages.map((language, languageIndex) => (languageIndex === index ? { ...language, ...updates } : language)),
        }));
    };

    const addArrayItem = (arrayName: keyof typeof formData, emptyItem: any) => {
        const currentArray = [...(formData[arrayName] as any[])] as any[];
        setFormData({
            ...formData,
            [arrayName]: [...currentArray, emptyItem],
        });
    };

    const removeArrayItem = (arrayName: keyof typeof formData, index: number) => {
        const updatedArray = [...(formData[arrayName] as any[])];
        updatedArray.splice(index, 1);

        setFormData({
            ...formData,
            [arrayName]: updatedArray,
        });
    };

    const handleGeneratePDF = async () => {
        if (!cvRef.current) {
            alert('CV not ready for export. Please try again.');
            return;
        }

        setIsGeneratingPDF(true);

        try {
            if (typeof document !== 'undefined' && 'fonts' in document) {
                try {
                    await document.fonts.ready;
                } catch (e) {
                    // ignore font ready errors
                }
            }

            const images = Array.from(cvRef.current.querySelectorAll('img'));
            await Promise.all(
                images.map(async (img) => {
                    if (!img.complete) {
                        await new Promise((resolve) => {
                            img.onload = resolve;
                            img.onerror = resolve;
                        });
                    }
                    if (img.decode) {
                        try {
                            await img.decode();
                        } catch (e) {
                            // ignore decode errors
                        }
                    }
                }),
            );

            await new Promise((resolve) => setTimeout(resolve, 300));

            const rawName = formData.cv_name || formData.name || 'cv';
            const safeName =
                rawName
                    .replace(/[^a-z0-9_\-.]/gi, '_')
                    .replace(/_+/g, '_')
                    .replace(/^_|_$/g, '') || 'cv';
            const filename = `${safeName}.pdf`;

            const opt = {
                margin: 0,
                filename: filename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    onclone: sanitizeOklchColors,
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait',
                },
            };

            const html2pdfModule = await import('html2pdf.js');
            const html2pdf = html2pdfModule.default || html2pdfModule;
            await html2pdf().set(opt).from(cvRef.current).save();
            if (typeof window.gtag === 'function') {
                window.gtag('event', 'generate_pdf');
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('An error occurred while generating the PDF. Please try again.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleGeneratePDF();
    };

    const buildSavePayload = () => {
        const { photo: _p, ...rest } = formData;

        return {
            ...rest,
            ...(formData.photo ? { photo: formData.photo } : {}),
            custom_fields: {
                is_use_photo: formData.is_use_photo,
                enabled_sections: addOnSections,
            },
        };
    };

    const handleSaveUpdate = () => {
        if (!cvId) return;
        router.post(route('cvs.update', cvId), { ...buildSavePayload(), _method: 'put' }, { 
            forceFormData: true,
            onSuccess: () => {
                if (typeof window.gtag === 'function') {
                    window.gtag('event', 'save_cv');
                }
            }
        });
    };

    const handleSaveNewCV = () => {
        const payload = buildSavePayload();

        const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.getAttribute('content');
        fetch(route('cvs.store'), {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                ...(token ? { 'X-CSRF-TOKEN': token } : {}),
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: multipart(payload),
            credentials: 'same-origin',
        })
            .then(async (res) => {
                if (res.ok) {
                    const data = await res.json();
                    localStorage.removeItem('cvFormData');
                    localStorage.removeItem('cvAddOnSections');
                    localStorage.removeItem('cvPhotoPreview');
                    setSaveMessage({ type: 'success', text: 'CV saved to your account.' });

                    if (typeof window.gtag === 'function') {
                        window.gtag('event', 'save_cv');
                    }

                    if (data && data.id) {
                        router.visit(route('cvs.edit', data.id));
                    }
                } else {
                    setSaveMessage({ type: 'error', text: 'Failed to save CV. Please try again.' });
                }
            })
            .catch(() => {
                setSaveMessage({ type: 'error', text: 'Failed to save CV. Please try again.' });
            });
    };

    const clearSelectedPhoto = (preview: string | null = null) => {
        setFormData((current) => ({ ...current, photo: null, is_use_photo: preview ? current.is_use_photo : false }));
        setPhotoPreview(preview);
        if (!preview) localStorage.removeItem('cvPhotoPreview');
    };

    const handleDeletePhoto = async () => {
        if (formData.photo) {
            clearSelectedPhoto(hasPersistedPhoto && typeof props.cv?.photo_url === 'string' ? props.cv.photo_url : null);
            return;
        }

        if (!hasPersistedPhoto || !cvId) {
            clearSelectedPhoto();
            return;
        }

        if (!window.confirm('Delete this profile photo permanently?')) return;

        const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.getAttribute('content');
        try {
            const response = await fetch(route('cvs.photo.destroy', cvId), {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    ...(token ? { 'X-CSRF-TOKEN': token } : {}),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            if (!response.ok) throw new Error('Photo deletion failed.');

            setHasPersistedPhoto(false);
            clearSelectedPhoto();
        } catch {
            setSaveMessage({ type: 'error', text: 'Failed to delete photo. Please try again.' });
        }
    };

    const togglePreview = () => {
        const newValue = !showPreview;
        setShowPreview(newValue);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            if (newValue) {
                url.searchParams.set('preview', 'true');
            } else {
                url.searchParams.delete('preview');
            }
            window.history.replaceState({}, '', url.toString());
        }
    };

    const handleAddOnChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setAddOnSections((current) => ({ ...current, [name]: checked }));
    };

    const applyCVType = (cvType: CVType) => {
        setFormData((current) => ({ ...current, cv_type: cvType }));
        setPendingCVType(null);
    };

    const requestCVTypeChange = (cvType: CVType) => {
        if (cvType === formData.cv_type) return;
        const hiddenSection: CVSectionKey = cvType === 'fresh_graduate' ? 'work_experience' : 'accomplishments';
        if (hasMeaningfulSectionData(formData as CVData, hiddenSection)) {
            setPendingCVType(cvType);
            return;
        }
        applyCVType(cvType);
    };

    useEffect(() => {
        const newInitialFormData = props.cv ? formDataFromCv(props.cv) : getInitialFormData();
        setFormData(newInitialFormData);
        const customFields = (props.cv?.custom_fields as Record<string, unknown> | undefined) ?? {};
        setAddOnSections(getEnabledSections(props.addOnSections ?? customFields.enabled_sections ?? getInitialAddOnSections()));
        setPhotoPreview(typeof props.cv?.photo_url === 'string' ? props.cv.photo_url : getInitialPhotoPreview());
        setHasPersistedPhoto(Boolean(props.cv?.has_photo));
    }, [props.cvId]);

    return (
        <AppLayout>
            <Head title={isEdit ? `Edit CV - ${formData.name || 'CV'}` : 'Form - CV Generator'} />

            <div className="bg-gray-50 py-8 md:py-16 dark:bg-gray-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {!isEdit && (
                        <div
                            className="mb-8 text-center transition-all duration-700"
                            style={{
                                opacity: pageLoaded ? 1 : 0,
                                transform: `translateY(${pageLoaded ? 0 : 50}px)`,
                            }}
                        >
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Create Your <span className="text-red-600">Professional CV</span>
                            </h1>
                            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Complete the following form to create a professional CV</p>
                        </div>
                    )}

                    <div
                        className="flex flex-col gap-6 transition-opacity duration-700 lg:flex-row lg:items-start"
                        style={{
                            opacity: pageLoaded ? 1 : 0,
                            transitionDelay: '0.2s',
                        }}
                    >
                        {/* Form Section */}
                        <div className={`${showPreview ? 'lg:w-1/2' : 'w-full'} transition-all duration-300`}>
                            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-700">
                                <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
                                    {!isGuest && (
                                        <button
                                            type="button"
                                            onClick={!isEdit ? handleSaveNewCV : handleSaveUpdate}
                                            className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-xs font-semibold tracking-widest text-white uppercase shadow-sm transition hover:bg-red-500 focus:border-red-700 focus:ring focus:ring-red-300 focus:outline-none active:bg-red-700 disabled:opacity-50"
                                        >
                                            Save CV
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={togglePreview}
                                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-xs font-semibold tracking-widest text-gray-900 uppercase shadow-sm transition hover:bg-gray-300 focus:ring focus:ring-gray-300 focus:outline-none active:bg-gray-400 disabled:opacity-50 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                                    >
                                        {showPreview ? 'Close Preview' : 'Preview CV'}
                                    </button>
                                </div>

                                {/* Komponen Progress Form */}
                                {formTouched && (
                                    <FormProgress
                                        formData={formData}
                                        fieldGroups={fieldGroups}
                                        addOnSections={addOnSections}
                                        sectionOrder={SECTION_ORDER_BY_CV_TYPE[formData.cv_type]}
                                    />
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-6">
                                        <label htmlFor="cv_name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            CV Name
                                        </label>
                                        <input
                                            type="text"
                                            id="cv_name"
                                            name="cv_name"
                                            value={formData.cv_name}
                                            onChange={handleChange}
                                            placeholder="e.g. CV for Google, Frontend 2024"
                                            className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                    <fieldset className="mb-8">
                                        <legend className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">CV Type</legend>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <label className="flex cursor-pointer gap-3 rounded-md border border-gray-300 p-4 dark:border-gray-600">
                                                <input
                                                    type="radio"
                                                    name="cv_type"
                                                    value="professional"
                                                    aria-label="Professional — I have professional experience"
                                                    checked={formData.cv_type === 'professional'}
                                                    onChange={() => requestCVTypeChange('professional')}
                                                    className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500"
                                                />
                                                <span>
                                                    <span className="block font-medium text-gray-900 dark:text-white">Professional</span>
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">I have professional experience</span>
                                                </span>
                                            </label>
                                            <label className="flex cursor-pointer gap-3 rounded-md border border-gray-300 p-4 dark:border-gray-600">
                                                <input
                                                    type="radio"
                                                    name="cv_type"
                                                    value="fresh_graduate"
                                                    aria-label="Fresh Graduate / Career Switcher / Student — I do not want to feature professional experience"
                                                    checked={formData.cv_type === 'fresh_graduate'}
                                                    onChange={() => requestCVTypeChange('fresh_graduate')}
                                                    className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500"
                                                />
                                                <span>
                                                    <span className="block font-medium text-gray-900 dark:text-white">
                                                        Fresh Graduate / Career Switcher / Student
                                                    </span>
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                                        I do not want to feature professional experience
                                                    </span>
                                                </span>
                                            </label>
                                        </div>
                                    </fieldset>
                                    <OrderedSections order={['add_ons', ...SECTION_ORDER_BY_CV_TYPE[formData.cv_type]]}>
                                        {/* Personal Information */}
                                        <div data-section-key="personal" className="mb-8">
                                            <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900 dark:border-gray-600 dark:text-white">
                                                Personal Information
                                            </h2>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div className="mb-4">
                                                    <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Full Name <span className="text-red-600">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="name"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleChange}
                                                        className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                        required
                                                    />
                                                </div>

                                                <div className="mb-4">
                                                    <label
                                                        htmlFor="email"
                                                        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                                    >
                                                        Email <span className="text-red-600">*</span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        id="email"
                                                        name="email"
                                                        value={formData.email}
                                                        placeholder="eg: example@gmail.com"
                                                        onChange={handleChange}
                                                        className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                        required
                                                    />
                                                </div>

                                                <div className="mb-4">
                                                    <label
                                                        htmlFor="phone"
                                                        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                                    >
                                                        Phone Number <span className="text-red-600">*</span>
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        id="phone"
                                                        name="phone"
                                                        value={formData.phone}
                                                        placeholder="eg: +628123456789"
                                                        onChange={handleChange}
                                                        className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                        required
                                                    />
                                                </div>

                                                <div className="mb-4">
                                                    <label
                                                        htmlFor="linkedin"
                                                        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                                    >
                                                        LinkedIn (optional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="linkedin"
                                                        name="linkedin"
                                                        value={formData.linkedin}
                                                        placeholder="linkedin.com/in/your-name"
                                                        onChange={handleChange}
                                                        className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <label
                                                    htmlFor="address"
                                                    className="mb-1 block flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
                                                >
                                                    Address <span className="text-red-600">*</span>
                                                    <div className="group relative ml-1">
                                                        <div className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-gray-300 text-xs text-gray-700 dark:bg-gray-600 dark:text-gray-300">
                                                            ?
                                                        </div>
                                                        <div className="invisible absolute bottom-full left-0 z-10 mb-2 w-64 rounded border border-gray-200 bg-white p-2 text-xs text-gray-700 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                            Recommendation: To protect your personal information, specify only your city and country
                                                            rather than providing a complete address.
                                                        </div>
                                                    </div>
                                                </label>
                                                <input
                                                    type="text"
                                                    id="address"
                                                    name="address"
                                                    value={formData.address}
                                                    placeholder="eg: Central Jakarta, Indonesia"
                                                    onChange={handleChange}
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                    required
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <div className="mb-2 flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id="is_use_photo"
                                                        name="is_use_photo"
                                                        checked={formData.is_use_photo}
                                                        onChange={handleCheckboxChange}
                                                        className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                    />
                                                    <label
                                                        htmlFor="is_use_photo"
                                                        className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                                    >
                                                        Include Profile Photo
                                                    </label>
                                                </div>

                                                {(formData.is_use_photo || photoPreview) && (
                                                    <div>
                                                        <label
                                                            htmlFor="photo"
                                                            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                                        >
                                                            Profile Photo
                                                        </label>
                                                        <div className="flex items-start space-x-4">
                                                            <div className="flex-1">
                                                                <input
                                                                    type="file"
                                                                    id="photo"
                                                                    name="photo"
                                                                    accept="image/png, image/jpeg, image/jpg"
                                                                    onChange={handlePhotoChange}
                                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                />
                                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                                    Accepted formats: JPG, JPEG, PNG. Max size: 5MB
                                                                </p>
                                                            </div>
                                                            {photoPreview && (
                                                                <div className="flex flex-shrink-0 gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowPhotoModal(true)}
                                                                        className="w-full rounded-md bg-green-600 px-3 py-2 text-sm text-white transition-colors hover:bg-green-300 dark:bg-green-600 dark:text-gray-200 dark:hover:bg-green-500"
                                                                    >
                                                                        See Photo
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleDeletePhoto}
                                                                        className="w-full rounded-md bg-red-600 px-3 py-2 text-sm text-white transition-colors hover:bg-red-500"
                                                                    >
                                                                        Delete Photo
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div data-section-key="summary" className="mb-8">
                                            <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900 dark:border-gray-600 dark:text-white">
                                                Summary
                                            </h2>
                                            <label htmlFor="summary" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Professional Summary <span className="text-red-600">*</span>
                                            </label>
                                            <textarea
                                                id="summary"
                                                name="summary"
                                                value={formData.summary}
                                                placeholder="Summarize your professional identity, notable expertise, and where you're headed in your career (50-100 words)"
                                                onChange={handleChange}
                                                onKeyDown={(e) => {
                                                    if (e.key === ' ' && e.currentTarget.value.endsWith('-')) {
                                                        e.preventDefault();
                                                        setFormData({ ...formData, summary: e.currentTarget.value.slice(0, -1) + '• ' });
                                                    }
                                                }}
                                                rows={4}
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                required
                                            />
                                            <div className="mt-1 flex justify-end">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    words : {formData.summary.trim() ? formData.summary.trim().split(/\s+/).length : 0}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Professional Experience */}
                                        {formData.cv_type === 'professional' && (
                                            <div data-section-key="work_experience" className="mb-8">
                                                <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900 dark:border-gray-600 dark:text-white">
                                                    Professional Experience
                                                    <span className="ml-1 inline-flex items-center">
                                                        <div className="group relative ml-1">
                                                            <div className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-gray-300 text-xs text-gray-700 dark:bg-gray-600 dark:text-gray-300">
                                                                ?
                                                            </div>
                                                            <div className="invisible absolute bottom-full left-0 z-10 mb-2 w-64 rounded border border-gray-200 bg-white p-2 text-xs text-gray-700 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                                Tip: Always arrange professional experience with your current/most recent position
                                                                first
                                                            </div>
                                                        </div>
                                                    </span>
                                                </h2>

                                                {formData.work_experience.map((exp, index) => (
                                                    <div key={index} className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-600">
                                                        <div className="mb-2 flex justify-between">
                                                            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                                                                Experience #{index + 1}
                                                            </h3>
                                                            {formData.work_experience.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeArrayItem('work_experience', index)}
                                                                    className="text-red-600 hover:text-red-800"
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                            <div className="mb-3">
                                                                <label
                                                                    htmlFor={`company_${index}`}
                                                                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                                                >
                                                                    Company Name <span className="text-red-600">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    id={`company_${index}`}
                                                                    name="company"
                                                                    value={exp.company}
                                                                    onChange={(e) => handleArrayChange(e, index, 'work_experience')}
                                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                    required
                                                                />
                                                            </div>

                                                            <div className="mb-3">
                                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    Company Location <span className="text-red-600">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    name="company_location"
                                                                    value={exp.company_location}
                                                                    placeholder="eg: Central Jakarta"
                                                                    onChange={(e) => handleArrayChange(e, index, 'work_experience')}
                                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                    required
                                                                />
                                                            </div>

                                                            <div className="mb-3">
                                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    Position <span className="text-red-600">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    name="position"
                                                                    value={exp.position}
                                                                    placeholder="eg: Software Engineer"
                                                                    onChange={(e) => handleArrayChange(e, index, 'work_experience')}
                                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                    required
                                                                />
                                                            </div>

                                                            <div className="mb-3">
                                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    Location Type <span className="text-red-600">*</span>
                                                                </label>
                                                                <select
                                                                    name="location_type"
                                                                    value={exp.location_type}
                                                                    onChange={(e) => handleArrayChange(e, index, 'work_experience')}
                                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                    required
                                                                >
                                                                    <option value="">Please select</option>
                                                                    <option value="On-site">On-site</option>
                                                                    <option value="Hybrid">Hybrid</option>
                                                                    <option value="Remote">Remote</option>
                                                                </select>
                                                            </div>

                                                            <div className="mb-3">
                                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    Start Date <span className="text-red-600">*</span>
                                                                </label>
                                                                <input
                                                                    type="month"
                                                                    name="start_date"
                                                                    value={exp.start_date}
                                                                    onChange={(e) => handleArrayChange(e, index, 'work_experience')}
                                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                    required
                                                                />
                                                            </div>

                                                            <div className="mb-3">
                                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    End Date <span className="text-red-600">*</span>
                                                                </label>
                                                                <input
                                                                    type="month"
                                                                    name="end_date"
                                                                    value={exp.end_date}
                                                                    onChange={(e) => handleArrayChange(e, index, 'work_experience')}
                                                                    className={`w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white ${exp.is_current ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' : ''}`}
                                                                    required={!exp.is_current}
                                                                    disabled={exp.is_current}
                                                                />
                                                                {exp.is_current && (
                                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                                        I am currently working in this role
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="mb-3 flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`is_current_${index}`}
                                                                    name="is_current"
                                                                    checked={exp.is_current || false}
                                                                    onChange={(e) => {
                                                                        const newWorkExperience = [...formData.work_experience];
                                                                        newWorkExperience[index] = {
                                                                            ...newWorkExperience[index],
                                                                            is_current: e.target.checked,
                                                                        };

                                                                        if (e.target.checked) {
                                                                            newWorkExperience[index].end_date = '';
                                                                        }

                                                                        setFormData({
                                                                            ...formData,
                                                                            work_experience: newWorkExperience,
                                                                        });
                                                                    }}
                                                                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                                />
                                                                <label
                                                                    htmlFor={`is_current_${index}`}
                                                                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                                                                >
                                                                    I am currently working in this role
                                                                </label>
                                                            </div>
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                Description <span className="text-red-600">*</span>
                                                            </label>
                                                            <textarea
                                                                name="description"
                                                                value={exp.description}
                                                                placeholder="Describe your key responsibilities, achievements, and skills gained in this role (use bullet points for better readability)"
                                                                onChange={(e) => handleArrayChange(e, index, 'work_experience')}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === ' ' && e.currentTarget.value.endsWith('-')) {
                                                                        e.preventDefault();
                                                                        const updatedValue = e.currentTarget.value.slice(0, -1) + '• ';
                                                                        const updatedArray = [...formData.work_experience];
                                                                        updatedArray[index] = {
                                                                            ...updatedArray[index],
                                                                            description: updatedValue,
                                                                        };
                                                                        setFormData({
                                                                            ...formData,
                                                                            work_experience: updatedArray,
                                                                        });
                                                                    }
                                                                }}
                                                                rows={3}
                                                                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                ))}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        addArrayItem('work_experience', {
                                                            company: '',
                                                            company_location: '',
                                                            position: '',
                                                            location_type: '',
                                                            start_date: '',
                                                            end_date: '',
                                                            description: '',
                                                            is_current: false,
                                                        })
                                                    }
                                                    className="mt-2 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                                >
                                                    <svg
                                                        className="mr-2 -ml-1 h-5 w-5 text-gray-500 dark:text-gray-400"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    Add Professional Experience
                                                </button>
                                            </div>
                                        )}

                                        {/* Education */}
                                        <div data-section-key="education" className="mb-8">
                                            <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900 dark:border-gray-600 dark:text-white">
                                                Education
                                                <span className="ml-1 inline-flex items-center">
                                                    <div className="group relative ml-1">
                                                        <div className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-gray-300 text-xs text-gray-700 dark:bg-gray-600 dark:text-gray-300">
                                                            ?
                                                        </div>
                                                        <div className="invisible absolute bottom-full left-0 z-10 mb-2 w-64 rounded border border-gray-200 bg-white p-2 text-xs text-gray-700 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                            Tip: List your education in reverse chronological order (most recent degree first)
                                                        </div>
                                                    </div>
                                                </span>
                                            </h2>

                                            {formData.education.map((edu, index) => (
                                                <div key={index} className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-600">
                                                    <div className="mb-2 flex justify-between">
                                                        <h3 className="text-lg font-medium text-gray-800 dark:text-white">Education #{index + 1}</h3>
                                                        {formData.education.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeArrayItem('education', index)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                        <div className="mb-3">
                                                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                Institution <span className="text-red-600">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="institution"
                                                                value={edu.institution}
                                                                placeholder="eg: University of Indonesia"
                                                                onChange={(e) => handleArrayChange(e, index, 'education')}
                                                                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                required
                                                            />
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                Degree
                                                            </label>
                                                            <select
                                                                name="degree"
                                                                value={edu.degree}
                                                                onChange={(e) => handleArrayChange(e, index, 'education')}
                                                                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                            >
                                                                <option value="">Please select</option>
                                                                <option value="Doctoral Degree">Doctoral Degree (PhD)</option>
                                                                <option value="Master's Degree">Master's Degree</option>
                                                                <option value="Bachelor's Degree">Bachelor's Degree</option>
                                                                <option value="Associate Degree">Associate Degree</option>
                                                                <option value="Professional Certification">Professional Certification</option>
                                                                <option value="High School Diploma">High School Diploma</option>
                                                                <option value="Vocational School">Vocational School</option>
                                                                <option value="Middle School">Middle School</option>
                                                                <option value="Elementary School">Elementary School</option>
                                                                <option value="Other">Other</option>
                                                            </select>
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                Field of Study <span className="text-red-600">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="field"
                                                                value={edu.field || ''}
                                                                placeholder="eg: Computer Science"
                                                                onChange={(e) => handleArrayChange(e, index, 'education')}
                                                                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                        <div className="mb-3">
                                                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                Start Date <span className="text-red-600">*</span>
                                                            </label>
                                                            <input
                                                                type="month"
                                                                name="start_date"
                                                                value={edu.start_date}
                                                                onChange={(e) => handleArrayChange(e, index, 'education')}
                                                                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                required
                                                            />
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                End Date (or expected) <span className="text-red-600">*</span>
                                                            </label>
                                                            <input
                                                                type="month"
                                                                name="end_date"
                                                                value={edu.end_date}
                                                                onChange={(e) => handleArrayChange(e, index, 'education')}
                                                                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="mb-3">
                                                        <label
                                                            htmlFor="address"
                                                            className="mb-1 block flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
                                                        >
                                                            Description <span className="text-red-600">*</span>
                                                            <div className="group relative ml-1">
                                                                <div className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-gray-300 text-xs text-gray-700 dark:bg-gray-600 dark:text-gray-300">
                                                                    ?
                                                                </div>
                                                                <div className="invisible absolute bottom-full left-0 z-10 mb-2 w-64 rounded border border-gray-200 bg-white p-2 text-xs text-gray-700 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                                    Tip :
                                                                    <ul className="mt-1 list-disc pl-4">
                                                                        <li>Only include GPA if it's impressive (typically 3.5/4.0 or higher)</li>
                                                                        <li>
                                                                            Include relevant coursework and academic projects that showcase skills
                                                                            applicable to the job
                                                                        </li>
                                                                        <li>
                                                                            Mention academic honors, scholarships, or awards to highlight your
                                                                            achievements
                                                                        </li>
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        </label>
                                                        <textarea
                                                            name="description"
                                                            value={edu.description}
                                                            placeholder="GPA, academic achievements, relevant coursework, honors, scholarships, etc. Use bullet points for better readability."
                                                            onChange={(e) => handleArrayChange(e, index, 'education')}
                                                            onKeyDown={(e) => {
                                                                if (e.key === ' ' && e.currentTarget.value.endsWith('-')) {
                                                                    e.preventDefault();
                                                                    const updatedValue = e.currentTarget.value.slice(0, -1) + '• ';
                                                                    const updatedArray = [...formData.education];
                                                                    updatedArray[index] = {
                                                                        ...updatedArray[index],
                                                                        description: updatedValue,
                                                                    };
                                                                    setFormData({
                                                                        ...formData,
                                                                        education: updatedArray,
                                                                    });
                                                                }
                                                            }}
                                                            rows={3}
                                                            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    addArrayItem('education', {
                                                        institution: '',
                                                        degree: '',
                                                        field: '',
                                                        start_date: '',
                                                        end_date: '',
                                                        description: '',
                                                    })
                                                }
                                                className="mt-2 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                            >
                                                <svg
                                                    className="mr-2 -ml-1 h-5 w-5 text-gray-500 dark:text-gray-400"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                Add Education
                                            </button>
                                        </div>

                                        {/* Skills */}
                                        <div data-section-key="skills" className="mb-8">
                                            <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900 dark:border-gray-600 dark:text-white">
                                                Skills
                                                <span className="ml-1 inline-flex items-center">
                                                    <div className="group relative ml-1">
                                                        <div className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-gray-300 text-xs text-gray-700 dark:bg-gray-600 dark:text-gray-300">
                                                            ?
                                                        </div>
                                                        <div className="invisible absolute bottom-full left-0 z-10 mb-2 w-64 rounded border border-gray-200 bg-white p-2 text-xs text-gray-700 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                            Tip: List your skills from the most relevant first
                                                        </div>
                                                    </div>
                                                </span>
                                            </h2>

                                            {formData.skills.map((skill, index) => (
                                                <div key={index} className="mb-4 flex items-center space-x-4">
                                                    <div className="flex-grow">
                                                        <input
                                                            type="text"
                                                            name="name"
                                                            value={skill.name}
                                                            placeholder="eg: JavaScript"
                                                            onChange={(e) => handleArrayChange(e, index, 'skills')}
                                                            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                            required
                                                        />
                                                    </div>

                                                    {formData.skills.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeArrayItem('skills', index)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-5 w-5"
                                                                viewBox="0 0 20 20"
                                                                fill="currentColor"
                                                            >
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => addArrayItem('skills', { name: '' })}
                                                className="mt-2 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                            >
                                                <svg
                                                    className="mr-2 -ml-1 h-5 w-5 text-gray-500 dark:text-gray-400"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                Add Skill
                                            </button>
                                        </div>

                                        <div data-section-key="add_ons" className="mb-8">
                                            <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900 dark:border-gray-600 dark:text-white">
                                                Add-ons
                                                <span className="ml-1 inline-flex items-center">
                                                    <div className="group relative ml-1">
                                                        <div className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-gray-300 text-xs text-gray-700 dark:bg-gray-600 dark:text-gray-300">
                                                            ?
                                                        </div>
                                                        <div className="invisible absolute bottom-full left-0 z-10 mb-2 w-64 rounded border border-gray-200 bg-white p-2 text-xs text-gray-700 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                            Select which additional sections to include in your CV
                                                        </div>
                                                    </div>
                                                </span>
                                            </h2>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                {AVAILABLE_ADD_ONS_BY_CV_TYPE[formData.cv_type].map((section) => (
                                                    <div key={section} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            id={section}
                                                            name={section}
                                                            checked={addOnSections[section]}
                                                            onChange={handleAddOnChange}
                                                            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                        />
                                                        <label htmlFor={section} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                            {ADD_ON_LABELS[section]}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 1. Portfolio section - muncul jika checkbox dicentang */}
                                        {addOnSections.portfolios && (
                                            <div data-section-key="portfolios" className="mb-8">
                                                <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900 dark:border-gray-600 dark:text-white">
                                                    Portfolio
                                                    <span className="ml-1 inline-flex items-center">
                                                        <div className="group relative ml-1">
                                                            <div className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-gray-300 text-xs text-gray-700 dark:bg-gray-600 dark:text-gray-300">
                                                                ?
                                                            </div>
                                                            <div className="invisible absolute bottom-full left-0 z-10 mb-2 w-64 rounded border border-gray-200 bg-white p-2 text-xs text-gray-700 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                                Include your best projects, websites, apps, or other work samples that showcase your
                                                                skills
                                                            </div>
                                                        </div>
                                                    </span>
                                                </h2>

                                                {formData.portfolios.map((portfolio, index) => (
                                                    <div key={index} className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-600">
                                                        <div className="mb-2 flex justify-between">
                                                            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                                                                Portfolio Item #{index + 1}
                                                            </h3>
                                                            {formData.portfolios.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeArrayItem('portfolios', index)}
                                                                    className="text-red-600 hover:text-red-800"
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                            <div className="mb-3">
                                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    Project Title <span className="text-red-600">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    name="title"
                                                                    value={portfolio.title}
                                                                    placeholder="eg: E-commerce app"
                                                                    onChange={(e) => handleArrayChange(e, index, 'portfolios')}
                                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                    required
                                                                />
                                                            </div>

                                                            <div className="mb-3">
                                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    Link
                                                                </label>
                                                                <input
                                                                    type="url"
                                                                    name="link"
                                                                    value={portfolio.link}
                                                                    placeholder="eg: example.com"
                                                                    onChange={(e) => handleArrayChange(e, index, 'portfolios')}
                                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                Description <span className="text-red-600">*</span>
                                                            </label>
                                                            <textarea
                                                                name="description"
                                                                value={portfolio.description}
                                                                placeholder="Describe the project, your role, technologies used, and key accomplishments. Use bullet points for better readability."
                                                                onChange={(e) => handleArrayChange(e, index, 'portfolios')}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === ' ' && e.currentTarget.value.endsWith('-')) {
                                                                        e.preventDefault();
                                                                        const updatedValue = e.currentTarget.value.slice(0, -1) + '• ';
                                                                        const updatedArray = [...formData.portfolios];
                                                                        updatedArray[index] = {
                                                                            ...updatedArray[index],
                                                                            description: updatedValue,
                                                                        };
                                                                        setFormData({
                                                                            ...formData,
                                                                            portfolios: updatedArray,
                                                                        });
                                                                    }
                                                                }}
                                                                rows={3}
                                                                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                ))}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        addArrayItem('portfolios', {
                                                            title: '',
                                                            link: '',
                                                            description: '',
                                                        })
                                                    }
                                                    className="mt-2 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                                >
                                                    <svg
                                                        className="mr-2 -ml-1 h-5 w-5 text-gray-500 dark:text-gray-400"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    Add Portfolio Item
                                                </button>
                                            </div>
                                        )}

                                        {/* 2. Certifications section - muncul jika checkbox dicentang */}
                                        {addOnSections.certifications && (
                                            <div data-section-key="certifications" className="mb-8">
                                                <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900 dark:border-gray-600 dark:text-white">
                                                    Licenses & Certifications
                                                </h2>

                                                {formData.certifications.map((cert, index) => (
                                                    <div key={index} className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-600">
                                                        <div className="mb-2 flex justify-between">
                                                            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                                                                License / Certification #{index + 1}
                                                            </h3>
                                                            {formData.certifications.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeArrayItem('certifications', index)}
                                                                    className="text-red-600 hover:text-red-800"
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                            <div className="mb-3">
                                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    Name <span className="text-red-600">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    name="name"
                                                                    value={cert.name}
                                                                    placeholder="e.g. AWS Certified Solutions Architect"
                                                                    onChange={(e) => handleArrayChange(e, index, 'certifications')}
                                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                    required
                                                                />
                                                            </div>

                                                            <div className="mb-3">
                                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    Issuing Organization <span className="text-red-600">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    name="organization"
                                                                    value={cert.organization}
                                                                    placeholder="e.g. Amazon Web Services"
                                                                    onChange={(e) => handleArrayChange(e, index, 'certifications')}
                                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                    required
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                            <div className="mb-3">
                                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    Issue Date <span className="text-red-600">*</span>
                                                                </label>
                                                                <input
                                                                    type="month"
                                                                    name="start_year"
                                                                    value={cert.start_year}
                                                                    onChange={(e) => handleArrayChange(e, index, 'certifications')}
                                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                    required
                                                                />
                                                            </div>

                                                            <div className="mb-3">
                                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    Expiration Date
                                                                </label>
                                                                <input
                                                                    type="month"
                                                                    name="end_year"
                                                                    value={cert.end_year}
                                                                    onChange={(e) => handleArrayChange(e, index, 'certifications')}
                                                                    className={`w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white ${!cert.is_time_limited ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' : ''}`}
                                                                    disabled={!cert.is_time_limited}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="mb-3 flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                id={`is_time_limited_${index}`}
                                                                name="is_time_limited"
                                                                checked={cert.is_time_limited || false}
                                                                onChange={(e) => {
                                                                    const newCertifications = [...formData.certifications];
                                                                    newCertifications[index] = {
                                                                        ...newCertifications[index],
                                                                        is_time_limited: e.target.checked,
                                                                    };
                                                                    setFormData({
                                                                        ...formData,
                                                                        certifications: newCertifications,
                                                                    });
                                                                }}
                                                                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                            />
                                                            <label
                                                                htmlFor={`is_time_limited_${index}`}
                                                                className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                                                            >
                                                                This certification has an expiration date
                                                            </label>
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                Credential ID
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="credential_id"
                                                                value={cert.credential_id}
                                                                placeholder="e.g. AWS-1234567890"
                                                                onChange={(e) => handleArrayChange(e, index, 'certifications')}
                                                                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        addArrayItem('certifications', {
                                                            name: '',
                                                            organization: '',
                                                            start_year: '',
                                                            end_year: '',
                                                            is_time_limited: false,
                                                            description: '',
                                                        })
                                                    }
                                                    className="mt-2 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                                >
                                                    <svg
                                                        className="mr-2 -ml-1 h-5 w-5 text-gray-500 dark:text-gray-400"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    Add License / Certification
                                                </button>
                                            </div>
                                        )}

                                        {/* 3. Accomplishments section - muncul jika checkbox dicentang */}
                                        {formData.cv_type === 'fresh_graduate' && addOnSections.accomplishments && (
                                            <div data-section-key="accomplishments" className="mb-8">
                                                <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900 dark:border-gray-600 dark:text-white">
                                                    Accomplishments
                                                    <span className="ml-1 inline-flex items-center">
                                                        <div className="group relative ml-1">
                                                            <div className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-gray-300 text-xs text-gray-700 dark:bg-gray-600 dark:text-gray-300">
                                                                ?
                                                            </div>
                                                            <div className="invisible absolute bottom-full left-0 z-10 mb-2 w-64 rounded border border-gray-200 bg-white p-2 text-xs text-gray-700 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                                Include awards, honors, publications, or any other notable achievements
                                                            </div>
                                                        </div>
                                                    </span>
                                                </h2>

                                                {formData.accomplishments.map((accomplishment, index) => (
                                                    <div key={index} className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-600">
                                                        <div className="mb-2 flex justify-between">
                                                            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                                                                Accomplishment #{index + 1}
                                                            </h3>
                                                            {formData.accomplishments.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeArrayItem('accomplishments', index)}
                                                                    className="text-red-600 hover:text-red-800"
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                            {/* <div className="mb-3">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Title <span className="text-red-600">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="title"
                                                                value={accomplishment.title}
                                                                placeholder="e.g. First Place in Hackathon, Published Research Paper"
                                                                onChange={(e) => handleArrayChange(e, index, 'accomplishments')}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                                required
                                                            />
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Date
                                                            </label>
                                                            <input
                                                                type="month"
                                                                name="date"
                                                                value={accomplishment.date}
                                                                onChange={(e) => handleArrayChange(e, index, 'accomplishments')}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                            />
                                                        </div> */}
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                Description <span className="text-red-600">*</span>
                                                            </label>
                                                            <textarea
                                                                name="description"
                                                                value={accomplishment.description}
                                                                placeholder="eg: Received Employee of the Month award for increasing team productivity by 25%. Use bullet points for better readability."
                                                                onChange={(e) => handleArrayChange(e, index, 'accomplishments')}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === ' ' && e.currentTarget.value.endsWith('-')) {
                                                                        e.preventDefault();
                                                                        const updatedValue = e.currentTarget.value.slice(0, -1) + '• ';
                                                                        const updatedArray = [...formData.accomplishments];
                                                                        updatedArray[index] = {
                                                                            ...updatedArray[index],
                                                                            description: updatedValue,
                                                                        };
                                                                        setFormData({
                                                                            ...formData,
                                                                            accomplishments: updatedArray,
                                                                        });
                                                                    }
                                                                }}
                                                                rows={3}
                                                                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                ))}

                                                <button
                                                    type="button"
                                                    onClick={() => addArrayItem('accomplishments', { description: '' })}
                                                    className="mt-2 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                                >
                                                    <svg
                                                        className="mr-2 -ml-1 h-5 w-5 text-gray-500 dark:text-gray-400"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    Add Accomplishment
                                                </button>
                                            </div>
                                        )}

                                        {/* 4. Organizations section - muncul jika checkbox dicentang */}
                                        {addOnSections.organizations && (
                                            <div data-section-key="organizations" className="mb-8">
                                                <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900 dark:border-gray-600 dark:text-white">
                                                    Organizations
                                                    <span className="ml-1 inline-flex items-center">
                                                        <div className="group relative ml-1">
                                                            <div className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-gray-300 text-xs text-gray-700 dark:bg-gray-600 dark:text-gray-300">
                                                                ?
                                                            </div>
                                                            <div className="invisible absolute bottom-full left-0 z-10 mb-2 w-64 rounded border border-gray-200 bg-white p-2 text-xs text-gray-700 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                                Include professional organizations, clubs, volunteer work, or community involvement
                                                            </div>
                                                        </div>
                                                    </span>
                                                </h2>

                                                {formData.organizations.map((org, index) => (
                                                    <div key={index} className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-600">
                                                        <div className="mb-2 flex justify-between">
                                                            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                                                                Organization #{index + 1}
                                                            </h3>
                                                            {formData.organizations.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeArrayItem('organizations', index)}
                                                                    className="text-red-600 hover:text-red-800"
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                            <div className="mb-3">
                                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    Organization Name <span className="text-red-600">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    name="name"
                                                                    value={org.name}
                                                                    placeholder="eg: IEEE"
                                                                    onChange={(e) => handleArrayChange(e, index, 'organizations')}
                                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                    required
                                                                />
                                                            </div>

                                                            <div className="mb-3">
                                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    Position <span className="text-red-600">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    name="position"
                                                                    value={org.position}
                                                                    placeholder="eg: Member"
                                                                    onChange={(e) => handleArrayChange(e, index, 'organizations')}
                                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                    required
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                            <div className="mb-3">
                                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    Start Date <span className="text-red-600">*</span>
                                                                </label>
                                                                <input
                                                                    type="month"
                                                                    name="start_date"
                                                                    value={org.start_date}
                                                                    onChange={(e) => handleArrayChange(e, index, 'organizations')}
                                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                    required
                                                                />
                                                            </div>

                                                            <div className="mb-3">
                                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    End Date
                                                                </label>
                                                                <input
                                                                    type="month"
                                                                    name="end_date"
                                                                    value={org.end_date}
                                                                    onChange={(e) => handleArrayChange(e, index, 'organizations')}
                                                                    className={`w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white ${org.is_current ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' : ''}`}
                                                                    disabled={org.is_current}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="mb-3 flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                id={`is_current_org_${index}`}
                                                                name="is_current"
                                                                checked={org.is_current || false}
                                                                onChange={(e) => {
                                                                    const newOrganizations = [...formData.organizations];
                                                                    newOrganizations[index] = {
                                                                        ...newOrganizations[index],
                                                                        is_current: e.target.checked,
                                                                    };
                                                                    setFormData({
                                                                        ...formData,
                                                                        organizations: newOrganizations,
                                                                    });
                                                                }}
                                                                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                            />
                                                            <label
                                                                htmlFor={`is_current_org_${index}`}
                                                                className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                                                            >
                                                                I am currently active in this organization
                                                            </label>
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                Description <span className="text-red-600">*</span>
                                                            </label>
                                                            <textarea
                                                                name="description"
                                                                value={org.description}
                                                                placeholder="Describe your role, responsibilities, and accomplishments in this organization. Use bullet points for better readability."
                                                                onChange={(e) => handleArrayChange(e, index, 'organizations')}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === ' ' && e.currentTarget.value.endsWith('-')) {
                                                                        e.preventDefault();
                                                                        const updatedValue = e.currentTarget.value.slice(0, -1) + '• ';
                                                                        const updatedArray = [...formData.organizations];
                                                                        updatedArray[index] = {
                                                                            ...updatedArray[index],
                                                                            description: updatedValue,
                                                                        };
                                                                        setFormData({
                                                                            ...formData,
                                                                            organizations: updatedArray,
                                                                        });
                                                                    }
                                                                }}
                                                                rows={3}
                                                                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        addArrayItem('organizations', {
                                                            name: '',
                                                            position: '',
                                                            start_date: '',
                                                            end_date: '',
                                                            is_current: false,
                                                            description: '',
                                                        })
                                                    }
                                                    className="mt-2 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                                >
                                                    <svg
                                                        className="mr-2 -ml-1 h-5 w-5 text-gray-500 dark:text-gray-400"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    Add Organization
                                                </button>
                                            </div>
                                        )}

                                        {/* 5. Languages section - muncul jika checkbox dicentang */}
                                        {addOnSections.languages && (
                                            <div data-section-key="languages" className="mb-8">
                                                <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900 dark:border-gray-600 dark:text-white">
                                                    Languages
                                                </h2>

                                                {formData.languages.map((lang, index) => (
                                                    <div key={index} className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-600">
                                                        <div className="mb-4 flex items-center justify-between">
                                                            <h3 className="font-medium text-gray-800 dark:text-white">Language #{index + 1}</h3>
                                                            {formData.languages.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeArrayItem('languages', index)}
                                                                    className="text-sm text-red-600 hover:text-red-800"
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="mb-4">
                                                            <label
                                                                htmlFor={`language_${index}`}
                                                                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                                            >
                                                                Language <span className="text-red-600">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                id={`language_${index}`}
                                                                name="language"
                                                                value={lang.language}
                                                                placeholder="eg: English"
                                                                onChange={(e) => handleArrayChange(e, index, 'languages')}
                                                                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="mb-4 flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                id={`language_has_certification_${index}`}
                                                                checked={lang.has_certification}
                                                                onChange={(event) =>
                                                                    updateLanguage(index, { has_certification: event.target.checked })
                                                                }
                                                                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                            />
                                                            <label
                                                                htmlFor={`language_has_certification_${index}`}
                                                                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                                                            >
                                                                I have a test result or certification for this language
                                                            </label>
                                                        </div>
                                                        {lang.has_certification && (
                                                            <div className="grid gap-4 md:grid-cols-2">
                                                                <div>
                                                                    <label
                                                                        htmlFor={`language_test_name_${index}`}
                                                                        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                                                    >
                                                                        Test or Certification Name <span className="text-red-600">*</span>
                                                                    </label>
                                                                    <input
                                                                        id={`language_test_name_${index}`}
                                                                        name="test_name"
                                                                        value={lang.test_name}
                                                                        onChange={(e) => handleArrayChange(e, index, 'languages')}
                                                                        required
                                                                        className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label
                                                                        htmlFor={`language_issuer_${index}`}
                                                                        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                                                    >
                                                                        Issuing Organization <span className="text-red-600">*</span>
                                                                    </label>
                                                                    <input
                                                                        id={`language_issuer_${index}`}
                                                                        name="issuing_organization"
                                                                        value={lang.issuing_organization}
                                                                        onChange={(e) => handleArrayChange(e, index, 'languages')}
                                                                        required
                                                                        className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label
                                                                        htmlFor={`language_score_${index}`}
                                                                        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                                                    >
                                                                        Score <span className="text-red-600">*</span>
                                                                    </label>
                                                                    <input
                                                                        id={`language_score_${index}`}
                                                                        name="score"
                                                                        value={lang.score}
                                                                        onChange={(e) => handleArrayChange(e, index, 'languages')}
                                                                        required
                                                                        className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label
                                                                        htmlFor={`language_issue_date_${index}`}
                                                                        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                                                    >
                                                                        Issue Date <span className="text-red-600">*</span>
                                                                    </label>
                                                                    <input
                                                                        type="month"
                                                                        id={`language_issue_date_${index}`}
                                                                        name="issue_date"
                                                                        value={lang.issue_date}
                                                                        onChange={(e) => handleArrayChange(e, index, 'languages')}
                                                                        required
                                                                        className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label
                                                                        htmlFor={`language_expiration_date_${index}`}
                                                                        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                                                    >
                                                                        Expiration Date
                                                                    </label>
                                                                    <input
                                                                        type="month"
                                                                        id={`language_expiration_date_${index}`}
                                                                        name="expiration_date"
                                                                        value={lang.expiration_date}
                                                                        onChange={(e) => handleArrayChange(e, index, 'languages')}
                                                                        disabled={!lang.is_time_limited}
                                                                        required={lang.is_time_limited}
                                                                        className="w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-700"
                                                                    />
                                                                </div>
                                                                <div className="flex items-end pb-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        id={`language_is_time_limited_${index}`}
                                                                        checked={lang.is_time_limited}
                                                                        onChange={(event) =>
                                                                            updateLanguage(index, { is_time_limited: event.target.checked })
                                                                        }
                                                                        className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                                    />
                                                                    <label
                                                                        htmlFor={`language_is_time_limited_${index}`}
                                                                        className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                                                                    >
                                                                        This test or certification has an expiration date
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        addArrayItem('languages', {
                                                            language: '',
                                                            level: '',
                                                            has_certification: false,
                                                            test_name: '',
                                                            issuing_organization: '',
                                                            score: '',
                                                            issue_date: '',
                                                            expiration_date: '',
                                                            is_time_limited: false,
                                                        })
                                                    }
                                                    className="mt-2 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                                >
                                                    <svg
                                                        className="mr-2 -ml-1 h-5 w-5 text-gray-500 dark:text-gray-400"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    Add Language
                                                </button>
                                            </div>
                                        )}

                                        {/* 6. Additional Information section - muncul jika checkbox dicentang */}
                                        {addOnSections.additional_info && (
                                            <div data-section-key="additional_info" className="mb-8">
                                                <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900 dark:border-gray-600 dark:text-white">
                                                    Additional Information
                                                </h2>

                                                <div className="mb-3">
                                                    <textarea
                                                        name="additional_info"
                                                        value={formData.additional_info}
                                                        onChange={handleChange}
                                                        onKeyDown={(e) => {
                                                            if (e.key === ' ' && e.currentTarget.value.endsWith('-')) {
                                                                e.preventDefault();
                                                                const updatedValue = e.currentTarget.value.slice(0, -1) + '• ';
                                                                setFormData({
                                                                    ...formData,
                                                                    additional_info: updatedValue,
                                                                });
                                                            }
                                                        }}
                                                        placeholder="Include any final professional details, such as work availability, relocation preferences, or technical publications."
                                                        rows={5}
                                                        className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                    ></textarea>
                                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                        Use bullet points for better readability.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </OrderedSections>

                                    <div className="mt-6 flex flex-col justify-between space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                                        <button
                                            type="button"
                                            onClick={handleGeneratePDF}
                                            disabled={isGeneratingPDF}
                                            className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-gray-800 px-4 py-2 text-xs font-semibold tracking-widest text-white uppercase shadow-sm transition hover:bg-gray-700 focus:border-gray-900 focus:ring focus:ring-gray-300 focus:outline-none active:bg-gray-900 disabled:opacity-50 sm:w-auto sm:flex-1 dark:bg-gray-700 dark:hover:bg-gray-600"
                                        >
                                            {isGeneratingPDF ? 'Generating...' : 'Generate PDF'}
                                        </button>
                                        {!isGuest && (
                                            <button
                                                type="button"
                                                onClick={!isEdit ? handleSaveNewCV : handleSaveUpdate}
                                                className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-xs font-semibold tracking-widest text-white uppercase shadow-sm transition hover:bg-red-500 focus:border-red-700 focus:ring focus:ring-red-300 focus:outline-none active:bg-red-700 disabled:opacity-50 sm:w-auto sm:flex-1"
                                            >
                                                Save CV
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={togglePreview}
                                            className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-xs font-semibold tracking-widest text-gray-900 uppercase shadow-sm transition hover:bg-gray-300 focus:ring focus:ring-gray-300 focus:outline-none active:bg-gray-400 disabled:opacity-50 sm:w-auto sm:flex-1 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                                        >
                                            {showPreview ? 'Close Preview' : 'Preview CV'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Preview Section */}
                        {showPreview && (
                            <div className="transition-all duration-300 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:w-1/2">
                                <div className="flex h-full min-h-0 flex-col rounded-lg bg-white p-5 shadow-md dark:bg-gray-700">
                                    <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-2">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Preview CV</h2>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={togglePreview}
                                                aria-label="Close CV preview"
                                                className="text-gray-500 hover:text-gray-700 focus:ring-2 focus:ring-red-500 focus:outline-none dark:text-gray-300 dark:hover:text-gray-100"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="min-h-0 flex-1 overflow-auto rounded">
                                        <div>
                                            <CV data={formData} enabledSections={addOnSections} isPdfMode={false} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal profile photo */}
            {pendingCVType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
                    <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Change CV Type?</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Changing CV type will hide a section that already contains data. Your information will be kept and restored when you
                            switch back.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setPendingCVType(null)}
                                className="rounded-md border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => applyCVType(pendingCVType)}
                                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
                            >
                                Change Type
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPhotoModal && photoPreview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm dark:bg-black/30"
                    onClick={() => setShowPhotoModal(false)}
                >
                    <div
                        className="w-full max-w-md rounded-lg bg-white/90 p-6 shadow-xl backdrop-blur dark:bg-gray-800/90"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Preview Profile Photo</h3>
                            <button
                                type="button"
                                onClick={() => setShowPhotoModal(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div
                            className="mx-auto mb-4 overflow-hidden rounded-full border-4 border-gray-300 dark:border-gray-600"
                            style={{ width: '256px', height: '256px' }}
                        >
                            <img src={photoPreview} alt="Larger profile preview" className="h-full w-full object-cover" />
                        </div>
                    </div>
                </div>
            )}

            {showLoginSaveModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                    onClick={() => setShowLoginSaveModal(false)}
                >
                    <div
                        className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Save this CV to your account?</h3>
                        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                            Log in and we will save this CV to your account so you can access it later.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowLoginSaveModal(false)}
                                className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Later
                            </button>
                            <a
                                href={`${route('login')}?redirect=${encodeURIComponent('/generate-cv')}`}
                                className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
                            >
                                Log in
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {saveMessage && (
                <div
                    className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
                        saveMessage.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}
                    role="alert"
                >
                    {saveMessage.text}
                </div>
            )}

            {/* Off-screen exact A4 canonical render surface without preview zoom/gap/guide */}
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    top: '-99999px',
                    left: '-99999px',
                    width: `${PAGE_WIDTH_MM}mm`,
                    pointerEvents: 'none',
                    zIndex: -1,
                }}
            >
                <div
                    ref={cvRef}
                    id="cv-to-export"
                    className="cv-for-pdf pdf-export-mode"
                    style={{
                        backgroundColor: 'white',
                        width: `${PAGE_WIDTH_MM}mm`,
                        padding: 0,
                        margin: 0,
                        boxSizing: 'border-box',
                    }}
                >
                    <CV data={{ ...formData, photoPreview }} enabledSections={addOnSections} isPdfMode={true} />
                </div>
            </div>
        </AppLayout>
    );
}
