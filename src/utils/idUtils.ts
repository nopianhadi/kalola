/**
 * Generates a short random alphanumeric string.
 * @param length Length of the generated string.
 * @returns Random alphanumeric string.
 */
export function generateShortId(length = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomArray = new Uint8Array(length);
    crypto.getRandomValues(randomArray);
    for (let i = 0; i < length; i++) {
        result += chars.charAt(randomArray[i] % chars.length);
    }
    return result;
}

/**
 * Converts a string into a URL-friendly slug.
 * @param text Text to slugify.
 * @returns Slugified text.
 */
export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '')  // Remove all non-word chars
        .replace(/--+/g, '-');    // Replace multiple - with single -
}

/**
 * Generates a secure but pretty access ID combining a slug and a short random string.
 * @param name The name to base the slug on.
 * @returns Combined slug and short ID.
 */
export function generatePrettyAccessId(name: string): string {
    const slug = slugify(name);
    const shortId = generateShortId(4).toUpperCase();
    return `${slug}-${shortId}`;
}
