import { describe, it, expect } from "vitest";
import { isValidUsername, usernameToEmail, loginInputToEmail, displayLogin, MEMBER_EMAIL_DOMAIN } from "./memberAuth";

describe("isValidUsername", () => {
  it("accepts simple lowercase names, digits, and separators", () => {
    expect(isValidUsername("kofi123")).toBe(true);
    expect(isValidUsername("ama.mensah")).toBe(true);
    expect(isValidUsername("user_01")).toBe(true);
  });

  it("normalizes case/whitespace before validating", () => {
    expect(isValidUsername("  Kofi123  ")).toBe(true);
  });

  it("rejects spaces, @ signs, and too-short/too-long names", () => {
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("has space")).toBe(false);
    expect(isValidUsername("real@email.com")).toBe(false);
    expect(isValidUsername("x".repeat(31))).toBe(false);
    expect(isValidUsername("")).toBe(false);
  });
});

describe("usernameToEmail / displayLogin round-trip", () => {
  it("maps a username to the placeholder domain and back", () => {
    const email = usernameToEmail("Kofi123");
    expect(email).toBe(`kofi123@${MEMBER_EMAIL_DOMAIN}`);
    expect(displayLogin(email)).toBe("kofi123");
  });

  it("leaves a real email untouched in the display direction", () => {
    expect(displayLogin("someone@gmail.com")).toBe("someone@gmail.com");
  });
});

describe("loginInputToEmail", () => {
  it("treats input without @ as a username", () => {
    expect(loginInputToEmail("kofi123")).toBe(`kofi123@${MEMBER_EMAIL_DOMAIN}`);
  });

  it("passes a real email through unchanged", () => {
    expect(loginInputToEmail(" someone@gmail.com ")).toBe("someone@gmail.com");
  });
});
