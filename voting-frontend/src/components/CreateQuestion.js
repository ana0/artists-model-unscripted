import React from "react";
import { useForm } from "react-hook-form";
import axios from "axios";

const CreateQuestion = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = (data) => {
    console.log(data)
    data.answers = [{ answer: data.answer1, nextPoll: data.nextPoll1 },
      { answer: data.answer2, nextPoll: data.nextPoll2 }];
    axios.post(`${process.env.REACT_APP_API_URL}polls`, data)
    .then(function (response) {
      console.log(response);
    })
    .catch(function (error) {
      console.log(error);
    });
  }

  console.log(errors)

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h3>Create Question</h3>
      <p><input {...register("question")} /></p>
      <p><input {...register("answer1")} /></p>
      <p><input {...register("nextPoll1")} /></p>
      <p><input {...register("answer2")} /></p>
      <p><input {...register("nextPoll2")} /></p>
      {/* errors will return when field validation fails  */}
      {errors.text && <p><span className="error">Sorry, error</span></p>}

      <p><input type="submit" /></p>
    </form>
  )
}

export default CreateQuestion;