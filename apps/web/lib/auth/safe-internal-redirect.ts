/**
 * Accept only same-origin app paths for authentication callbacks.
 * A leading "/" is insufficient: browsers interpret backslashes in special
 * schemes as slashes, so "/\host.example" can navigate off-site.
 */
const REDIRECT_PARSE_ORIGIN = "https://mapable.invalid";

export function isSafeInternalRedirectPath(path: string): boolean {
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(path)
  ) {
    return false;
  }

  try {
    return new URL(path, REDIRECT_PARSE_ORIGIN).origin === REDIRECT_PARSE_ORIGIN;
  } catch {
    return false;
  }
}
