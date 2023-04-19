const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");

const errorController = require("./controllers/error");
const sequelize = require("./util/database");
const Product = require("./models/product");
const User = require("./models/user");
const Cart = require("./models/cart");
const CartItem = require("./models/cart-item");
const Order = require("./models/order");
const OrderItem = require("./models/order-item");

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");

app.use(express.json()); //to parse JSON body requests
app.use(bodyParser.urlencoded({ extended: false })); //to parse form data requests.
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  User.findById(1)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => console.log(err));
});
app.use("/admin", adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

/**
 * Associations
 * https://sequelize.org/docs/v6/core-concepts/assocs/
 */
//1-to-many
Product.belongsTo(User, { constraints: true, onDelete: "CASCADE" }); // 1-to-many; cascade -> delete products associated with user when user is deleted.
User.hasMany(Product); // 1-to-many

//1-to-1
User.hasOne(Cart); //1-to-1 User has cartId column
Cart.belongsTo(User); //1-to-1 User has cartId column

//many-to-many
//through: CartItem , gives the junction table that connects the items.
Cart.belongsToMany(Product, { through: CartItem }); //1-to-many; CartItem has CartId column
Product.belongsToMany(Cart, { through: CartItem });

Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product,{through: OrderItem});
/**
 * If the users table has the account_id column then a User belongsTo Account. (And the Account either hasOne or hasMany Users)

But if the users table does not have the account_id column, and instead the accounts table has the user_id column, then User hasOne or hasMany Accounts
 */
sequelize
  .sync({ force: false }) //force:true; migration will overwrite existing table structure.
  .then((result) => {
    console.log(result);
    return User.findById(1);
  })
  .then((user) => {
    if (!user) {
      return User.create({ name: "Max", email: "test@example.com" });
    } else return Promise.resolve(user);
  })
  .then((user) => {
    user.createCart();
    console.log(user);
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });
