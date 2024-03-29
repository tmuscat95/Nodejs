const path = require("path");
const isAuth = require("../middleware/is-auth");
const express = require("express");
const { body } = require("express-validator/check");
const adminController = require("../controllers/admin");

const router = express.Router();

//Multiple middlwewares are executed left to right; second middleware will only be hit if request makes it through isAuth
// /admin/add-product => GET
router.get("/add-product", isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get("/products", isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post(
  "/add-product",
  body("title").isString().isLength({ min: 3 }).trim(),
  body("imageUrl").isURL(),
  body("price").isFloat(),
  body("description").isLength({ min: 5, max: 400 }).trim(),
  isAuth,
  adminController.postAddProduct
);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post("/edit-product", isAuth, adminController.postEditProduct);

router.post("/delete-product", isAuth, adminController.postDeleteProduct);

module.exports = router;
