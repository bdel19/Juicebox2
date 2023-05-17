const express = require("express");
const { getAllTags } = require("../db");

const tagsRouter = express.Router();

tagsRouter.use((req, res, next) => {
  console.log("Request to tagsRouter");

  next();
});

tagsRouter.get("/", async (req, res, next) => {
  const tags = await getAllTags();

  res.send({ tags });
});

module.exports = tagsRouter;
