import React, { Fragment } from "react";

const DisplayQuestion = ({ data }) => {

  return (
    <Fragment>
      <p>{`${data.id}  ${data.question}`}</p>
    </Fragment>
  )
}

export default DisplayQuestion;