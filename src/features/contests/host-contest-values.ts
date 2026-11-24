import {
  CONTEST_FORMAT_LABEL,
  CONTEST_HOSTING_FEES,
  CONTEST_TEAM_MAX_SIZE,
  CONTEST_TEAM_MIN_SIZE,
  type ContestFormat,
} from "@/lib/contest-ops";
import { CONTEST_DIVISION_LABEL } from "@/lib/contests";
import type { SelectOption } from "@/lib/select-options";
import type { ContestDivision } from "@/lib/types";

export const FORMAT_OPTIONS: SelectOption[] = [
  {
    value: "SINGLE",
    label: CONTEST_FORMAT_LABEL.SINGLE,
    description: "One coder per entry, individual ranking.",
  },
  {
    value: "GROUP",
    label: CONTEST_FORMAT_LABEL.GROUP,
    description: `${CONTEST_TEAM_MIN_SIZE}–${CONTEST_TEAM_MAX_SIZE} coders share one ranking.`,
  },
];

export const DIVISION_OPTIONS: SelectOption[] = (
  Object.keys(CONTEST_DIVISION_LABEL) as ContestDivision[]
).map((value) => ({ value, label: CONTEST_DIVISION_LABEL[value] }));

export const TEAM_SIZE_OPTIONS: SelectOption[] = Array.from(
  { length: CONTEST_TEAM_MAX_SIZE - CONTEST_TEAM_MIN_SIZE + 1 },
  (_, index) => {
    const size = CONTEST_TEAM_MIN_SIZE + index;
    return { value: String(size), label: `${size} coders` };
  },
);

export const FEE_OPTIONS: SelectOption[] = CONTEST_HOSTING_FEES.map((fee) => ({
  value: String(fee),
  label: `৳${fee.toLocaleString("en-US")}`,
}));

export type HostFormValues = {
  title: string;
  description: string;
  bannerUrl: string;
  format: ContestFormat;
  division: ContestDivision;
  teamSize: string;
  startAt: string;
  endAt: string;
  expectedParticipants: string;
  sponsorNote: string;
  contactEmail: string;
  contactPhone: string;
  feeBdt: string;
  paymentReference: string;
  agreement: boolean;
};

export type HostFormUpdate = <K extends keyof HostFormValues>(
  key: K,
  value: HostFormValues[K],
) => void;

export type HostFormErrors = Record<string, string>;

export const HOST_FIELD_IDS = [
  "title",
  "description",
  "bannerUrl",
  "format",
  "division",
  "teamSize",
  "startAt",
  "endAt",
  "expectedParticipants",
  "sponsorNote",
  "contactEmail",
  "contactPhone",
  "feeBdt",
  "paymentReference",
  "agreement",
] as const;

/**
 * Builds the default window with UTC arithmetic so server and client render the
 * same `datetime-local` strings; the browser then reads them as its local time.
 */
export function defaultHostValues(email: string): HostFormValues {
  const now = new Date();
  const start = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 14,
      10,
      0,
    ),
  );
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return {
    title: "",
    description: "",
    bannerUrl: "",
    format: "SINGLE",
    division: "OPEN",
    teamSize: String(CONTEST_TEAM_MIN_SIZE + 1),
    startAt: start.toISOString().slice(0, 16),
    endAt: end.toISOString().slice(0, 16),
    expectedParticipants: "50",
    sponsorNote: "",
    contactEmail: email,
    contactPhone: "",
    feeBdt: String(CONTEST_HOSTING_FEES[0]),
    paymentReference: "",
    agreement: false,
  };
}
