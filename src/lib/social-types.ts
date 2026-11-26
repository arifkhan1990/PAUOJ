export type SocialCounts = {
  messages: number;
  notifications: number;
  requests: number;
  /** Pending premium-access orders; always 0 for non-admins. */
  access: number;
};
