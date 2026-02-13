// ANSI color code parser
// Converts ANSI escape sequences to color/style information

export interface AnsiSegment {
    text: string;
    color?: string;
    bold?: boolean;
}

// Common ANSI codes
const ANSI_CODES: { [key: string]: { color?: string; bold?: boolean } } = {
    '\x1b[0;32m': { color: '#10b981' }, // Green
    '\x1b[0;31m': { color: '#ef4444' }, // Red
    '\x1b[1;33m': { color: '#f59e0b', bold: true }, // Bold yellow
    '\x1b[0;33m': { color: '#f59e0b' }, // Yellow
    '\x1b[1;32m': { color: '#10b981', bold: true }, // Bold green
    '\x1b[0m': {}, // Reset
    '[0;32m': { color: '#10b981' }, // Green (without escape char)
    '[0;31m': { color: '#ef4444' }, // Red (without escape char)
    '[1;33m': { color: '#f59e0b', bold: true }, // Bold yellow (without escape char)
    '[0;33m': { color: '#f59e0b' }, // Yellow (without escape char)
    '[1;32m': { color: '#10b981', bold: true }, // Bold green (without escape char)
    '[0m': {}, // Reset (without escape char)
};

/**
 * Parse a log line containing ANSI codes into segments with color information
 * @param line - Raw log line with ANSI codes
 * @returns Array of text segments with color/style information
 */
export function parseAnsiLine(line: string): AnsiSegment[] {
    const segments: AnsiSegment[] = [];
    let currentColor: string | undefined;
    let currentBold = false;
    let i = 0;

    while (i < line.length) {
        // Check for ANSI codes (with or without escape character)
        let ansiMatch = null;
        let ansiLength = 0;

        // Try to match escape sequence
        if (i + 4 < line.length && line[i] === '\x1b') {
            const potentialCode = line.substring(i, i + 5);
            for (const code of Object.keys(ANSI_CODES)) {
                if (potentialCode.startsWith(code)) {
                    ansiMatch = code;
                    ansiLength = code.length;
                    break;
                }
            }
        }

        // Try to match non-escape ANSI codes like [0;32m
        if (!ansiMatch && line[i] === '[') {
            for (const code of Object.keys(ANSI_CODES)) {
                if (code.startsWith('[') && line.substring(i).startsWith(code)) {
                    ansiMatch = code;
                    ansiLength = code.length;
                    break;
                }
            }
        }

        if (ansiMatch) {
            const style = ANSI_CODES[ansiMatch];
            if (Object.keys(style).length === 0) {
                // Reset code
                currentColor = undefined;
                currentBold = false;
            } else {
                if (style.color) currentColor = style.color;
                if (style.bold !== undefined) currentBold = style.bold;
            }
            i += ansiLength;
        } else {
            // Collect regular text until next ANSI code
            let textEnd = i + 1;
            while (
                textEnd < line.length &&
                line[textEnd] !== '\x1b' &&
                (line[textEnd] !== '[' || (textEnd + 1 < line.length && line[textEnd + 1] === ' '))
            ) {
                if (line[textEnd] === '[' && /\d/.test(line[textEnd + 1])) {
                    break;
                }
                textEnd++;
            }

            const text = line.substring(i, textEnd);
            if (text) {
                segments.push({
                    text,
                    color: currentColor,
                    bold: currentBold || undefined,
                });
            }
            i = textEnd;
        }
    }

    return segments.length > 0 ? segments : [{ text: line }];
}

/**
 * Strip ANSI codes from a line for plain text processing
 * @param line - Raw log line with ANSI codes
 * @returns Plain text without ANSI codes
 */
export function stripAnsi(line: string): string {
    return line
        .replace(/\x1b\[[0-9;]*m/g, '') // Remove escape sequences
        .replace(/\[[0-9;]*m/g, ''); // Remove non-escape ANSI codes
}
