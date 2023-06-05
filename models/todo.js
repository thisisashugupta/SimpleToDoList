const mongoose = require("mongoose");

const simpleToDoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  task: { type: String, required: true },
});

const SimpleToDo = mongoose.model("SimpleToDo", simpleToDoSchema);

// create simple Task function
SimpleToDo.createSimpleTask = async function (title, task) {
  const newTask = new this({
    title,
    task,
  });
  const savedTask = await newTask.save();
  console.log("\n\nTask added successfully:", savedTask);
  return savedTask;
};
// SimpleToDo.createSimpleTask("this is a title", "is it there?");

module.exports = SimpleToDo;
