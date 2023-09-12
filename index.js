const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const port = 8000;
const multer = require("multer");
const aws = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
app.use(bodyParser.json());
app.use(cors());

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  banner: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  tags: [
    {
      type: String,
    },
  ],
});

const Blog = mongoose.model("Updated-Blogs", blogSchema);

app.post("/blogs", async (req, res) => {
  try {
    const { title, blog, tagList, bannerLink } = req.body;

    const newBlog = new Blog({
      title,
      content: blog,
      tags: tagList,
      banner: bannerLink,
    });

    await newBlog.save();
    if (newBlog) {
      return res
        .status(201)
        .json({ message: "Blog saved successfully", success: true });
    }
    return res.status(201).json({ message: "Unable to Save", success: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving the blog", success: false });
  }
});

// Define the number of items per page

app.get("/blog-list", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const ITEMS_PER_PAGE = parseInt(req.query.items) || 50;
    const pipeline = [
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: (page - 1) * ITEMS_PER_PAGE,
      },
      {
        $limit: ITEMS_PER_PAGE,
      },
    ];

    const result = await Blog.aggregate(pipeline);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const bannerUpload = multer();
app.post("/upload-image", bannerUpload.single("image"), async (req, res) => {
  try {
    const bannerFile = req.file;
    if (!bannerFile) {
      return res.status(400).json({ error: "No File Found To Upload" });
    }
    const spacesEndpoint = new aws.Endpoint(
      "https://nyc3.digitaloceanspaces.com"
    );
    const s3 = new aws.S3({
      endpoint: spacesEndpoint,
      accessKeyId: "DO00MBPZL39YGJ2FXREK",
      secretAccessKey: "FcHfIRi/kRNS9tyyPJ0GoE4K9SNNcfbPPHw4ydGNgLE",
    });

    const imageID = uuidv4();
    const filePath = `images/${imageID}-${bannerFile.originalname}`;
    await s3
      .putObject({
        Bucket: "easyhaionline",
        Key: filePath,
        ACL: "public-read",
        Body: bannerFile.buffer,
      })
      .promise();
    const bannerAccessURI = `https://easyhaionline.nyc3.digitaloceanspaces.com/${filePath}`;
    res.status(200).json({ success: true, data: { link: bannerAccessURI } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: true, data: null });
  }
});

mongoose
  .connect(
    "mongodb+srv://easyhaionline:DFAjWJ1vLrNDr2ul@cluster0.moljno4.mongodb.net/easyhaionline?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 100000,
    }
  )
  .then(() => {
    (port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });



