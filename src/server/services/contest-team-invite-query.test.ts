import { describe, expect, it } from "vitest";
import {
  mapContestTeamInvite,
  type ContestTeamInviteRow,
} from "./contest-team-invite-query";

const row: ContestTeamInviteRow = {
  id: "invite-1",
  contestId: "contest-1",
  teamId: "team-1",
  teamName: "Segfault Society",
  status: "PENDING",
  invitedById: "user-captain",
  invitedByUsername: "captain",
  invitedByDisplayName: "Captain Rahman",
  invitedUserId: "user-invitee",
  invitedUsername: "invitee",
  invitedDisplayName: "Invitee Akter",
  createdAt: new Date("2026-11-24T09:00:00.000Z"),
  respondedAt: null,
};

describe("mapContestTeamInvite", () => {
  it("maps both identities and serialises the timestamps", () => {
    const view = mapContestTeamInvite({
      ...row,
      status: "ACCEPTED",
      respondedAt: new Date("2026-11-24T09:05:00.000Z"),
    });

    expect(view).toEqual({
      id: "invite-1",
      contestId: "contest-1",
      teamId: "team-1",
      teamName: "Segfault Society",
      status: "ACCEPTED",
      invitedBy: {
        userId: "user-captain",
        username: "captain",
        displayName: "Captain Rahman",
      },
      invitedUser: {
        userId: "user-invitee",
        username: "invitee",
        displayName: "Invitee Akter",
      },
      createdAt: "2026-11-24T09:00:00.000Z",
      respondedAt: "2026-11-24T09:05:00.000Z",
    });
  });

  it("keeps respondedAt null while the invite is pending", () => {
    expect(mapContestTeamInvite(row).respondedAt).toBeNull();
  });

  it("exposes usernames and display names only, never contact details", () => {
    const view = mapContestTeamInvite(row);
    const serialised = JSON.stringify(view);
    expect(serialised).not.toMatch(/email|@|phone/i);
    expect(Object.keys(view.invitedBy).sort()).toEqual([
      "displayName",
      "userId",
      "username",
    ]);
    expect(Object.keys(view.invitedUser).sort()).toEqual([
      "displayName",
      "userId",
      "username",
    ]);
  });
});
