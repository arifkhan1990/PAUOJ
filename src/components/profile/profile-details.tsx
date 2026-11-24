import { Briefcase, Building2, GraduationCap } from "lucide-react";
import {
  USER_STATUS_LABELS,
  type UserCurrentStatus,
} from "@/lib/profile-fields";

export type ProfileDetailsProps = {
  status: UserCurrentStatus | null;
  companyName: string | null;
  jobTitle: string | null;
  skills: readonly string[];
};

function cleanList(values: readonly string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}

/** Shared skill chips, also used by the admin user detail page. */
export function SkillChips({ skills }: { skills: readonly string[] }) {
  const items = cleanList(skills);
  if (items.length === 0) return null;

  return (
    <ul aria-label="Skills" className="flex flex-wrap gap-1.5">
      {items.map((skill, index) => (
        <li key={`${skill}-${index}`} className="max-w-full">
          <span className="inline-block max-w-full break-words rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {skill}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Public work details for a profile. Renders nothing when every field is empty
 * and never accepts private contact fields.
 */
export function ProfileDetails({
  status,
  companyName,
  jobTitle,
  skills,
}: ProfileDetailsProps) {
  const role = jobTitle?.trim() || null;
  const company = companyName?.trim() || null;
  const workLine = role && company ? `${role} at ${company}` : (role ?? company);
  const items = cleanList(skills);

  if (!status && !workLine && items.length === 0) return null;

  const StatusIcon = status === "STUDENT" ? GraduationCap : Briefcase;

  return (
    <div className="mt-3 space-y-2">
      {status ? (
        <p>
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
            <StatusIcon className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="break-words">
              <span className="sr-only">Current status: </span>
              {USER_STATUS_LABELS[status]}
            </span>
          </span>
        </p>
      ) : null}
      {workLine ? (
        <p className="flex min-w-0 items-start gap-1.5 text-xs text-muted-foreground">
          <Building2
            className="mt-0.5 size-3.5 shrink-0"
            aria-hidden="true"
          />
          <span className="min-w-0 break-words">{workLine}</span>
        </p>
      ) : null}
      <SkillChips skills={items} />
    </div>
  );
}
