const mongoose = require("mongoose");

const simpleToDoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  task: { type: String, required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // This specifies that the user field references the "User" model
  },
});

const SimpleToDo = mongoose.model("SimpleToDo", simpleToDoSchema);

// create simple Task function
SimpleToDo.createSimpleTask = async function (title, task, userid) {
  const newTask = new this({
    title,
    task,
    user: userid,
  });
  const savedTask = await newTask.save();
  console.log("\n\nTask added successfully:", savedTask);
  return savedTask;
};
// SimpleToDo.createSimpleTask("this is a title", "is it there?");

module.exports = SimpleToDo;
