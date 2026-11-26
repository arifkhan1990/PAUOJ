import { describe, expect, it } from "vitest";
import {
  parseEdgeMemoryBytes,
  readNetworkSettings,
  type ReadFile,
} from "./environment";

const SOMAXCONN = "/proc/sys/net/core/somaxconn";
const TCP_MAX_SYN_BACKLOG = "/proc/sys/net/ipv4/tcp_max_syn_backlog";

function reader(files: Record<string, string>): ReadFile {
  return (path) => {
    const value = files[path];
    if (value === undefined) throw new Error(`ENOENT: ${path}`);
    return value;
  };
}

describe("readNetworkSettings", () => {
  it("parses newline-terminated /proc values", () => {
    const settings = readNetworkSettings(
      reader({
        [SOMAXCONN]: "16384\n",
        [TCP_MAX_SYN_BACKLOG]: " 4096\n",
      }),
    );

    expect(settings).toEqual({ somaxconn: 16384, tcpMaxSynBacklog: 4096 });
  });

  it("returns 0 for a missing or unreadable file", () => {
    const settings = readNetworkSettings(
      reader({ [SOMAXCONN]: "8192\n" }),
    );

    expect(settings).toEqual({ somaxconn: 8192, tcpMaxSynBacklog: 0 });
  });

  it("returns 0 for non-numeric and unsafe values", () => {
    const settings = readNetworkSettings(
      reader({
        [SOMAXCONN]: "not-a-number\n",
        [TCP_MAX_SYN_BACKLOG]: "-1\n",
      }),
    );

    expect(settings).toEqual({ somaxconn: 0, tcpMaxSynBacklog: 0 });
  });

  it("never throws when the reader fails for every file", () => {
    const settings = readNetworkSettings(() => {
      throw new Error("permission denied");
    });

    expect(settings).toEqual({ somaxconn: 0, tcpMaxSynBacklog: 0 });
  });
});

describe("parseEdgeMemoryBytes", () => {
  it("parses a byte count", () => {
    expect(parseEdgeMemoryBytes("2147483648")).toBe(2147483648);
    expect(parseEdgeMemoryBytes(" 134217728\n")).toBe(134217728);
  });

  it("treats a missing key as 0", () => {
    expect(parseEdgeMemoryBytes(null)).toBe(0);
    expect(parseEdgeMemoryBytes("")).toBe(0);
  });

  it("rejects malformed values", () => {
    expect(parseEdgeMemoryBytes("2GB")).toBe(0);
    expect(parseEdgeMemoryBytes("-1")).toBe(0);
    expect(parseEdgeMemoryBytes("1.5")).toBe(0);
    expect(parseEdgeMemoryBytes("99999999999999999999")).toBe(0);
  });
});
