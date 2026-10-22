export const escapeHtml = (value = "") => {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};

export const escapeRegex = (value = "") => {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const maskEmail = (email = "") => {
    const [local, domain] = String(email).split("@");
    if (!domain) return email;
    const visible = local.slice(0, Math.min(2, local.length));
    return `${visible}${"*".repeat(Math.max(local.length - visible.length, 3))}@${domain}`;
};
