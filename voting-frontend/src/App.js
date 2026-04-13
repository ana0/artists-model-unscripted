import React, { Fragment } from "react";
import { BrowserRouter as Router } from "react-router-dom";

import { QueryClientProvider } from "@tanstack/react-query";

import './App.css';

import { queryClient } from "./services";
import Routes from "./routes";

function App() {
  return (
    <Fragment>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes />
        </Router>
      </QueryClientProvider>
    </Fragment>
  );
}

export default App;