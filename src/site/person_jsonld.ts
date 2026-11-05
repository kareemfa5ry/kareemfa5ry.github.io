// schema.org Person record for the home page head, built from contact.ts, profile.ts and the skill group labels.
import { EMAIL, FULL_NAME, LINKEDIN_URL } from "./contact";
import { TAGLINE } from "./profile";

export function personJsonLd(skillLabels: readonly string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: FULL_NAME,
    jobTitle: TAGLINE.split(" · ")[0],
    email: EMAIL,
    url: "https://kareemfa5ry.github.io/",
    sameAs: [LINKEDIN_URL],
    address: { "@type": "PostalAddress", addressLocality: "Cairo", addressCountry: "EG" },
    knowsAbout: [...skillLabels],
  };
}
