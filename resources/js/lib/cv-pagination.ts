import React from 'react';

export type BlockKind =
    | 'header'
    | 'section-heading'
    | 'item-heading'
    | 'item-heading-continued'
    | 'item-content'
    | 'bullet'
    | 'paragraph'
    | 'skills-grid'
    | 'languages-list'
    | 'spacer';

export interface SemanticBlock {
    key: string;
    kind: BlockKind;
    content: React.ReactNode;
    keepWithNext?: boolean;
    parentItemKey?: string;
    continuedContent?: React.ReactNode;
}

export interface MeasuredBlock {
    key: string;
    kind: BlockKind;
    height: number;
    keepWithNext: boolean;
    parentItemKey?: string;
    continuedHeight?: number;
    continuedContent?: React.ReactNode;
}

// Effective maximum vertical pixels available per page content box in canonical A4 (277mm ~ 1047px)
// Reserving space for footer indicator and preventing font jitter overflow across OS targets.
export const MAX_CONTENT_HEIGHT_PX = 990;

/**
 * Measure real DOM heights and vertical computed margins of each block inside an offscreen surface.
 */
export function measureBlocks(container: HTMLElement, blocks: SemanticBlock[]): MeasuredBlock[] {
    const blockElements = container.querySelectorAll('[data-cv-block-key]');
    const elementMap = new Map<string, HTMLElement>();

    blockElements.forEach((el) => {
        const key = el.getAttribute('data-cv-block-key');
        if (key && el instanceof HTMLElement) {
            elementMap.set(key, el);
        }
    });

    return blocks.map((block) => {
        const el = elementMap.get(block.key);
        let height = 0;
        let continuedHeight = 0;

        if (el) {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            const marginTop = parseFloat(style.marginTop) || 0;
            const marginBottom = parseFloat(style.marginBottom) || 0;
            // In a flex column container, vertical margins do not collapse
            height = rect.height + marginTop + marginBottom;
        }

        if (block.continuedContent) {
            continuedHeight = height;
        }

        return {
            key: block.key,
            kind: block.kind,
            height: Math.max(1, height),
            keepWithNext: Boolean(block.keepWithNext),
            parentItemKey: block.parentItemKey,
            continuedHeight: Math.max(1, continuedHeight),
            continuedContent: block.continuedContent,
        };
    });
}

/**
 * Perform greedy packing of semantic blocks into page arrays without breaking keepWithNext rules.
 * Automatically inserts continued item headings when an item overflows across page boundaries.
 */
export function paginateBlocks(measured: MeasuredBlock[], maxPageHeightPx = MAX_CONTENT_HEIGHT_PX): string[][] {
    const pages: string[][] = [];
    let currentPage: string[] = [];
    let currentHeight = 0;
    let lastPushedParentKey: string | undefined = undefined;

    const getGroupHeight = (index: number): number => {
        let total = 0;
        for (let j = index; j < measured.length; j++) {
            total += measured[j].height;
            if (!measured[j].keepWithNext) {
                break;
            }
        }
        return total;
    };

    for (let i = 0; i < measured.length; i++) {
        const block = measured[i];
        const groupHeight = getGroupHeight(i);

        if (currentPage.length > 0 && currentHeight + groupHeight > maxPageHeightPx) {
            pages.push(currentPage);
            currentPage = [];
            currentHeight = 0;

            if (block.parentItemKey && block.parentItemKey === lastPushedParentKey) {
                const headingBlock = measured.find((m) => m.key === block.parentItemKey && m.continuedContent);
                if (headingBlock) {
                    const contKey = `cont::${headingBlock.key}::p${pages.length}`;
                    currentPage.push(contKey);
                    currentHeight += (headingBlock.continuedHeight || headingBlock.height);
                }
            }
        }

        currentPage.push(block.key);
        currentHeight += block.height;
        lastPushedParentKey = block.parentItemKey || block.key;
    }

    if (currentPage.length > 0 || pages.length === 0) {
        pages.push(currentPage);
    }

    return pages;
}
