/// <reference types="cypress" />

describe("Confirm Page", () => {
  beforeEach(() => {
    cy.visit("http://localhost:5173/confirm");
  });

  it("renders the confirm form", () => {
    cy.contains("Confirm account").should("be.visible");
    cy.get("input[type=email]").should("exist");
    cy.get("input").should("have.length.at.least", 2); // email + OTP slots
    cy.get("button[type=submit]").contains("Confirm your account");
  });

  it("shows validation errors for empty fields", () => {
    cy.get("button[type=submit]").click();
    cy.contains("Invalid email address").should("be.visible");
    cy.contains("Your verification code must be 6 characters.").should("be.visible");
  });

  it("shows error for short OTP", () => {
    cy.get("input[type=email]").type("user@example.com");
    cy.get('input[name="otp"]').first().type("123");
    cy.get("button[type=submit]").click();
    cy.contains("Your verification code must be 6 characters.").should("be.visible");
  });

  it("confirms successfully and redirects to login page", () => {
    cy.intercept("POST", "http://localhost:5000/confirm", {
      statusCode: 200,
      body: {}
    }).as("confirmRequest");
    cy.get("input[type=email]").type("user@example.com");
    cy.get('input[name="otp"]').first().type("ABC123");
    cy.get("button[type=submit]").click();

    cy.wait("@confirmRequest");
    cy.url().should("include", "/login");
  });

  it("shows error toast on failed confirmation", () => {
    cy.intercept("POST", "http://localhost:5000/confirm", {
      statusCode: 404
    }).as("confirmRequest");
    cy.get("input[type=email]").type("user@example.com");
    cy.get('input[name="otp"]').first().type("ZZZZZZ");
    cy.get("button[type=submit]").click();
    cy.wait("@confirmRequest");
    cy.contains("An error occurred").should("be.visible");
  });

  it("navigates to login page", () => {
    cy.contains("Login").click();
    cy.url().should("include", "/login");
  });

  it("navigates to register page", () => {
    cy.contains("Register").click();
    cy.url().should("include", "/register");
  });
});
