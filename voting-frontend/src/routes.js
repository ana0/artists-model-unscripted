import React from "react";
import { Route, Routes } from "react-router-dom";

import Home from "./components/Home";
import Admin from "./components/Admin";

// prettier-ignore
const routes = () => (
  <Routes>
    <Route
      Component={Home}
      path="/"
    />
    <Route
      Component={Admin}
      path="/quizmaster"
    />
  </Routes>
);

export default routes;