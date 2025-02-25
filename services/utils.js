export function generateUniqueId(title, author) {
    const combinedString = `${title.trim().toLowerCase()}-${author.trim().toLowerCase()}`;
    const uniqueId = btoa(combinedString); // Base64 encode the string
    return uniqueId;
}
