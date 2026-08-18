export interface AnsiSegment {
  text: string;
  color?: string;
  bold?: boolean;
}

const COLOR_MAP: Record<string, string> = {
  "30": "#374151", // Black / Dark Gray
  "31": "#ef4444", // Red
  "32": "#10b981", // Green
  "33": "#f59e0b", // Yellow
  "34": "#3b82f6", // Blue
  "35": "#a855f7", // Magenta
  "36": "#06b6d4", // Cyan
  "37": "#f3f4f6", // White
  "90": "#6b7280", // Bright Black (Gray)
  "91": "#f87171", // Bright Red
  "92": "#34d399", // Bright Green
  "93": "#fbbf24", // Bright Yellow
  "94": "#60a5fa", // Bright Blue
  "95": "#c084fc", // Bright Magenta
  "96": "#22d3ee", // Bright Cyan
  "97": "#ffffff", // Bright White
};

/**
 * Parse a log line containing ANSI codes into segments with color information
 * @param line - Raw log line with ANSI codes
 * @returns Array of text segments with color/style information
 */
export function parseAnsiLine(line: string): AnsiSegment[] {
  if (!line) return [];

  // Match standard ANSI escape sequences: \x1b[...m or literal `\u001b` / bracket sequences
  const ansiRegex = /(?:\x1b|\u001b|\\u001b)?\[([0-9;]*)m/g;
  const segments: AnsiSegment[] = [];
  let lastIndex = 0;
  let currentColor: string | undefined;
  let currentBold = false;

  let match: RegExpExecArray | null;

  while ((match = ansiRegex.exec(line)) !== null) {
    const textBefore = line.substring(lastIndex, match.index);
    if (textBefore) {
      segments.push({
        text: textBefore,
        color: currentColor,
        bold: currentBold || undefined,
      });
    }

    const codes = match[1] ? match[1].split(";") : ["0"];
    for (const code of codes) {
      if (code === "0" || code === "" || code === "00") {
        currentColor = undefined;
        currentBold = false;
      } else if (code === "1") {
        currentBold = true;
      } else if (code === "22") {
        currentBold = false;
      } else if (COLOR_MAP[code]) {
        currentColor = COLOR_MAP[code];
      }
    }

    lastIndex = ansiRegex.lastIndex;
  }

  const remaining = line.substring(lastIndex);
  if (remaining) {
    segments.push({
      text: remaining,
      color: currentColor,
      bold: currentBold || undefined,
    });
  }

  return segments.length > 0 ? segments : [{ text: line }];
}

/**
 * Strip ANSI codes from a line for plain text processing
 * @param line - Raw log line with ANSI codes
 * @returns Plain text without ANSI codes
 */
export function stripAnsi(line: string): string {
  if (!line) return "";
  return line.replace(/(?:\x1b|\u001b|\\u001b)?\[[0-9;]*m/g, "");
}
