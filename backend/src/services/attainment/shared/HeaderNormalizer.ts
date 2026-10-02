export class HeaderNormalizer {
    /**
     * Normalizes a header string for reliable matching.
     * Example: "Part - A", "Part-A", "PART A", "partA" -> "PART A"
     */
    public normalize(header: string | undefined | null): string {
        if (header === undefined || header === null) return '';
        
        let text = String(header).trim().toUpperCase();
        
        // Remove spaces around hyphens and convert hyphens to spaces to unify them
        text = text.replace(/\s*-\s*/g, ' ');
        text = text.replace(/-/g, ' ');

        // Collapse multiple spaces into one
        text = text.replace(/\s+/g, ' ');

        // Handle common CO aliases
        // e.g. "C01" (with zero) -> "CO1" (with letter O)
        text = text.replace(/C0(\d)/g, 'CO$1');
        
        // Handle no-space COs e.g. "PART ACO1" vs "PART A CO1"
        // Let's ensure "PARTA", "PARTB" etc have a space
        text = text.replace(/PARTA/g, 'PART A');
        text = text.replace(/PARTB/g, 'PART B');

        // Let's ensure 'CO' always has a space before it if it's attached to something else,
        // EXCEPT we want "CO1", not "CO 1".
        text = text.replace(/CO\s+(\d)/g, 'CO$1');

        return text.trim();
    }
}
