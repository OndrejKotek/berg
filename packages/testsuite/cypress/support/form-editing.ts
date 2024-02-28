const waitForStableDOM = (iteration = 0) => {
  const options = {
    pollInterval: 500,
    timeout: 10000,
    mutationObserver: {
      subtree: true,
      childList: true,
      attributes: true,
      attributeOldValue: true,
      characterData: true,
      characterDataOldValue: true,
    },
  };

  cy.document().then((document) => {
    let mutation: MutationRecord[];
    const target = document;
    const observer = new MutationObserver((m) => (mutation = m));
    observer.observe(target, options.mutationObserver);

    cy.wait(options.pollInterval, { log: true }).then(() => {
      if (!mutation) {
        cy.log(`No changes detected for over interval ${options.pollInterval}ms!`);
        cy.log("Continuing with test...");
        return;
      } else if (iteration * options.pollInterval < options.timeout) {
        cy.log("Mutation detected... retrying...");
        return waitForStableDOM(iteration + 1);
      } else {
        throw Error("Timed out waiting for stable DOM");
      }
    });
  });
};

Cypress.Commands.add("editForm", (formId) => {
  const editButton = "#" + formId + ' a.clickable[data-operation="edit"]';
  cy.get(`#${formId}-editing`).should("not.be.visible");
  waitForStableDOM();
  cy.get(editButton).click();
  waitForStableDOM();
  cy.get(`#${formId}-editing`).should("be.visible");
});

Cypress.Commands.add("saveForm", (formId) => {
  const saveButton = "#" + formId + '-editing button.btn.btn-hal.btn-primary:contains("Save")';
  waitForStableDOM();
  cy.get(saveButton).scrollIntoView().click();
  waitForStableDOM();
});

Cypress.Commands.add("cancelForm", (formId) => {
  const saveButton = "#" + formId + '-editing button.btn.btn-hal.btn-default:contains("Cancel")';
  waitForStableDOM();
  cy.get(saveButton).scrollIntoView().click();
  waitForStableDOM();
});

Cypress.Commands.add("resetForm", (formId, managementApi, address) => {
  const resetButton = "#" + formId + ' a.clickable[data-operation="reset"';
  waitForStableDOM();
  cy.get(resetButton).click();
  waitForStableDOM();
  cy.get("body").then(($body) => {
    if ($body.find(".modal-footer .btn-hal.btn-primary").length) {
      cy.get(".modal-footer .btn-hal.btn-primary").click({ force: true });
      waitForStableDOM();
      cy.verifySuccess();
    } else {
      cy.get(".toast-notifications-list-pf .alert-warning")
        .contains("None of the attributes could be reset.")
        .should("be.visible");
    }
  });
  cy.task("execute:cli", {
    managementApi: `${managementApi}/management`,
    operation: "read-resource-description",
    address: address,
  }).then((result) => {
    expect((result as { outcome: string }).outcome).to.equal("success");
    const attributes = (
      result as {
        result: { attributes: { [key: string]: { default?: string } } };
      }
    ).result.attributes;
    const attributesWithDefaultValues = Object.keys(attributes)
      .filter((key: string) => Object.prototype.hasOwnProperty.call(attributes[key], "default"))
      .map((key) => {
        const obj: {
          [index: string]: undefined | string | number | boolean;
        } = {};
        obj["name"] = key;
        obj["defaultValue"] = attributes[key].default;
        return obj;
      });
    attributesWithDefaultValues.forEach((attributeWithDefaultValue) => {
      cy.task("execute:cli", {
        managementApi: `${managementApi}/management`,
        operation: "read-attribute",
        address: address,
        name: attributeWithDefaultValue.name,
      }).then((result) => {
        expect((result as { outcome: string }).outcome).to.equal("success");
        expect((result as { result: string | number | boolean }).result).to.equal(
          attributeWithDefaultValue.defaultValue
        );
      });
    });
  });
});

Cypress.Commands.add("help", () => {
  waitForStableDOM();
  cy.get(`span.form-link-label:contains("Help")`).click();
  waitForStableDOM();
});

Cypress.Commands.add("addInTable", (tableId) => {
  const tableWrapper = `#${tableId}_wrapper`;
  waitForStableDOM();
  cy.get(`${tableWrapper} button.btn.btn-default > span:contains("Add")`).click();
  waitForStableDOM();
});

