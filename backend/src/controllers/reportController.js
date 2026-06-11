const Report = require("../models/reports");

exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find();

    res.json(reports);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.createReport = async (req, res) => {
  try {
    const report = await Report.create(req.body);

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const updated = await Report.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedAt: Date.now()
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);

    res.json({
      message: "Removido"
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};