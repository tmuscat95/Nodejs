const User = require("../models/user");
const Post = require("../models/post");

const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");

module.exports = {
  deletePost: async function ({ id }, req) {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated.");
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(id);
    if (!post) {
      const error = new Error("No Post F");
      error.code = 404;
      throw error;
    }
    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error("Not Authorized");
      error.code = 403;
      throw error;
    }
    
  },
  updatePost: async function ({ id, postInput }, req) {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated.");
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(id).populate("creator");
    if (!post) {
      const error = new Error("Not Authenticated.");
      error.code = 401;
      throw error;
    }

    if (post.creator._id.toString() === req.userId.toString()) {
      const error = new Error("Not Authorized");
      error.code = 403;
      throw error;
    }

    const errors = [];
    if (!validator.isEmail(email)) {
      errors.push({ message: "Email Is Invalid" });
    }
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: "Insufficient Length." });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid Input");
      error.data = errors;
      error.statusCode = 422;
      throw error;
    }
    post.title = postInput.title;
    post.content = postInput.content;

    if (postInput.imageUrl !== "undefined") {
      post.imageUrl = postInput.imageUrl;
    }

    const updatedPost = await post.save();
    return {
      ...updatedPost.toJSON(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString(),
    };
  },
  post: async function ({ id }, req) {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated.");
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(id).populate("creator");
    if (!post) {
      const error = new Error("No Post found");
      error.code = 404;
      throw error;
    }
    return {
      ...post.toJSON(),
    };
  },
  posts: async function (args, req) {
    const { page } = args;
    if (!req.isAuth) {
      const error = new Error("Not Authenticated.");
      error.code = 401;
      throw error;
    }

    if (!page) {
      page = 1;
    }

    const perPage = 2;
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("creator");

    return { posts: posts.map((p) => p.toJSON()), totalPosts };
  },
  hello() {
    return {
      text: "Hello World!",
      views: 1,
    };
  },
  login: async function (args, req) {
    const { email, password } = args;
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("User not found.");
      error.code = 401;
      throw error;
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      const error = new Error("User not found.");
      error.code = 401;
      throw error;
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      "secret",
      { expiresIn: "1h" }
    );

    return { token: token, userId: user._id.toString() };
  },
  createUser: async function (args, req) {
    const { email, password, name } = args.userInput;

    const errors = [];
    if (!validator.isEmail(email)) {
      errors.push({ message: "Email Is Invalid" });
    }
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: "Insufficient Length." });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid Input");
      error.data = errors;
      error.statusCode = 422;
      throw error;
    }
    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      const error = new Error("User Already Exists");
      throw error;
    }

    const hashedPw = await bcrypt.hash(password, 12);
    const user = new User({ email: email, password: hashedPw, name: name });
    const createdUser = await user.save();

    return {
      ...createdUser.toJSON(),
    };
  },

  createPost: async function (args, req) {
    const { postInput } = args;
    if (!req.isAuth) {
      const error = new Error("Not Authenticated.");
      error.code = 401;
      throw error;
    }
    const errors = [];
    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ message: "Title is Invalid" });
    }
    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({ message: "Content is Invalid" });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid Input");
      error.data = errors;
      error.statusCode = 422;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("Not Authenticated.");
      error.code = 401;
      error.data = errors;
      throw error;
    }
    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user,
    });
    const createdPost = await post.save();
    user.posts.push(createdPost);
    await user.save();
    return {
      ...createdPost.toJson(),
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },
};
