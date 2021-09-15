module.exports = app => {
  const customers = require("../controllers/customer.controller.js");

  // Retrieve all demos
  app.get("/demo", customers.findAll);
}
