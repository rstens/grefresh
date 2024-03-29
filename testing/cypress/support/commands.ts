/// <reference types="@testing-library/cypress" />

import 'cypress-plugin-api';
import 'cypress-real-events';
import '@testing-library/cypress/add-commands';
import { v4 as uuidv4 } from 'uuid';
import HomePage from '../pageObjects/homePage';

Cypress.Commands.add('querySelectorIncludesText', (selector, text) => {
  return cy.wrap(Array.from(document.querySelectorAll(selector)).find((el) => el.textContent.includes(text)));
});

Cypress.Commands.add('login', (username, password, host, siteminder) => {
  const home = new HomePage();

  // Go to the host
  cy.visit(host || Cypress.env('host'));

  const sentArgs = { user: username, pass: password };

  // Validate the host
  cy.get('h1', { timeout: 10000 }).contains('Common Hosted Single Sign-on (CSS)').should('be.visible');

  // Click the login button
  home.clickLoginButton();

  // Validate the login proxy only when we are not targeting a local install
  if (Cypress.env('host') != 'http://localhost:3000') {
    cy.origin(Cypress.env('loginproxy'), () => {
      cy.get('#kc-header-wrapper', { timeout: 10000 }).contains('COMMON HOSTED SINGLE SIGN-ON').should('be.visible');
      cy.get('#social-idir', { timeout: 10000 }).click();
    });
  }

  // Validate siteminder and login
  cy.origin(siteminder || Cypress.env('siteminder'), { args: sentArgs }, ({ user, pass }) => {
    cy.get('#login-to', { timeout: 10000 }).contains('Log in to ').should('be.visible');
    cy.get('#user', { timeout: 10000 }).type(user || Cypress.env('username'));
    cy.get('#password', { timeout: 10000 }).type(pass || Cypress.env('password'), { log: false });
    cy.get('input[name=btnSubmit]', { timeout: 10000 }).click();
    cy.wait(3000);
  });
  cy.get('h1', { timeout: 10000 }).contains('Common Hosted Single Sign-on (CSS)').should('be.visible');
  cy.get('button', { timeout: 10000 }).contains('Log out').should('be.visible');

  cy.log('Logged in as ' + (username || Cypress.env('username')));
});

Cypress.Commands.add('logout', (host) => {
  // Make sure you are on page with log out and logout
  cy.visit(host || Cypress.env('host'));

  cy.get('h1', { timeout: 10000 })
    .contains('Common Hosted Single Sign-on (CSS)')
    .should('be.visible');
  cy.get('button', { timeout: 10000 }).contains('Log out').should('be.visible');
  cy.get('button')
    .contains('Log out')
    .click({ force: true })
    .then(() => {
      cy.wait(2000);
    });
  // Return to home page
  cy.visit(host || Cypress.env('host'));
  cy.get('h1', { timeout: 10000 }).contains('Common Hosted Single Sign-on (CSS)').should('be.visible');
  cy.get('button', { timeout: 10000 }).contains('Log in').should('be.visible');

  cy.log('Logged out');
});

Cypress.Commands.add('setid', (type?) => {
  // Set the ID/PW Env vars to default if type not passed in
  if (!type) {
    type = 'default';
  }
  const data = Cypress.env('users');

  let foundItem = data.find((item) => item.type === type);
  Cypress.env('username', foundItem.username);
  Cypress.env('password', foundItem.password);
  Cypress.env('type', foundItem.type);
  if (foundItem.otpsecret) {
    Cypress.env('otpsecret', foundItem.otpsecret);
  }
});

Cypress.Commands.add('assertValueCopiedToClipboard', (value) => {
  cy.window().then((win) => {
    win.navigator.clipboard.readText().then((text) => {
      expect(text).to.eq(value);
    });
  });
});
