const sql = require("./db.js");

// constructor
const Customer = function(customer) {
  this.id = customer.id;
  this.title = customer.title;
};

Customer.getAll = result => {
  sql.query("SELECT * FROM demo", (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    console.log("customers: ", res);
    result(null, res);
  });
};

module.exports = Customer;
