import type { ContactInput, BookingInput, FieldErrors } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(input: ContactInput): FieldErrors {
  const e: FieldErrors = {};
  if (!input.name.trim()) e.name = "Please enter your name.";
  if (!EMAIL_RE.test(input.email)) e.email = "Enter a valid email.";
  if (!input.message.trim()) e.message = "Please enter a message.";
  return e;
}

export function validateBooking(input: BookingInput): FieldErrors {
  const e: FieldErrors = {};
  if (!input.name.trim()) e.name = "Please enter your name.";
  if (!EMAIL_RE.test(input.email)) e.email = "Enter a valid email.";
  if (!input.originCode || !input.destCode) e.route = "Choose origin and destination.";
  else if (input.originCode === input.destCode) e.route = "Origin and destination must differ.";
  return e;
}
