import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function convertOklchToRgb(colorStr: string): string {
    if (!colorStr || !colorStr.includes('oklch')) return colorStr;

    return colorStr.replace(/oklch\(\s*([0-9.]+)%?\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+%?))?\s*\)/gi, (match, lStr, cStr, hStr, aStr) => {
        let l = parseFloat(lStr);
        if (match.includes(lStr + '%') || l > 1) {
            l = l / 100;
        }
        const c = parseFloat(cStr);
        const h = parseFloat(hStr);
        if (isNaN(l) || isNaN(c) || isNaN(h)) {
            return 'rgb(0, 0, 0)';
        }

        let a = 1;
        if (aStr !== undefined) {
            a = parseFloat(aStr);
            if (aStr.includes('%')) a = a / 100;
        }

        const hRad = (h * Math.PI) / 180;
        const aOklab = c * Math.cos(hRad);
        const bOklab = c * Math.sin(hRad);

        const l_ = l + 0.3963377774 * aOklab + 0.2158037573 * bOklab;
        const m_ = l - 0.1055613458 * aOklab - 0.0638541728 * bOklab;
        const s_ = l - 0.0894841775 * aOklab - 1.291485548 * bOklab;

        const lCube = l_ * l_ * l_;
        const mCube = m_ * m_ * m_;
        const sCube = s_ * s_ * s_;

        const rLinear = +4.0767416621 * lCube - 3.3077115913 * mCube + 0.2309699292 * sCube;
        const gLinear = -1.2684380046 * lCube + 2.6097574011 * mCube - 0.3413193965 * sCube;
        const bLinear = -0.0041960863 * lCube - 0.7034186147 * mCube + 1.707614701 * sCube;

        const toSrgb = (x: number) => {
            const val = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
            return Math.max(0, Math.min(255, Math.round(val * 255)));
        };

        const r = toSrgb(rLinear);
        const g = toSrgb(gLinear);
        const b = toSrgb(bLinear);

        if (a < 1) {
            return `rgba(${r}, ${g}, ${b}, ${a})`;
        }
        return `rgb(${r}, ${g}, ${b})`;
    });
}

export function sanitizeOklchColors(clonedDoc: Document, clonedEl?: HTMLElement): void {
    const getStyle = clonedDoc.defaultView ? clonedDoc.defaultView.getComputedStyle : window.getComputedStyle;
    const elements = clonedEl
        ? ([clonedDoc.documentElement, clonedDoc.body, clonedEl, ...Array.from(clonedEl.querySelectorAll('*'))].filter(Boolean) as HTMLElement[])
        : (Array.from(clonedDoc.querySelectorAll('*')) as HTMLElement[]);

    let count = 0;
    elements.forEach((el) => {
        if (!el.style || typeof el.style.setProperty !== 'function') return;
        try {
            const computed = getStyle(el);
            for (let i = 0; i < computed.length; i++) {
                const prop = computed[i];
                if (
                    prop.indexOf('color') === -1 &&
                    prop.indexOf('background') === -1 &&
                    prop.indexOf('shadow') === -1 &&
                    prop.indexOf('fill') === -1 &&
                    prop.indexOf('stroke') === -1
                ) {
                    continue;
                }
                const val = computed.getPropertyValue(prop);
                if (val && typeof val === 'string' && val.includes('oklch')) {
                    el.style.setProperty(prop, convertOklchToRgb(val), 'important');
                    count++;
                }
            }
        } catch (e) {
            // Ignore computed style access errors
        }
    });
    console.log(`[onclone] Sanitized ${count} oklch style properties across ${elements.length} elements.`);
}
