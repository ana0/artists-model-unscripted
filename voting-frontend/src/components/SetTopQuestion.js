import React from "react";
import { useForm } from "react-hook-form";
import axios from "axios";

const CreateQuestion = () => {
  const {
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = (data) => {
    console.log(data)
    axios.put(`${process.env.REACT_APP_API_URL}polls`, data)
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
      <h3>Open Next Question</h3>
      {/* errors will return when field validation fails  */}
      {errors.text && <p><span className="error">Sorry, error</span></p>}

      <p><input type="submit" /></p>
    </form>
  )
}

export default CreateQuestion;