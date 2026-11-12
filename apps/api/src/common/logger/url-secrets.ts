/**
 * Drop a URL's query string and fragment before it is logged.
 *
 * Secrets ride on URLs here: password reset links carry ?token=, OAuth
 * callbacks carry ?code=, and the redirect to the front end carries
 * #user={id,email,name,role}. Cutting every query and fragment (rather than
 * listing known parameters) keeps the next token-in-a-link out of the logs.
 *
 * Header values can be arrays (setHeader('location', [url])); each is cleaned.
 */
export function stripUrlSecrets<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripUrlSecrets) as T;
  if (typeof value !== 'string') return value;
  const cut = value.search(/[?#]/);
  return (cut === -1 ? value : value.slice(0, cut)) as T;
}

// An absolute URL or a /path, followed by its ?query or #fragment
const URL_WITH_SECRETS = /((?:[a-z][a-z\d+.-]*:\/\/|\/)[^\s?#]*)[?#]\S*/gi;

/**
 * Same cleanup for URLs embedded in free text, e.g. "Cannot GET /x?token=…".
 * A "?" that does not follow a path or URL (prose) is left alone.
 */
export function stripUrlSecretsInText(text: string): string {
  return text.replace(URL_WITH_SECRETS, '$1');
}
