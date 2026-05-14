const disposableDomains = new Set([
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "yopmail.com",
  "throwawaymail.com",
  "getnada.com",
  "sharklasers.com"
]);

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isDisposableEmail(value: string) {
  const domain = value.trim().split("@")[1]?.toLowerCase() ?? "";
  return disposableDomains.has(domain);
}

export function getEmailError(value: string) {
  if (!value.trim()) {
    return "Email is required.";
  }

  if (!isValidEmail(value)) {
    return "Enter a valid email address.";
  }

  if (isDisposableEmail(value)) {
    return "Please use a business or personal email.";
  }

  return "";
}
