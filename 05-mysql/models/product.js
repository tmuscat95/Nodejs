const fs = require("fs");
const path = require("path");
const db = require("../util/database");
const Cart = require("./cart");

const p = path.join(
  path.dirname(process.mainModule.filename),
  "data",
  "products.json"
);

const getProductsFromFile = (cb) => {
  fs.readFile(p, (err, fileContent) => {
    if (err) {
      cb([]);
    } else {
      cb(JSON.parse(fileContent));
    }
  });
};

module.exports = class Product {
  constructor(id, title, imageUrl, description, price) {
    this.id = id;
    this.title = title;
    this.imageUrl = imageUrl;
    this.description = description;
    this.price = price;
  }

  save() {
    db.execute(`INSERT INTO products (title, price, imageUrl, description) VALUES (?,?,?,?)
                `),//prevent SQL injection; use parameterised queries;
      [this.title, this.price, this.imageUrl, this.description];
  }

  static deleteById(id) {}

  static fetchAll() {
    return db.execute("SELECT * FROM products"); //promise
  }

  static findById(id) {
    return db.execute(`SELECT * FROM products WHERE products.id = ?`,[id]);
    //use parameterised queries
  }
};
