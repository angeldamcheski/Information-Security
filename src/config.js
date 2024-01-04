const mongoose = require("mongoose");
const connect = mongoose.connect("mongodb://0.0.0.0/InformationSecurity");
console.log(connect);
connect
  .then(() => {
    console.log("Database connected");
  })
  .catch(() => {
    console.log("Database cannot connect");
  });

const RegisterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  userRole: {
    type: String,
  },
  secret: {
    type: Object,
  },
  confirmCode: { type: String },
  isConfirmed: {
    type: Boolean,
    default: false,
  },
});
//Available user roles: admin, paid, free
//informaciskabezbednost@2
//angelinfosec262@gmail.com
//jqev xqgv czaz epqj
const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  refUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
});
const posts = new mongoose.model("posts", PostSchema);
const collection = new mongoose.model("users", RegisterSchema);
// module.exports = collection;
module.exports = {
  collection,
  posts,
};