Cypress.Commands.add("removeFromTable", (tableId, resourceName) => {
  const tableWrapper = `#${tableId}_wrapper`;
  cy.selectInTable(tableId, resourceName);
  waitForStableDOM();
  cy.get(`${tableWrapper} button.btn.btn-default > span:contains("Remove")`).click();
  waitForStableDOM();
  cy.get('div.modal-footer > button.btn.btn-hal.btn-primary:contains("Yes")').click();
  waitForStableDOM();
});

Cypress.Commands.add("addSingletonResource", (addSingletonResourceId) => {
  waitForStableDOM();
  cy.get("#" + addSingletonResourceId + ' .btn-primary:contains("Add")').click();
  waitForStableDOM();
});

Cypress.Commands.add("removeSingletonResource", (formId) => {
  const removeButton = "#" + formId + ' a.clickable[data-operation="remove"';
  waitForStableDOM();
  cy.get(removeButton).click();
  waitForStableDOM();
  cy.get('div.modal-footer > button.btn.btn-hal.btn-primary:contains("Yes")').click();
  waitForStableDOM();
});

/* eslint @typescript-eslint/unbound-method: off */
Cypress.Commands.add("flip", (formId, attributeName, value) => {
  waitForStableDOM();
  cy.formInput(formId, attributeName)
    .wait(1000)
    .should(($input) => {
      if (value) {
        expect($input).to.be.checked;
      } else {
        expect($input).to.not.be.checked;
      }
    });
  waitForStableDOM();
  cy.get('div[data-form-item-group="' + formId + "-" + attributeName + '-editing"] .bootstrap-switch-label:visible')
    .click()
    .wait(1000);
  waitForStableDOM();
  cy.formInput(formId, attributeName).should(($input) => {
    if (value) {
      expect($input).to.not.be.checked;
    } else {
      expect($input).to.be.checked;
    }
  });
  waitForStableDOM();
});

Cypress.Commands.add(
  "text",
  (formId, attributeName, value, options = { selector: "", parseSpecialCharSequences: true }) => {
    const selector = options.selector;
    const parseSpecialCharSequences = options.parseSpecialCharSequences;
    let formInput;
    if (selector) {
      formInput = cy.get(selector);
    } else {
      formInput = cy.formInput(formId, attributeName);
    }

    waitForStableDOM();
    formInput.click({ force: true }).wait(200).clear();
    waitForStableDOM();
    formInput.type(value as string, { parseSpecialCharSequences: parseSpecialCharSequences });
    waitForStableDOM();
    formInput.should("have.value", value);
    formInput.trigger("change");
    waitForStableDOM();
    // lose focus of current input to close suggestions which can hide buttons.
    formInput.blur();
    waitForStableDOM();
  }
);

Cypress.Commands.add("textExpression", (formId, attributeName, value, options = { selector: "" }) => {
  cy.text(formId, attributeName, value, { selector: options.selector, parseSpecialCharSequences: false });
});

Cypress.Commands.add("clearAttribute", (formId, attributeName) => {
  waitForStableDOM();
  cy.formInput(formId, attributeName).click({ force: true }).wait(200).clear();
  waitForStableDOM();
  cy.formInput(formId, attributeName).should("have.value", "");
  cy.formInput(formId, attributeName).trigger("change");
  waitForStableDOM();
});

Cypress.Commands.add("clearListAttributeItems", (attributeName) => {
  cy.get(attributeName)
    .get("div.tag-manager-container")
    .children("span")
    .each((span) => {
      cy.wrap(span).find("a[href]").click({ multiple: true });
    });
});

Cypress.Commands.add("selectInDropdownMenuOnPage", (elementId, value) => {
  // somtimes can be the dropdown menu behind a pop-up alert notification. So we need close them.
  cy.closeAllPopUpNotifications();
  waitForStableDOM();
  cy.get(`button[data-id="${elementId}"]`).click();
  waitForStableDOM();
  cy.get(`button[data-id="${elementId}"]`)
    .parent()
    .within(() => {
      cy.get(`a.dropdown-item`).contains(value).click();
    });
  waitForStableDOM();
});

Cypress.Commands.add("selectInDropdownMenu", (formId, attributeName, value) => {
  cy.selectInDropdownMenuOnPage(`${formId}-${attributeName}-editing`, value);
});

