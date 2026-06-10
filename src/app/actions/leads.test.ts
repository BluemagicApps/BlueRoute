import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock is hoisted above module scope, so the mock fns must be created via
// vi.hoisted() to be available inside the factories.
const { insert, from, sendEmails } = vi.hoisted(() => {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn(() => ({ insert }));
  const sendEmails = vi.fn().mockResolvedValue(undefined);
  return { insert, from, sendEmails };
});

vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: () => ({ from }) }));
vi.mock("@/lib/email/resend", () => ({ sendEmails }));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: () => "test-agent" }),
}));

import { submitContact, submitBooking } from "./leads";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

beforeEach(() => {
  insert.mockClear();
  from.mockClear();
  sendEmails.mockClear();
});

describe("submitContact", () => {
  it("inserts and sends two emails on success", async () => {
    const res = await submitContact(
      { status: "idle" },
      fd({ name: "Jane", email: "jane@acme.com", message: "Hi", topic: "Sales & quoting" }),
    );
    expect(res.status).toBe("success");
    expect(from).toHaveBeenCalledWith("contact_inquiries");
    expect(insert).toHaveBeenCalledTimes(1);
    expect(sendEmails).toHaveBeenCalledTimes(1);
    expect(sendEmails.mock.calls[0][0]).toHaveLength(2);
  });

  it("returns fieldErrors and does not insert on invalid input", async () => {
    const res = await submitContact({ status: "idle" }, fd({ name: "", email: "bad", message: "" }));
    expect(res.status).toBe("error");
    expect(insert).not.toHaveBeenCalled();
  });

  it("silently succeeds and stores nothing when honeypot is filled", async () => {
    const res = await submitContact(
      { status: "idle" },
      fd({ name: "Bot", email: "bot@x.com", message: "spam", company_url: "http://spam" }),
    );
    expect(res.status).toBe("success");
    expect(insert).not.toHaveBeenCalled();
    expect(sendEmails).not.toHaveBeenCalled();
  });
});

function bookingFd(over: Record<string, string> = {}): FormData {
  return fd({
    name: "Jane",
    email: "jane@acme.com",
    originCode: "CNSHA",
    destCode: "NLRTM",
    mode: "door-to-door",
    containerId: "40hc",
    optionId: "balanced",
    insurance: "true",
    ...over,
  });
}

describe("submitBooking", () => {
  it("inserts into quote_requests and emails on success", async () => {
    const res = await submitBooking({ status: "idle" }, bookingFd());
    expect(res.status).toBe("success");
    expect(from).toHaveBeenCalledWith("quote_requests");
    expect(insert).toHaveBeenCalledTimes(1);
    expect(sendEmails.mock.calls[0][0]).toHaveLength(2);
  });

  it("errors on invalid email without inserting", async () => {
    const res = await submitBooking({ status: "idle" }, bookingFd({ email: "bad" }));
    expect(res.status).toBe("error");
    expect(insert).not.toHaveBeenCalled();
  });

  it("errors when route resolves to nothing (unknown port)", async () => {
    const res = await submitBooking({ status: "idle" }, bookingFd({ originCode: "ZZZZZ" }));
    expect(res.status).toBe("error");
    expect(insert).not.toHaveBeenCalled();
  });
});
