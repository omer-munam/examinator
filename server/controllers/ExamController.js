'use strict'

const { Exam } = require('../schema/exam');
const { Question } = require('../schema/question');

const mongoose = require('mongoose');
const moment = require('moment');

class ExamController {


    //Instructor Create Exam
    static async addExam(req, res) {
        try {
            let checkExam = await Exam.findOne({ name: req.body.name });
            if (checkExam) {
                return res.status(401).send({ success: false, msg: 'Exam Already Exits' });
            } else {
                let name = req.body.name;
                let courseId = req.body.courseId;
                let duration = req.body.duration;
                let startTime = moment(req.body.startTime);
                let totalMarks = req.body.totalMarks;

                let exam = new Exam({
                    name: name,
                    courseId: mongoose.Types.ObjectId(courseId),
                    duration: duration,
                    startTime: startTime,
                    totalMarks: totalMarks
                });
                await exam.save();
                let examStored = await Exam.findOne({ name: name });
                var questions = [];
                req.body.questions.forEach((question) => {
                    questions.push({
                        statement: question.statement,
                        options: question.options,
                        correctOption: question.correctOption,
                        marks: question.marks,
                        examId: mongoose.Types.ObjectId(examStored._id)
                    })
                })
                await Question.insertMany(questions);
                return res.status(200).send({ success: true, msg: 'Exam Added Successfuly', exam: await Exam.findOne({ courseId: courseId }) });
            }


        } catch (error) {
            console.log(error)
            return res.status(400).send({ success: false, msg: error });
        }
    }

    //Instructor Get Exam of specific course by its id
    static async getExam(req, res) {
        try {
            let exam = await Exam.aggregate([
                {
                    $match: {
                        courseId: mongoose.Types.ObjectId(req.query.courseId)
                    }
                },
                {
                    $lookup: {
                        from: "questions",
                        localField: "_id",
                        foreignField: "examId",
                        as: "question"
                    }
                }
            ]);
            if (exam) {
                return res.status(200).send({ success: true, msg: 'Exam Fetched Successfuly', exams: exam });
            } else {
                return res.status(401).send({ success: false, msg: 'Exam does not exist!' })
            }

        } catch (error) {
            console.log(error)
            return res.status(400).send({ success: false, msg: error });
        }
    }

    //Instructor update exam and questions
    static async updateExam(req, res) {
        try {
            let checkExam = await Exam.findOne({ name: req.body.name });
            if (!checkExam) {
                return res.status(401).send({ success: false, msg: 'Exam does not exist!' });
            } else {
                let name = req.body.name;
                let duration = req.body.duration;
                let startTime = Date(req.body.startTime);
                let totalMarks = req.body.totalMarks;

                await Exam.findOneAndUpdate({ name: req.body.name }, {
                    $set: {
                        name: name,
                        duration: duration,
                        startTime: startTime,
                        totalMarks: totalMarks
                    }
                });
                await Question.deleteMany({ examId: checkExam._id })
                var questions = [];
                req.body.questions.forEach((question) => {
                    questions.push({
                        statement: question.statement,
                        options: question.options,
                        correctOption: question.correctOption,
                        marks: question.marks,
                        examId: mongoose.Types.ObjectId(checkExam._id)
                    })
                })
                await Question.insertMany(questions);
                return res.status(200).send({ success: true, msg: 'Exam Updated Successfuly', exam: await Exam.findOne({ courseId: courseId }) });
            }


        } catch (error) {
            console.log(error)
            return res.status(400).send({ success: false, msg: error });
        }
    }

    //Instructor delete exams and questions
    static async deleteExam(req, res) {
        try {
            let checkExam = await Exam.findOne({ name: req.query.name });
            if (checkExam) {
                let examId = checkExam._id;
                await Exam.deleteOne({ _id: examId });
                await Question.deleteMany({ examId: examId });
                return res.status(200).send({ success: true, msg: 'Exam Deleted Successfuly' });
            } else {
                return res.status(401).send({ success: false, msg: 'Exam does not exist!' })
            }

        } catch (error) {
            console.log(error)
            return res.status(400).send({ success: false, msg: error });
        }
    }
}

module.exports = { ExamController }