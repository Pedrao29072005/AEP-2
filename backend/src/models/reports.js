const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  location: String,
  district: String,
  category: String,
  description: String,
  severity: Number,

  status: {
    type: String,
    default: "Em triagem"
  },

  x: Number,
  y: Number,

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Report", ReportSchema);