const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const port = process.env.PORT || 3000;

const app = express();

app.use(bodyParser.json());
// app.use(express.static("public"));

mongoose
  .connect("mongodb://localhost:27017/quisysDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .catch((err) => console.log(err));

const optionSchema = {
  value: { type: String, required: true },
};

const questionSchema = {
  question: { type: String, required: true },
  isText: { type: Boolean, required: true },
  textAnswer: String,
  options: [optionSchema],
  correctOption: String,
};

const examSchema = {
  examName: { type: String, required: true, unique: true },
  duration: { type: Number, required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isCompleted: { type: Boolean, required: true },
  allQuestions: [questionSchema],
};

const classSchema = {
  className: { type: String, required: true, unique: true },
  allExams: [examSchema],
};

const facultySchema = {
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  classes: [classSchema],
};

var Faculty = mongoose.model("Faculty", facultySchema);
var FacultyClass = mongoose.model("FacultyClass", classSchema);
var FacultyExam = mongoose.model("FacultyExam", examSchema);

app.get("/getSignIn", (req, res) => {
  Faculty.findOne({ email: req.body.email }, { classes: 0, name: 0, __v: 0 })
    .then((faculty) => {
      if (faculty === null) {
        res.send({ status: "Unregistered User" });
      } else {
        if (faculty.password === req.body.password) {
          res.send({ status: "Password Verified" });
        } else {
          res.send({ status: "Invalid Password" });
        }
      }
      res.send(faculty);
    })
    .catch((e) => res.status(400).send(e));
});

app.get("/getAllClass", (req, res) => {
  Faculty.findById(req.body.fid, {
    classes: 1,
    allExams: { $slice: -1 },
    _id: 0,
  })
    .then((faculty) => {
      const allClass = faculty.classes;

      res.send(allClass);
    })
    .catch((e) => res.status(400).send(e));
});

app.post("/signup", (req, res) => {
  const newFaculty = new Faculty({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });

  newFaculty.save(function (err) {
    if (!err) {
      res.send("Successfully added a new Faculty.");
    } else {
      res.send(err);
    }
  });
});

app.post("/addClass", (req, res) => {
  facultyID = req.body.fid;
  const newClass = new FacultyClass({
    className: req.body.cname,
  });

  Faculty.findById(req.body.fid)
    .then((faculty) => {
      const currentClasses = faculty.classes;
      faculty.classes = [...currentClasses, newClass];
      return faculty.save();
    })
    .then((faculty) => {
      res.send({ status: "Added class Successfully" });
    })
    .catch((e) => res.status(400).send(e));
});

app.post("/addExam", (req, res) => {
  const newExam = new FacultyExam(req.body.examDetails);

  Faculty.findById(req.body.fid)
    .then((faculty) => {
      const currentClass = faculty.classes.id(req.body.cid);
      const allExams = currentClass.allExams;
      currentClass.allExams = [...allExams, newExam];
      return faculty.save();
    })
    .then((faculty) => {
      res.send({ status: "Added Exam Successfully" });
    })
    .catch((e) => res.status(400).send(e));
});

app.listen(3000, function () {
  console.log(`Server started on port ${port}`);
});

// {
//   "fid":"60ae7480ac19e6240ce6c9fa",
//   "cid":"60ae74ec2c71d342c030d4e9",
//   "examDetails":{
//       "examName":"IPWT Quiz 1",
//       "duration":"3",
//       "date": "24-04-2022",
//       "startTime": "04:00:00",
//       "endTime": "05:00:00",
//       "isCompleted": false,
//       "allQuestions": [{
//           "question":"sdfsdksjfkldsjds",
//           "isText":false,
//           "options":[{
//               "value":"Hello"
//           },
//           {
//               "value":"Hi"
//           }]
//       }]

//   }
// }

// {
//   "fid":"60ae81e004056213045d74d0",
//   "cname": "STS Class"
// }

// {
//   "name":"Sam",
//   "email":"sdjfklsf",
//   "password": "fjsdlkf"
// }

// fid 60ae826efc829f0fecf9969a
// cid 60ae82b389940718f4a4411f


//TODO Fetch responses and student id from student database to the faculty for checking
