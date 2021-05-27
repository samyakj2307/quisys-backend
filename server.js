const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const port = process.env.PORT || 3000;

const app = express();
process.setMaxListeners(0)  //due to memory leak yeh add karna pada

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

////////////////////////// Faculty Schemas START///////////////////////////////////////////////
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
  examName: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isCompleted: { type: Boolean, required: true },
  allQuestions: [questionSchema],
};

const classSchema = {
  className: { type: String, required: true },
  allExams: [String],
};

const facultySchema = {
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  classes: [String],
};

////////////////////////// Faculty Schemas END///////////////////////////////////////////////

////////////////////////// Faculty Models START///////////////////////////////////////////////
var Faculty = mongoose.model("Faculty", facultySchema);
var FacultyClass = mongoose.model("FacultyClass", classSchema);
var FacultyExam = mongoose.model("FacultyExam", examSchema);

////////////////////////// Faculty Models END///////////////////////////////////////////////

////////////////////////// Faculty Get Post START ///////////////////////////////////////////////

app.post("/facultysignup", (req, res) => {
  //name,email,password
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

app.post("/facultyforgotPassword", (req, res) => {
  //email,newpassword
  Faculty.findOneAndUpdate(
    { email: req.body.email },
    { $set: { password: req.body.newpassword } },
    { new: true }
  )
    .then((faculty) => {
      res.send({ status: "Successfully Updated Password" });
    })
    .catch((e) => res.status(400).send(e));
});

app.get("/facultysignIn", (req, res) => {
  //email,password
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

app.get("/getFacultyAllClass", (req, res) => {
  //fid
  Faculty.findById(req.body.fid)
    .then((faculty) => {
      allClassIds = faculty.classes;

      FacultyClass.find(
        {
          _id: { $in: allClassIds },
        },
        { allExams: 0, __v: 0 }
      )
        .then((facultyClass) => {
          res.send(facultyClass);
        })
        .catch((e) => res.status(400).send(e));
    })
    .catch((e) => res.status(400).send(e));
});

app.get("/getAllExams", (req, res) => {
  //cid,
  FacultyClass.findById(req.body.cid)
    .then((facultyClass) => {
      allExamIds = facultyClass.allExams;

      FacultyExam.find(
        {
          _id: { $in: allExamIds },
        },
        { allQuestions: 0, __v: 0 }
      )
        .then((facultyExam) => {
          res.send(facultyExam);
        })
        .catch((e) => res.status(400).send(e));
    })
    .catch((e) => res.status(400).send(e));
});

app.get("/getExamQuestions", (req, res) => {
  //eid
  FacultyExam.findById(req.body.eid, { __v: 0 })
    .then((facultyExam) => {
      res.send(facultyExam);
    })
    .catch((e) => res.status(400).send(e));
});

app.post("/editExamQuestions", (req, res) => {
  //eid,examDetails
  FacultyExam.findByIdAndUpdate(req.body.eid, req.body.examDetails)
    .then((facultyExam) => {
      res.send({ status: "Successfully Updated Exam Details" });
    })
    .catch((e) => res.status(400).send(e));
});

app.post("/addClass", (req, res) => {
  // fid,className,
  const newClass = new FacultyClass({
    className: req.body.className,
  });

  newClass.save(function (err) {
    if (!err) {
      Faculty.findById(req.body.fid)
        .then((faculty) => {
          const currentClasses = faculty.classes;
          faculty.classes = [...currentClasses, newClass._id];
          return faculty.save();
        })
        .then((faculty) => {
          res.send({ status: "Added class Successfully" });
        })
        .catch((e) => res.status(400).send(e));
    } else {
      res.send(err);
    }
  });
});

app.post("/addExam", (req, res) => {
  //examDetails,cid
  const newExam = new FacultyExam(req.body.examDetails);

  newExam.save(function (err) {
    if (!err) {
      FacultyClass.findById(req.body.cid)
        .then((facultyClass) => {
          const currentExam = facultyClass.allExams;
          facultyClass.allExams = [...currentExam, newExam._id];
          return facultyClass.save();
        })
        .then((facultyClass) => {
          res.send({ status: "Added class Successfully" });
        })
        .catch((e) => res.status(400).send(e));
    } else {
      res.send(err);
    }
  });
});

// app.post("/verifiedResponses", (req, res) => {
//   //sid,eid,qid,marksAwarded
//   StudentExamModel.findOne({ studentId: req.body.sid, examId: req.body.eid }, {studentId:0,examId:0,isExamCompleted:0})
//     .then((studentExamModel) => {
//       // res.send({ status: "Successfully Updated Password" });
//     })
//     .catch((e) => res.status(400).send(e));
// });
////////////////////////// Faculty Get Post END ///////////////////////////////////////////////

////////////////////////// Student Schemas START ///////////////////////////////////////////////
const studentSchema = {
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  classes: [String],
};

const studentAnswerSchema = new mongoose.Schema({
  _id: false,
  questionId: { type: String, required: true, unique: true },
  answered: String,
  marksAwarded: Number,
});
studentAnswerSchema.index({ questionId: 1 });

const studentExamSchema = new mongoose.Schema({
  _id: false,
  studentId: { type: String, required: true },
  examId: { type: String, required: true },
  isExamCompleted: { type: String, required: true },
  studentAnswerSheet: [studentAnswerSchema],
});

studentExamSchema.index({ studentId: 1, examId: 1 }, { unique: true });

////////////////////////// Student Schemas END  ///////////////////////////////////////////////

////////////////////////// Student Models START ///////////////////////////////////////////////
const Student = mongoose.model("Student", studentSchema);
const StudentAnswerModel = mongoose.model(
  "StudentAnswerModel",
  studentAnswerSchema
);
const StudentExamModel = mongoose.model("StudentExamModel", studentExamSchema);
////////////////////////// Student  Models END  ///////////////////////////////////////////////

////////////////////////// Student Get Post START ///////////////////////////////////////////////

app.post("/studentSignUp", (req, res) => {
  //name,email,password
  const newStudent = new Student({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });

  newStudent.save(function (err) {
    if (!err) {
      res.send("Successfully added a new Student.");
    } else {
      res.send(err);
    }
  });
});

app.post("/studentForgotPassword", (req, res) => {
  //email,newpassword
  Student.findOneAndUpdate(
    { email: req.body.email },
    { $set: { password: req.body.newpassword } },
    { new: true }
  )
    .then((student) => {
      res.send({ status: "Successfully Updated Password" });
    })
    .catch((e) => res.status(400).send(e));
});

app.get("/studentSignIn", (req, res) => {
  //email,password
  Student.findOne({ email: req.body.email }, { classes: 0, name: 0, __v: 0 })
    .then((student) => {
      if (student === null) {
        res.send({ status: "Unregistered User" });
      } else {
        if (student.password === req.body.password) {
          res.send({ status: "Password Verified" });
        } else {
          res.send({ status: "Invalid Password" });
        }
      }
    })
    .catch((e) => res.status(400).send(e));
});

app.post("/addClass", (req, res) => {
  //sid,cid

  Student.findById(req.body.sid)
    .then((student) => {
      const allClasses = student.classes;
      student.classes = [...allClasses, req.body.cid];
      return student.save();
    })
    .then((student) => {
      res.send({ status: "Added class Successfully" });
    })
    .catch((e) => res.status(400).send(e));
});

app.get("/getStudentAllClass", (req, res) => {
  //sid
  Student.findById(req.body.sid)
    .then((student) => {
      allClassIds = student.classes;

      FacultyClass.find(
        {
          _id: { $in: allClassIds },
        },
        { allExams: 0, __v: 0 }
      )
        .then((facultyClass) => {
          res.send(facultyClass);
        })
        .catch((e) => res.status(400).send(e));
    })
    .catch((e) => res.status(400).send(e));
});

app.post("/submitExam", (req, res) => {
  //studentId,examId,studentAnswerSheet
  const newStudentExamModel = new StudentExamModel({
    studentId: req.body.studentId,
    examId: req.body.examId,
    studentAnswerSheet: req.body.studentAnswerSheet,
    isExamCompleted: true,
  });
  newStudentExamModel.save(function (err) {
    if (!err) {
      res.send("Successfully submitted answers.");
    } else {
      res.send(err);
    }
  });
});

// {
//   "studentId":"60afbc3ef17b5d0fdc93be9e",
//   "examId":"60afbc3ef17b5d0fdc93be9e",
//   "studentAnswerSheet":[
//       {
//           "questionId":"60afc50124059e354c5be6f5",
//           "answered":"Hello"
//       }
//   ]

// }

////////////////////////// Student Get Post END   ///////////////////////////////////////////////

app.listen(3000, function () {
  console.log(`Server started on port ${port}`);
});

// {
//   "fid":"60ae7480ac19e6240ce6c9fa",
//   "cid":"60ae74ec2c71d342c030d4e9",
// "examDetails":{
//     "examName":"IPWT Quiz 1",
//     "duration":"3",
//     "date": "24-04-2022",
//     "startTime": "04:00:00",
//     "endTime": "05:00:00",
//     "isCompleted": false,
//     "allQuestions": [{
//         "question":"sdfsdksjfkldsjds",
//         "isText":false,
//         "options":[{
//             "value":"Hello"
//         },
//         {
//             "value":"Hi"
//         }]
//     }]

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
