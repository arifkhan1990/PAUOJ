"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  MapPin,
  Star,
  User,
  X,
} from "lucide-react";
import { SkillChips } from "@/components/profile/profile-details";
import { ProfileSocialLinks } from "@/components/profile/profile-social-links";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ReportButton } from "@/features/moderation/report-dialog";
import type { ConversationThread } from "@/lib/message-types";
import { USER_STATUS_LABELS } from "@/lib/profile-fields";
import { cn, formatDate } from "@/lib/utils";
import { ConversationMuteButton } from "./conversation-mute-button";
import {
  DetailRow,
  SectionTitle,
  SharedContentStateView,
} from "./conversation-info-sections";
import { muteToggleState } from "./message-format";
import { PresenceLabel } from "./presence-dot";
import type { SharedContentState } from "./use-conversation-shared-content";
import { useMediaQuery } from "./use-media-query";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Right-hand conversation details. In-flow column at >=768px and an
 * accessible slide-in dialog below that. Content is fetched by the workspace
 * so closing and reopening the panel stays instant.
 */
export function ConversationInfoPanel({
  panelId,
  conversationId,
  participant,
  muted,
  shared,
  onRetryShared,
  onClose,
}: {
  panelId: string;
  conversationId: string;
  participant: ConversationThread["participant"];
  muted: boolean;
  shared: SharedContentState;
  onRetryShared: () => void;
  onClose: () => void;
}) {
  const inFlow = useMediaQuery("(min-width: 768px)");
  const drawer = !inFlow;
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [entered, setEntered] = useState(false);
  const titleId = `${panelId}-title`;
  const { profile } = participant;
  const muteLabel = muteToggleState(muted).label;

  useEffect(() => {
    if (!drawer) {
      setEntered(true);
      return;
    }
    setEntered(false);
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [drawer]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // A nested native dialog (the report form) owns Escape while it is open.
      if (document.querySelector("dialog[open]")) return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!drawer) return;
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === closeRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [drawer]);

  const memberSince = Number.isNaN(Date.parse(profile.memberSince))
    ? null
    : formatDate(profile.memberSince);
  const workLine =
    [profile.jobTitle?.trim(), profile.companyName?.trim()]
      .filter(Boolean)
      .join(" at ") || null;

  return (
    <>
      {drawer ? (
        <button
          type="button"
          aria-label="Close conversation info"
          tabIndex={-1}
          onClick={onClose}
          className={cn(
            "fixed inset-0 z-40 cursor-default bg-background/70 backdrop-blur-sm motion-safe:transition-opacity motion-safe:duration-200",
            entered ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}

      <aside
        ref={panelRef}
        id={panelId}
        role={drawer ? "dialog" : undefined}
        aria-modal={drawer ? true : undefined}
        aria-labelledby={titleId}
        className={cn(
          "flex min-h-0 flex-col border-border bg-card",
          drawer
            ? cn(
                "fixed inset-y-0 right-0 z-50 w-[min(22rem,88vw)] border-l shadow-2xl motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none",
                entered ? "translate-x-0" : "translate-x-full",
              )
            : "w-[300px] shrink-0 border-l lg:w-[340px] 2xl:w-[360px]",
        )}
      >
        <div className="flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-1.5">
          <h2 className="text-sm font-semibold" id={titleId}>
            Conversation info
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close conversation info"
            className="grid size-11 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="reference-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-5">
          <div className="flex flex-col items-center text-center">
            <UserAvatar
              name={participant.displayName}
              username={participant.username}
              size="xl"
              avatarPreset={participant.avatarPreset}
              avatarImageAt={participant.avatarImageUpdatedAt}
            />
            <h3 className="mt-3 max-w-full break-words text-base font-semibold">
              {participant.displayName}
            </h3>
            <p className="mt-0.5 max-w-full truncate font-mono text-xs text-muted-foreground">
              @{participant.username}
            </p>
            <div className="mt-1.5 flex justify-center">
              <PresenceLabel presence={participant.presence} />
            </div>
            <Link
              href={`/users/${participant.username}`}
              className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <User className="size-3.5" aria-hidden="true" />
              View profile
            </Link>
          </div>

          <section aria-labelledby={`${panelId}-about`} className="mt-5">
            <SectionTitle id={`${panelId}-about`}>About</SectionTitle>
            <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-muted-foreground">
              {profile.bio?.trim() || "This coder has not added a bio yet."}
            </p>
            <ProfileSocialLinks
              website={profile.website}
              github={profile.github}
              linkedin={profile.linkedin}
            />
          </section>

          <section aria-labelledby={`${panelId}-details`} className="mt-5">
            <SectionTitle id={`${panelId}-details`}>Details</SectionTitle>
            <ul className="mt-2 divide-y divide-border/70 overflow-hidden rounded-lg border border-border/70">
              {profile.institution?.trim() ? (
                <DetailRow icon={GraduationCap} label="Institution">
                  {profile.institution}
                </DetailRow>
              ) : null}
              {profile.country?.trim() ? (
                <DetailRow icon={MapPin} label="Country">
                  {profile.country}
                </DetailRow>
              ) : null}
              {profile.currentStatus ? (
                <DetailRow icon={Briefcase} label="Status">
                  {USER_STATUS_LABELS[profile.currentStatus]}
                </DetailRow>
              ) : null}
              {workLine ? (
                <DetailRow icon={Building2} label="Work">
                  {workLine}
                </DetailRow>
              ) : null}
              <DetailRow icon={Star} label="Rating">
                {profile.rating > 0
                  ? profile.rating.toLocaleString("en-US")
                  : "Unrated"}
              </DetailRow>
              {memberSince ? (
                <DetailRow icon={CalendarDays} label="Member since">
                  {memberSince}
                </DetailRow>
              ) : null}
              <DetailRow icon={User} label="Skills">
                {profile.skills.length > 0 ? (
                  <SkillChips skills={profile.skills} />
                ) : (
                  <span className="text-muted-foreground">
                    No skills listed yet.
                  </span>
                )}
              </DetailRow>
            </ul>
          </section>

          <section aria-labelledby={`${panelId}-actions`} className="mt-5">
            <SectionTitle id={`${panelId}-actions`}>Actions</SectionTitle>
            <div className="mt-2 space-y-1.5">
              <Link
                href={`/users/${participant.username}`}
                className="flex min-h-11 items-center gap-2.5 rounded-lg border border-border/70 px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <User
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="flex-1">View profile</span>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              </Link>
              <div className="flex min-h-11 items-center gap-2.5 rounded-lg border border-border/70 px-3">
                <span className="flex-1 text-sm font-medium">{muteLabel}</span>
                <ConversationMuteButton
                  conversationId={conversationId}
                  muted={muted}
                  className="-mr-2"
                />
              </div>
              <div className="flex min-h-11 items-center gap-2.5 rounded-lg border border-border/70 pl-3">
                <span className="flex-1 text-sm font-medium">
                  Report conversation
                </span>
                <ReportButton
                  kind="CONVERSATION"
                  username={participant.username}
                  conversationId={conversationId}
                  ariaLabel="Report conversation"
                  iconOnly
                  className="mr-1"
                />
              </div>
            </div>
          </section>

          <section
            aria-labelledby={`${panelId}-shared`}
            className="mt-5 border-t border-border pt-4"
          >
            <SectionTitle id={`${panelId}-shared`}>
              Media, links and docs
            </SectionTitle>
            <SharedContentStateView
              state={shared}
              onRetry={onRetryShared}
              participantName={participant.displayName}
            />
          </section>
        </div>
      </aside>
    </>
  );
}
