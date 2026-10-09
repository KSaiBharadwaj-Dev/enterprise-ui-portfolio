import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

/** Accepts only https links with no embedded credentials. javascript: and data: links fail. */
export function httpsUrl(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? "").trim();
    if (value === "") return null; // optional field: add Validators.required where it is mandatory
    // The prefix check rejects "https:example.com", which the URL parser accepts
    // but a browser would resolve as a link on the current site.
    if (!/^https:\/\//i.test(value) || value.length > 200) return { httpsUrl: true };
    try {
      const url = new URL(value);
      return !url.username && !url.password ? null : { httpsUrl: true };
    } catch {
      return { httpsUrl: true };
    }
  };
}

/** Only same-site paths are allowed after sign-in. This blocks open redirects like //evil.example. */
export function safeReturnUrl(url: string | null | undefined): string {
  if (!url || !url.startsWith("/") || url.startsWith("//") || url.includes("\\")) return "/";
  return url;
}
