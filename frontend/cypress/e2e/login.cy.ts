/// <reference types="cypress" />

describe("Login Page", () => {
  beforeEach(() => {
    cy.visit("http://localhost:5173/login");
  });

  it("renders the login form", () => {
    cy.contains("Login").should("be.visible");
    cy.get("input[type=email]").should("exist");
    cy.get("input[type=password]").should("exist");
    cy.get("button[type=submit]").contains("Login");
  });

  it("shows validation errors for empty fields", () => {
    cy.get("button[type=submit]").click();
    cy.contains("Invalid email address").should("be.visible");
    cy.contains("Password cannot be empty").should("be.visible");
  });

  it("logs in successfully and redirects to dashboard", () => {
    cy.intercept("POST", "http://localhost:5000/login", {
      statusCode: 200,
      body: {}
    }).as("loginRequest");
    cy.get("input[type=email]").type("test@example.com");
    cy.get("input[type=password]").type("password123");
    cy.get("button[type=submit]").click();
    cy.wait("@loginRequest");
    cy.url().should("include", "/dashboard");
  });

  it("shows error toast on failed login", () => {
    cy.intercept("POST", "http://localhost:5000/login", {
      statusCode: 401,
      body: { error: "Invalid credentials" }
    }).as("loginRequest");
    cy.get("input[type=email]").type("wrong@example.com");
    cy.get("input[type=password]").type("wrongpass");
    cy.get("button[type=submit]").click();
    cy.wait("@loginRequest");
    cy.contains("Invalid credentials").should("be.visible");
  });

  it("navigates to register page", () => {
    cy.contains("Register").click();
    cy.url().should("include", "/register");
  });

  it("navigates to confirm account page", () => {
    cy.contains("Confirm your account").click();
    cy.url().should("include", "/confirm");
  });
});
