require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const reportRoutes = require("./routes/reportRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/reports", reportRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Banco conectado");

    app.listen(3000, () => {
      console.log("Servidor rodando");
    });
  })
  .catch((err) => {
    console.log(err);
  });