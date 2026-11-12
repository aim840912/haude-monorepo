/**
 * Drop a URL's query string and fragment before it is logged.
 *
 * Secrets ride on URLs here: password reset links carry ?token=, and the
 * OAuth redirect to the front end carries #user={id,email,name,role}. Cutting
 * every query and fragment (rather than listing known parameters) keeps the
 * next token-in-a-link out of the logs too.
 */
export function stripUrlSecrets<T>(url: T): T {
  if (typeof url !== 'string') return url;
  const cut = url.search(/[?#]/);
  return (cut === -1 ? url : url.slice(0, cut)) as T;
}
