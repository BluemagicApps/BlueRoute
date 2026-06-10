export type ContactInput = {
  name: string;
  company: string;
  email: string;
  topic: string;
  message: string;
};

export type BookingInput = {
  name: string;
  email: string;
  company: string;
  originCode: string;
  destCode: string;
  mode: "door-to-door" | "port-to-port";
  containerId: string;
  optionId: "express" | "balanced" | "green";
  insurance: boolean;
  weightKg: number | null;
  readyDate: string | null;
};

export type FieldErrors = Record<string, string>;

export type ContactState =
  | { status: "idle" }
  | { status: "error"; error: string; fieldErrors?: FieldErrors }
  | { status: "success"; ticketRef: string };

export type BookingState =
  | { status: "idle" }
  | { status: "error"; error: string; fieldErrors?: FieldErrors }
  | { status: "success"; bookingRef: string };
