const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const port = process.env.PORT || 3000;

const app = express();
process.setMaxListeners(0); //due to memory leak yeh add karna pada

app.use(bodyParser.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

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
  optionId: { type: String, required: true },
  value: { type: String, required: true },
};

const questionSchema = {
  questionId: { type: String, required: true },
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

app.post("/facultySignUp", (req, res) => {
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

app.post("/facultyForgotPassword", (req, res) => {
  //email,newpassword
  Faculty.findOneAndUpdate(
    { email: req.body.email },
    { $set: { password: req.body.newpassword } },
    { new: true }
  )
    .then((faculty) => {
      res.send("Successfully Updated Password");
    })
    .catch((e) => res.status(400).send(e));
});

app.get("/facultySignIn", (req, res) => {
  //email,password
  Faculty.findOne({ email: req.query.email }, { __v: 0 })
    .then((faculty) => {
      if (faculty === null) {
        res.send("Unregistered User");
      } else {
        if (faculty.password === req.query.password) {
          res.send(faculty);
        } else {
          res.send("Invalid Password");
        }
      }
    })
    .catch((e) => res.status(400).send(e));
});

app.get("/getFacultyAllClass", (req, res) => {
  //fid
  Faculty.findById(req.query.fid)
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
  FacultyClass.findById(req.query.cid)
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
  FacultyExam.findById(req.query.eid, { __v: 0 })
    .then((facultyExam) => {
      res.send(facultyExam);
    })
    .catch((e) => res.status(400).send(e));
});

app.post("/editExamQuestions", (req, res) => {
  //eid,examDetails
  FacultyExam.findByIdAndUpdate(req.body.eid, req.body.examDetails)
    .then((facultyExam) => {
      res.send("Successfully Updated Exam Details");
    })
    .catch((e) => res.status(400).send(e));
});

app.post("/facultyAddClass", (req, res) => {
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
          res.send(newClass._id);
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
  if (req.body.cid !== "") {
    newExam.save(function (err) {
      if (!err) {
        FacultyClass.findById(req.body.cid)
          .then((facultyClass) => {
            const currentExam = facultyClass.allExams;
            facultyClass.allExams = [...currentExam, newExam._id];
            return facultyClass.save();
          })
          .then((facultyClass) => {
            res.send({
              status: "Added class Successfully",
              eid: newExam._id,
            });
          })
          .catch((e) => res.status(400).send(e));
      } else {
        res.send(err);
      }
    });
  } else {
    res.send("CID Not Provided");
  }
});

////////////////////////// Faculty Get Post END ///////////////////////////////////////////////

////////////////////////// Student Schemas START ///////////////////////////////////////////////
const studentSchema = {
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  classes: [String],
  allExamsCompleted: [String],
};

const studentAnswerSchema = new mongoose.Schema({
  qid: { type: String, required: true },
  question: { type: String, required: true },
  answered: String,
  marksAwarded: Number,
});
studentAnswerSchema.index({ qid: 1 });

const studentExamSchema = new mongoose.Schema({
  sid: { type: String, required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  examName: { type: String, required: true },
  eid: { type: String, required: true },
  isExamCompleted: { type: String, required: true },
  studentAnswerSheet: [studentAnswerSchema],
  totalMarks: Number,
});

studentExamSchema.index({ sid: 1, eid: 1 }, { unique: true });

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

app.post("/verifiedResponses", (req, res) => {
  //sid,eid
  StudentExamModel.findOneAndUpdate(
    { sid: req.body.sid, eid: req.body.eid },
    {
      studentAnswerSheet: req.body.studentAnswerSheet,
      totalMarks: req.body.totalMarks,
    }
  )
    .then((studentExamModel) => {
      res.send("Successfully Saved Marks/Responses");
    })
    .catch((e) => res.status(400).send(e));
});

app.get("/getVerifiedResponses", (req, res) => {
  //eid
  StudentExamModel.find({ eid: req.query.eid }, { _id: 0, __v: 0 })
    .then((studentExamModel) => {
      console.log(studentExamModel);
      res.send(studentExamModel);
    })
    .catch((e) => res.status(400).send(e));
});

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
      res.send("Successfully Updated Password");
    })
    .catch((e) => res.status(400).send(e));
});

