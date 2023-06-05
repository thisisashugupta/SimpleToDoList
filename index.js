require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.port || 1337;
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const SimpleToDo = require("./models/todo");

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

// body parser // app.use(express.json());
app.use(express.static("css"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");

// EXPRESS APP ROUTES

// home
app.get("/", (req, res) => {
  res.redirect("/tasks");
});

// Fetch all tasks
app.get("/tasks", async (req, res) => {
  const tasks = await SimpleToDo.find();
  console.log("Fetch all tasks.");
  const editMode = false;
  res.render("index", { tasks, editMode });
});

// Get a task
app.get("/tasks/:id/edit", async (req, res) => {
  const tasks = await SimpleToDo.find();
  const { id } = req.params;
  console.log("Get a task.");
  const oldTask = await SimpleToDo.findOne({ _id: id });
  if (oldTask == null) {
    res.redirect("/");
  } else {
    const editMode = true;
    res.render("index", { tasks, editMode, oldTask });
  }
});

// Add a task
app.post("/tasks", async (req, res) => {
  const { title, task } = req.body;
  await SimpleToDo.createSimpleTask(title, task);
  res.redirect("/");
});

// Update a task
app.patch("/tasks/:_id", async (req, res) => {
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

// Delete a task
app.delete("/tasks/:_id", async (req, res) => {
  await SimpleToDo.deleteOne({ _id: req.params._id });
  console.log(`Deleted a task with id ${req.params._id}`);
  res.redirect("/");
});

// Delete all tasks
app.delete("/tasks", async (req, res) => {
  await SimpleToDo.deleteMany();
  console.log("Deleted all tasks.");
  res.redirect("/");
});

// END
connectDB().then(startListening());

console.log("hi!");
