import { Briefcase, Code2, Globe, type LucideIcon } from "lucide-react";
import { parseProfileLink, type ProfileLinkField } from "@/lib/profile-links";

type SocialLink = {
  key: ProfileLinkField;
  href: string;
  text: string;
  accessibleName: string;
  icon: LucideIcon;
};

function socialLink(
  field: ProfileLinkField,
  raw: string | null,
  label: string,
  icon: LucideIcon,
): SocialLink | null {
  if (!raw || !raw.trim()) return null;
  const parsed = parseProfileLink(field, raw);
  if (!parsed.ok || !parsed.value) return null;

  const text =
    field === "website"
      ? new URL(parsed.value).hostname.replace(/^www\./i, "")
      : label;
  return {
    key: field,
    href: parsed.value,
    text,
    accessibleName: `${text} ${field === "website" ? "website" : "profile"} (opens in a new tab)`,
    icon,
  };
}

/**
 * Compact profile link row. Only normalized http(s) targets are rendered;
 * anything blank or malformed is silently dropped.
 */
export function ProfileSocialLinks({
  website,
  github,
  linkedin,
}: {
  website: string | null;
  github: string | null;
  linkedin: string | null;
}) {
  const links = [
    socialLink("website", website, "Website", Globe),
    socialLink("github", github, "GitHub", Code2),
    socialLink("linkedin", linkedin, "LinkedIn", Briefcase),
  ].filter((link): link is SocialLink => link !== null);

  if (links.length === 0) return null;

  return (
    <ul
      className="mt-2.5 flex flex-wrap items-center gap-x-1 gap-y-1"
      aria-label="Profile links"
    >
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <li key={link.key} className="min-w-0 max-w-full">
            <a
              href={link.href}
              target="_blank"
              rel="me ugc nofollow noopener noreferrer"
              aria-label={link.accessibleName}
              className="inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-md px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-h-8 sm:text-xs"
            >
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{link.text}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
