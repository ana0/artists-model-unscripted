import React, { Fragment } from "react";

const View = (props) => {
  return (
    <Fragment>
      {props.children}
    </Fragment>
  )
};

export default View;