import React from "react";
import { useForm } from "react-hook-form";
import axios from "axios";

const CreateSession = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = (data) => {
    console.log(data)
    axios.post(`${process.env.REACT_APP_API_URL}sessions`, data)
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
      <h3>Create Session</h3>
      <p><input {...register("name")} /></p>
      <p><input {...register("pollsId")} /></p>
      {/* errors will return when field validation fails  */}
      {errors.text && <p><span className="error">Sorry, error</span></p>}

      <p><input type="submit" /></p>
    </form>
  )
}

export default CreateSession;