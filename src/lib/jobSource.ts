const PLATFORM_NAMES: Record<string, string> = {
  adzuna: "Adzuna",
  arbeitnow: "Arbeitnow",
  jsearch: "JSearch",
  rekrute: "Rekrute",
  anapec: "ANAPEC",
  indeed: "Indeed",
  linkedin: "LinkedIn",
};

export function platformName(source: string): string {
  return PLATFORM_NAMES[source] ?? source;
}

function searchTerms(title: string, company: string | null): string {
  return [title, company].filter(Boolean).join(" ");
}

/** Best-effort search link on the source platform, used when we don't have a direct
 * link to the specific posting (e.g. jobs ingested before url tracking existed). */
export function fallbackSearchUrl(
  source: string,
  title: string,
  company: string | null,
): string | null {
  const q = encodeURIComponent(searchTerms(title, company));

  switch (source) {
    case "adzuna":
      return `https://www.adzuna.com/search?q=${q}`;
    case "arbeitnow":
      return `https://www.arbeitnow.com/search/${q}`;
    case "jsearch":
    case "indeed":
      return `https://www.indeed.com/jobs?q=${q}`;
    case "rekrute":
      return `https://www.rekrute.com/offres.html?s=${q}`;
    case "anapec":
      return `https://www.anapec.org/sigec-app-rv/chercheurs/resultat_recherche/mots:${q}`;
    case "linkedin":
      return `https://www.linkedin.com/jobs/search/?keywords=${q}`;
    default:
      return null;
  }
}
