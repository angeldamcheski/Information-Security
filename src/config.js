const mongoose = require("mongoose");
const connect = mongoose.connect(
  "mongodb://0.0.0.0/InformationSecurity"
);
console.log(connect);
connect.then(() => {
    console.log("Database connected");
  }).catch(() => {
    console.log("Database cannot connect");
});

const RegisterSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type: String,
        required:true
    }
});

const collection = new mongoose.model("users",RegisterSchema);
module.exports = collection;