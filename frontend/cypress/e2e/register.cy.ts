/// <reference types="cypress" />

describe("Register Page", () => {
  beforeEach(() => {
    cy.visit("http://localhost:5173/register");
  });

  it("renders the register form", () => {
    cy.contains("Register").should("be.visible");
    cy.get("input[type=email]").should("exist");
    cy.get("input[type=password]").should("have.length", 2);
    cy.get("button[type=submit]").contains("Create your account");
  });

  it("shows validation errors for empty fields", () => {
    cy.get("button[type=submit]").click();
    cy.contains("Invalid email address").should("be.visible");
    cy.contains("Your password must have at least 8 characters").should("be.visible");
    cy.contains("Your password must have at least 8 characters").should("be.visible");
  });

  it("shows error if passwords don't match", () => {
    cy.get("input[type=email]").type("user@example.com");
    cy.get("input[placeholder='Insert your password']").type("password123");
    cy.get("input[placeholder='Re-enter your password']").type("different123");
    cy.get("button[type=submit]").click();
    cy.contains("Passwords don't match").should("be.visible");
  });

  it("registers successfully and redirects to confirm page", () => {
    cy.intercept("POST", "http://localhost:5000/register", {
      statusCode: 200,
      body: {}
    }).as("registerRequest");
    cy.get("input[type=email]").type("user@example.com");
    cy.get("input[placeholder='Insert your password']").type("password123");
    cy.get("input[placeholder='Re-enter your password']").type("password123");
    cy.get("button[type=submit]").click();
    cy.wait("@registerRequest");
    cy.url().should("include", "/confirm");
  });

  it("shows error toast on failed registration", () => {
    cy.intercept("POST", "http://localhost:5000/register", {
      statusCode: 400,
      body: { error: "Email already exists" }
    }).as("registerRequest");
    cy.get("input[type=email]").type("duplicate@example.com");
    cy.get("input[placeholder='Insert your password']").type("password123");
    cy.get("input[placeholder='Re-enter your password']").type("password123");
    cy.get("button[type=submit]").click();
    cy.wait("@registerRequest");
    cy.contains("Email already exists").should("be.visible");
  });

  it("navigates to login page", () => {
    cy.contains("Login").click();
    cy.url().should("include", "/login");
  });

  it("navigates to confirm page", () => {
    cy.contains("Confirm your account").click();
    cy.url().should("include", "/confirm");
  });
});
