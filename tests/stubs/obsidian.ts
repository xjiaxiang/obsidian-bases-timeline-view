/**
 * Vitest stand-in for the Obsidian runtime module (types-only package).
 * moment covers the date strings `normalizeVisDate` actually passes through.
 */
function parseParts(input: string): { y: number; m: number; d: number } | null {
	const year = /^(\d{1,4})$/.exec(input);
	if (year) {
		return { y: Number(year[1]), m: 1, d: 1 };
	}

	const yearMonth = /^(\d{4})-(\d{1,2})$/.exec(input);
	if (yearMonth) {
		return {
			y: Number(yearMonth[1]),
			m: Number(yearMonth[2]),
			d: 1,
		};
	}

	const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(input);
	if (iso) {
		return {
			y: Number(iso[1]),
			m: Number(iso[2]),
			d: Number(iso[3]),
		};
	}

	return null;
}

function isValidParts(parts: { y: number; m: number; d: number }): boolean {
	if (parts.m < 1 || parts.m > 12 || parts.d < 1 || parts.d > 31) {
		return false;
	}
	const probe = new Date(parts.y, parts.m - 1, parts.d);
	return (
		probe.getFullYear() === parts.y &&
		probe.getMonth() === parts.m - 1 &&
		probe.getDate() === parts.d
	);
}

export function moment(input: string) {
	const parts = parseParts(input);
	const valid = parts != null && isValidParts(parts);

	return {
		isValid: () => valid,
		format: (fmt: string) => {
			if (!valid || parts == null) {
				return 'Invalid date';
			}
			if (fmt !== 'YYYY-MM-DD') {
				throw new Error(`unsupported format: ${fmt}`);
			}
			const m = String(parts.m).padStart(2, '0');
			const d = String(parts.d).padStart(2, '0');
			const y = String(parts.y).padStart(4, '0');
			return `${y}-${m}-${d}`;
		},
	};
}

/** Minimal stubs for modules that import Obsidian types at load time. */
export class TFile {}

export function getAllTags(): string[] {
	return [];
}
