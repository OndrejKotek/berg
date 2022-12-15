describe("TESTS: Configuration => Subsystem => Batch => Thread Pool", () => {
  const configurationFormId = "batch-thread-pool-form";
  const threadFactory = "thread-factory";
  const maxThreads = "max-threads";

  const threadPools = {
    create: {
      name: "thread-pool-create",
      maxThreads: 2,
    },
    edit: {
      name: "thread-pool-edit",
      maxThreads: 2,
    },
    remove: {
      name: "thread-pool-remove",
      maxThreads: 2,
    },
  };

  const threadFactoryEdit = "thread-factory-edit";

  let managementEndpoint: string;

  before(() => {
    cy.startWildflyContainer().then((result) => {
      managementEndpoint = result as string;
      cy.addAddress(managementEndpoint, [
        "subsystem",
        "batch-jberet",
        "thread-factory",
        threadFactoryEdit,
      ]);
      cy.addAddress(
        managementEndpoint,
        ["subsystem", "batch-jberet", "thread-pool", threadPools.edit.name],
        { "max-threads": threadPools.edit.maxThreads }
      );
      cy.addAddress(
        managementEndpoint,
        ["subsystem", "batch-jberet", "thread-pool", threadPools.remove.name],
        { "max-threads": threadPools.remove.maxThreads }
      );
    });
  });

  after(() => {
    cy.task("stop:containers");
  });

  it("Create Thread Pool", () => {
    cy.navigateTo(managementEndpoint, "batch-jberet-configuration");
    cy.get("#batch-thread-pool-item").click();
    cy.get(
      '#batch-thread-pool-table_wrapper button.btn.btn-default > span:contains("Add")'
    ).click();
    cy.text("batch-thread-pool-table-add", "name", threadPools.create.name);
    cy.text(
      "batch-thread-pool-table-add",
      "max-threads",
      threadPools.create.maxThreads.toString()
    );
    cy.get(
      'div.modal-footer > button.btn.btn-hal.btn-primary:contains("Add")'
    ).click();
    cy.verifySuccess();
    cy.validateAddress(
      managementEndpoint,
      ["subsystem", "batch-jberet", "thread-pool", threadPools.create.name],
      true
    );
  });

  it("Remove Thread Pool", () => {
    cy.navigateTo(managementEndpoint, "batch-jberet-configuration");
    cy.get("#batch-thread-pool-item").click();
    cy.get(
      'table#batch-thread-pool-table td:contains("' +
        threadPools.remove.name +
        '")'
    ).click();
    cy.get(
      '#batch-thread-pool-table_wrapper button.btn.btn-default > span:contains("Remove")'
    ).click();
    cy.get(
      'div.modal-footer > button.btn.btn-hal.btn-primary:contains("Yes")'
    ).click();
    cy.verifySuccess();
    cy.validateAddress(
      managementEndpoint,
      ["subsystem", "batch-jberet", "thread-pool", threadPools.remove.name],
      false
    );
  });

  it("Edit max-threads", () => {
    cy.navigateTo(managementEndpoint, "batch-jberet-configuration");
    cy.get("#batch-thread-pool-item").click();
    cy.get(
      'table#batch-thread-pool-table td:contains("' +
        threadPools.edit.name +
        '")'
    ).click();
    cy.editForm(configurationFormId);
    cy.text(configurationFormId, maxThreads, "5");
    cy.saveForm(configurationFormId);
    cy.verifySuccess();
    cy.verifyAttribute(
      managementEndpoint,
      ["subsystem", "batch-jberet", "thread-pool", threadPools.edit.name],
      "max-threads",
      5
    );
  });

  it("Edit thread-factory", () => {
    cy.navigateTo(managementEndpoint, "batch-jberet-configuration");
    cy.get("#batch-thread-pool-item").click();
    cy.get(
      'table#batch-thread-pool-table td:contains("' +
        threadPools.edit.name +
        '")'
    ).click();
    cy.editForm(configurationFormId);
    cy.text(configurationFormId, threadFactory, threadFactoryEdit);
    cy.saveForm(configurationFormId);
    cy.verifySuccess();
    cy.verifyAttribute(
      managementEndpoint,
      ["subsystem", "batch-jberet", "thread-pool", threadPools.edit.name],
      "thread-factory",
      threadFactoryEdit
    );
  });

  it("Reset Thread Pool", () => {
    cy.navigateTo(managementEndpoint, "batch-jberet-configuration");
    cy.get("#batch-thread-pool-item").click();
    cy.get(
      'table#batch-thread-pool-table td:contains("' +
        threadPools.edit.name +
        '")'
    ).click();
    cy.resetForm(configurationFormId, managementEndpoint + "/management", [
      "subsystem",
      "batch-jberet",
      "thread-pool",
      threadPools.edit.name,
    ]);
  });
});
