import React, { Fragment } from "react";

const DisplaySession = ({ data }) => {

  return (
    <Fragment>
      <p>{`${data.id}  ${data.name}`}</p>
    </Fragment>
  )
}

export default DisplaySession;