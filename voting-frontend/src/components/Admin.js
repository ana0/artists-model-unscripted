import React, { Fragment } from "react";
import CreateQuestion from './CreateQuestion';
import CreateSession from './CreateSession';
import DisplayQuestion from "./DisplayQuestion";
import DisplaySession from "./DisplaySession";
import SetTopSession from './SetTopSession';
import SetTopQuestion from './SetTopQuestion';
import CloseQuestion from "./CloseQuestion";
import { useQuery } from "@tanstack/react-query";

import { getQuestions, getSessions, getTopSession } from "../services";

import View from "./View";

const Admin = () => {
  const questions = useQuery({
    queryKey: [`getQuestions`],
    queryFn: async () => getQuestions()
  })

  const sessions = useQuery({
    queryKey: [`getSessions`],
    queryFn: async () => getSessions()
  })

  const topsession = useQuery({
    queryKey: [`getTopSession`],
    queryFn: async () => getTopSession()
  })

  console.log("top", topsession)

  return (
    <Fragment>
      <View>
        <CreateQuestion />
        <h3>Questions</h3>
        {questions.data ? questions.data.polls.map((i) => {
          return <DisplayQuestion key={i.id} data={i} />
        }) : null}
        <CreateSession />
        <h3>Sessions</h3>
        {sessions.data ? sessions.data.sessions.map((i) => {
          return <DisplaySession key={i.id} data={i} />
        }) : null}
        <h3>Current Session</h3>
        {topsession.data ? <DisplaySession key={topsession.data.session.id} data={topsession.data.session} /> : null}
        <SetTopSession />
        <SetTopQuestion />
        <CloseQuestion />
      </View>
    </Fragment>
  );
};

export default Admin;