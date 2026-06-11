const express = require("express");

const router = express.Router();

const {
  getReports,
  createReport,
  updateReport,
  deleteReport
} = require("../controllers/reportController");

router.get("/", getReports);

router.post("/", createReport);

router.put("/:id", updateReport);

router.delete("/:id", deleteReport);

module.exports = router;