export {};
/* eslint @typescript-eslint/no-namespace: off */
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Click on "Edit" and enable form for editing.
       * @category Form Editing
       *
       * @param formId - The ID of section which need to be edit.
       */
      editForm(formId: string): Chainable<void>;
      /**
       * Click on "Save" button to save current data in form.
       * @category Form Editing
       *
       * @param formId - The ID of section which need to be save.
       */
      saveForm(formId: string): Chainable<void>;
      /**
       * Click on "Reset" button to reset saved values to default. And verify saved values.
       * @category Form Editing
       *
       * @param formId - The ID of section which need to be reset.
       * @param managementApi - Host name of currently used container.
       * @param address - Indexes contains values between "/" from request address.
       */
      resetForm(formId: string, managementApi: string, address: string[]): Chainable<void>;
      /**
       * Click on "Cancel" for cancelling editing mode.
       * @category Form Editing
       *
       * @param formId - The ID of section which need to be canceled.
       */
      cancelForm(formId: string): Chainable<void>;
      /**
       * Click on "Help" button to show documentation for attributes on editing form
       * @category Form Editing
       *
       */
      help(): Chainable<void>;
      /**
       * Click on "add" to create a new resource in a table.
       * @category Resource management
       *
       * @param tableId - The ID of table where need to be added a new resource.
       */
      addInTable(tableId: string): void;
      /**
       * Select resource from table and click on "Remove" to delete the resource.
       * @category Resource management
       *
       * @param tableId - The ID of table where need to be added a new resource.
       * @param resourceName - The name of a resource from table.
       */
      removeFromTable(tableId: string, resourceName: string): void;
      /**
       * Click on "add" to create a new singleton resource.
       * @category Resource management
       *
       * @param addSingletonResourceId - The ID of div with \<h1> "No resource found" and another div with button "Add".
       */
      addSingletonResource(addSingletonResourceId: string): void;
      /**
       * Click on "remove" to delete a singleton resource.
       * @category Resource management
       *
       * @param formId - The ID of section which contain "Remove" for delete a singleton resource.
       */
      removeSingletonResource(formId: string): void;
      /**
       * Toggle on/off switch.
       * @category Data inserting
       *
       * @param formId - The ID of section which contain form inputs.
       * @param attributeName - specific ID part of form input with on/off switch.
       * @param value - current value of on/off switch. Will be set the opposite value.
       */
      flip(formId: string, attributeName: string, value: boolean): Chainable<void>;
      /**
       * Set text value to form input.
       * @category Data inserting
       *
       * @param formId - The ID of section which contain form inputs.
       * @param attributeName - specific ID part of form input with text form input.
       * @param value - the value which needs to be write to form input.
       * @param options - an object which might contain any of the following:
       *                     - a custom selector for text field (the name of the text field will not be guessed)
       */
      text(
        formId: string,
        attributeName: string,
        value: string | number,
        options?: { selector?: string; parseSpecialCharSequences?: boolean }
      ): Chainable<void>;
      /**
       * Set text value to form input.
       * @category Data inserting
       *
       * @param formId - The ID of section which contain form inputs.
       * @param attributeName - specific ID part of form input with text form input.
       * @param value - the value which needs to be write to form input.
       * @param options - an object which might contain any of the following:
       *                     - a custom selector for text field (the name of the text field will not be guessed)
       */
      textExpression(
        formId: string,
        attributeName: string,
        value: string | number,
        options?: { selector?: string }
      ): Chainable<void>;
      /**
       * Clear all selected list attribute items from the form input.
       * @category Data removing
       *
       * @param attributeName - name of form input.
       */
      clearListAttributeItems(attributeName: string): Chainable<void>;
      /**
       * Remove text value from form input.
       * @category Data inserting
       *
       * @param formId - The ID of section which contain form inputs.
       * @param attributeName - specific ID part of form input with text form input.
       */
      clearAttribute(formId: string, attributeName: string): Chainable<void>;
      /**
       * Select value from <select> input which isn't part of a form.
       * @category Data inserting
       *
       * @example The form input have select with id "#dw-routing-select"
       *  - The elementId is: "dw-routing-select"
       *  - value: what you want select.
       *
       * @param elementId - The element ID of section
       * @param value - the value which needs to be selected.
       */
      selectInDropdownMenuOnPage(elementId: string, value: string): Chainable<void>;
      /**
       * Select value from <select> form input.
       * @category Data inserting
       *
       * @example The form input have select with id "#model-browser-root-secure-server-add-ssl-required-editing""
       *  - The formId is: "model-browser-root-provider-add"
       *  - The attributeName is: "auth-server-url"
       *  - value: what you want write to input
       *
       * @param formId - The ID of section which contain form inputs.
       * @param attributeName - specific ID part of form input with select input.
       * @param value - the value which needs to be selected.
       */
      selectInDropdownMenu(formId: string, attributeName: string, value: string): Chainable<void>;
    }
  }
}
