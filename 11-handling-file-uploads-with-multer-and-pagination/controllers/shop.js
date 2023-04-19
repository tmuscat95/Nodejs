const Product = require("../models/product");
const Order = require("../models/order");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdf");

const ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1; //NaN Evaluates to false when treated as a boolean
  let totalItems;

  Product.find()
    .count()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "Products",
        path: "/products",
        totalProducts: totalItems,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Match.ceil(totalItems / ITEMS_PER_PAGE),
        currentPage: page,
      });
    })
    .catch((err) => {
      console.log(err);
      next(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//Pagination Logic
exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1; //NaN Evaluates to false when treated as a boolean
  let totalItems;

  Product.find()
    .count()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        totalProducts: totalItems,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Match.ceil(totalItems / ITEMS_PER_PAGE),
        currentPage: page,
      });
    })
    .catch((err) => {
      console.log(err);
      next(err);
    });
  /*
  Product.find()
    .skip((page - 1) * ITEMS_PER_PAGE) //skip over a number of items in the database
    .limit(ITEMS_PER_PAGE) // only gets a given number of items from the db
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
    */
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items;
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No order Found"));
      }
      if (order.user.userId.toString() === req.user._id.toString()) {
        return next(new Error("Unauthorized"));
      }

      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);

      const pdfDoc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="'${invoice}'"`
      );
      pdfDoc.pipe(fs.createWriteStream(invoicePath)); //data added to the pdfDoc stream will be piped to response and a write stream.
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text("Invoice", { underline: true });
      pdfDoc.text("--------------------------");
      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc
          .fontSize(14)
          .text(
            prod.product.title +
              "-" +
              prod.quantity +
              " x" +
              `${prod.product.price}$`
          );
      });
      pdfDoc.text("------------------------");
      pdfDoc.text(`Total Price: $ ${totalPrice}`);
      pdfDoc.end();

      /*   
  //Preloading file; not always best option, uses a lot of memory so can cause server to crash for larger files.
  fs.readFile(invoicePath, (err, data) => {
    if (err) {
      next(err);
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="'${invoice}'"`); //will open a download dialog.
    //res.setHeader("Content-Disposition",`inline`); //displays file in browser.
    res.send(data);
  }); */

      //Stream content in chunks instead.
      //const file = fs.createReadStream(invoicePath);
      //res.setHeader("Content-Type", "application/pdf");
      //res.setHeader("Content-Disposition", `attachment; filename="'${invoice}'"`); //will open a download dialog.
      //res.setHeader("Content-Disposition",`inline`); //displays file in browser.
      //file.pipe(res);
      /**response object is in fact a writable stream; pipe function writes data in chunks to the stream
       * passed as argument.
       */
    })
    .catch((err) => next(err));
};