app.get("/studentSignIn", (req, res) => {
  //email,password
  Student.findOne({ email: req.query.email }, { __v: 0 })
    .then((student) => {
      if (student === null) {
        res.send("Unregistered User");
      } else {
        if (student.password === req.query.password) {
          res.send(student);
        } else {
          res.send("Invalid Password");
        }
      }
    })
    .catch((e) => res.status(400).send(e));
});

app.post("/studentAddClass", (req, res) => {
  //sid,cid

  // { __v: 0, allExams: 0 }
  FacultyClass.findById(req.body.cid)
    .then((facultyClassModel) => {
      res.send(facultyClassModel);
      if (facultyClassModel !== null) {
        Student.findById(req.body.sid)
          .then((student) => {
            const allClasses = student.classes;
            student.classes = [...allClasses, req.body.cid];
            return student.save();
          })
          .then((student) => {
            res.send(facultyClassModel);
          })
          .catch((e) => res.status(400).send(e));
      } else {
        res.send("Invalid Class ID");
      }
    })
    .catch((e) => res.status(400).send("Invalid Class ID"));
});

// {
//   "studentId":"60afd6072da440492056f555",
//   "examId":"60afbc3ef17b5d0fdc93be9e",
//   "studentAnswerSheet":[
//       {
//           "questionId":"60afc50124059e354c5be6f5",
//            "question":"hdjfshfkjsd"
//           "answered":"Hello"
//       }
//   ]
// }

// {
//   "sid":"60b10224bb51af3a681c8ae1",
//   "eid":"60afbc3ef17b5d0fdc93be9e",
//   "totalMarks":10,
//   "studentAnswerSheet":[
//       {
//           "_id": "60b10a96f55da554e40f540a",
//           "questionId":"60afc50124059e354c5be6f5",
//           "answered": "Hello",
//           "marksAwarded":0
//       }
//   ]
// }

app.get("/getStudentAllClass", (req, res) => {
  //sid
  Student.findById(req.query.sid)
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
  //sid,eid,studentAnswerSheet
  const newStudentExamModel = new StudentExamModel({
    sid: req.body.sid,
    studentName: req.body.studentName,
    studentEmail: req.body.studentEmail,
    examName: req.body.examName,
    eid: req.body.eid,
    studentAnswerSheet: req.body.studentAnswerSheet,
    isExamCompleted: true,
  });
  newStudentExamModel.save(function (err) {
    if (!err) {
      Student.findById(req.body.sid)
        .then((student) => {
          const currentExams = student.allExamsCompleted;
          student.allExamsCompleted = [
            ...currentExams,
            newStudentExamModel.eid,
          ];
          return student.save();
        })
        .then((student) => {
          FacultyExam.findById(req.body.eid)
            .then((facultyExam) => {
              facultyExam.isCompleted = true;
              return facultyExam.save();
            })
            .then((facultyExam) => {
              res.send("Successfully submitted answers.");
            })
            .catch((e) => res.status(400).send(e));
        })
        .catch((e) => res.status(400).send(e));
    } else {
      res.send(err);
    }
  });
});

app.get("/sendMail", (req, res) => {

var transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: '',
    pass: ''
  }

});



  var mailOptions = {
    from: "quisys.exam@gmail.com",
    to: "",
    subject: "You have failed in exam",
    attachments: [{
      filename: 'quisysLogo.png',
      path: __dirname +'/quisysLogo.png',
      cid: 'logo' //my mistake was putting "cid:logo@cid" here! 
 }],
    html:
      "<body>" +
      "<h1>You have failed in exam</h1>" +
      '<img src="cid:logo">'+
      "<h2>This is regarding your quiz you gave in quisys platform</h2>" +
      "<h4>I regret to inform you that you have scored terrible!!! <br> i am afraid you may no longer continue your studies in VIT</h4>" +
      "<h3> Contact your HOD Mr. Swapna Sambhav Nayak or your Dean Mr. Samyak Jain to check your marks</h3>" +
      "<p> <strong>quisys</strong> is a very popular platform for conducting quizzes </p>" +
      "</body>",
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
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
