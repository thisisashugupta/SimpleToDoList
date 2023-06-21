require("dotenv").config();
const PORT = process.env.port || 1337;
const express = require("express");
const app = express();
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const SimpleToDo = require("./src/models/todo");
const User = require("./src/models/user");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("connect-flash");

mongoose.set("strictQuery", false);
// connect to simpletodo database
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

function startListening() {
  app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
  });
}

/*

  async function main() {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  }
  main().catch((err) => {
    console.log(err);
    process.exit(1);
  });

*/

// view engine setup
app.set("views", "src/views");
app.set("view engine", "ejs");

// serving static files
app.use(express.static(__dirname));
app.use(express.static("public/css"));
app.use(express.static("src/models"));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use((req, res, next) => {
  console.log(req.method, req.path /* req.socket.remoteAddress */);
  next();
});
app.use(session({ secret: "$2b$12$OmXeqcYs8vAc6xMwRh1Z" }));
// $2b$12$OmXeqcYs8vAc6xMwRh1Z
app.use(flash());

const requireLogin = (req, res, next) => {
  if (!req.session.session_id) {
    return res.redirect("/login");
  }
  next();
};

// EXPRESS APP ROUTES
app.get("/", (req, res) => {
  res.redirect("/tasks");
});

// GET REGISTER
app.get("/register", (req, res) => {
  // if already logged in
  if (req.session.session_id) {
    req.flash("loggedInMessage", "Already logged in!"); // Set a flash message by passing the key, followed by the value, to req.flash().
    return res.redirect("/tasks");
  }
  // show form to register
  res.render("signup", { messages: req.flash("userExistsMessage") });
});

// POST REGISTER
app.post("/register", async (req, res) => {
  // post request to register a new user
  const { username, password } = req.body;
  const userExists = await User.findOne({ username: username });
  // if username is already taken
  if (userExists) {
    req.flash("userExistsMessage", "Username already taken. Try Again");
    return res.redirect("/register");
  }

  const hashedPw = await bcrypt.hash(password, 12); // (password, saltRounds)
  const newUser = new User({ username: username, password: hashedPw });
  const ans = await newUser.save();
  req.session.session_id = newUser._id;
  console.log(ans);
  res.redirect("/");
});

// GET LOGOUT
app.post("/logout", (req, res) => {
  if (req.session.session_id) {
    // req.session.session_id = null;
    req.session.destroy();
    return res.redirect("/login");
  } else res.send("you are already logged out");
});

// GET LOGIN
app.get("/login", (req, res) => {
  // show form for auth
  if (req.session.session_id) {
    console.log("already logged in with session id: ", req.session.session_id);
    return res.send("already logged in. log out first.");
  }
  res.render("login", { messages: req.flash("invalidMessage") });
});

// POST LOGIN
app.post("/login", async (req, res) => {
  // check for auth
  const { username, password } = req.body;
  const user = await User.findOne({ username: username });
  if (user === null) {
    req.flash("invalidMessage", "Invalid Username or Password");
    return res.redirect("/login");
  }
  const result = await bcrypt.compare(password, user.password);
  if (!result) {
    req.flash("invalidMessage", "Invalid username or password");
    return res.redirect("/login");
  } else {
    console.log("Logged in!");
    req.session.session_id = user._id; // setting user ID as session ID
    res.redirect("/tasks");
  }
});

// GET TASKS
app.get("/tasks", requireLogin, async (req, res) => {
  const tasks = await SimpleToDo.find({ user: req.session.session_id });
  const user = await User.findById(req.session.session_id);
  console.log("Fetch all tasks.", tasks);
  const editMode = false;
  res.render("index", {
    tasks,
    editMode,
    messages: req.flash("loggedInMessage"),
    User: user.username,
  });
});

// GET TASKS/id/EDIT
app.get("/tasks/:id/edit", requireLogin, async (req, res) => {
  const tasks = await SimpleToDo.find({ user: req.session.session_id });
  const user = await User.findById(req.session.session_id);
  const { id } = req.params;
  console.log("Get a task.");
  const oldTask = await SimpleToDo.findOne({ _id: id });
  if (oldTask == null) {
    res.redirect("/");
  } else {
    const editMode = true;
    res.render("index", {
      tasks,
      editMode,
      oldTask,
      messages: "",
      User: user.username,
    });
  }
});

// POST TASKS
app.post("/tasks", requireLogin, async (req, res) => {
  const { title, task } = req.body;
  const userid = req.session.session_id;
  console.log(userid);
  await SimpleToDo.createSimpleTask(title, task, userid);
  res.redirect("/");
});

// PATCH TASKS/id
app.patch("/tasks/:_id", requireLogin, async (req, res) => {
  const { _id } = req.params;
  const { title, task } = req.body;
  await SimpleToDo.findByIdAndUpdate(_id, { title, task }, { new: true });
  console.log(`updated a task with id ${_id}`);
  res.redirect("/");
  // fetch the task id
  // show the pre-existing details to the text box
  // allow user to make changes
  // when update task is pressed, the task is updated.
});

// DELETE TASKS/id
app.delete("/tasks/:_id", requireLogin, async (req, res) => {
  await SimpleToDo.deleteOne({ _id: req.params._id });
  console.log(`Deleted a task with id ${req.params._id}`);
  res.redirect("/");
});

// DELETE TASKS
app.delete("/tasks", requireLogin, async (req, res) => {
  await SimpleToDo.deleteMany({ user: req.session.session_id });
  console.log("Deleted all tasks.");
  res.redirect("/");
});

// END
connectDB().then(startListening());

console.log("hi!");
