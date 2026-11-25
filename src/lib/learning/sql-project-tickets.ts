/**
 * The 23 ShopSphere work tickets, keyed by lesson topic slug so a topic page
 * can render the ticket it belongs to.
 *
 * Ids are stable: the epic prefix plus a two-digit sequence. The two arrays
 * are split for file size, not by track; the lookup is keyed by topic slug and
 * the project board sorts the tickets by the curriculum sequence.
 */

import { SQL_PROJECT_TICKETS_A } from "./sql-project-tickets-a";
import { SQL_PROJECT_TICKETS_B } from "./sql-project-tickets-b";

import type { SqlProjectTicket } from "./sql-project";

const ALL_TICKETS: SqlProjectTicket[] = [
  ...SQL_PROJECT_TICKETS_A,
  ...SQL_PROJECT_TICKETS_B,
];

export const SQL_PROJECT_TICKETS: Record<string, SqlProjectTicket> =
  Object.fromEntries(ALL_TICKETS.map((ticket) => [ticket.topicSlug, ticket]));
