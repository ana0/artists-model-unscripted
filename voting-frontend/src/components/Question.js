import React, { useState, useEffect, Fragment } from 'react';
import axios from 'axios';

const Question = ({ question, session }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isError, setIsError] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  console.log("question", question)
  const questionId = question[0].id;

  // const handleOptionChange = (event) => {
  //   setSelectedOption(parseInt(event.target.value));
  // };

  const handleOptionChange = (optionId) => {
    setSelectedOption(optionId);
  };

  const handleSubmit = async () => {
    // Send the user's answer to the server
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}votes`, {
        pollId: question[0].id,
        pollItemsId: selectedOption,
        voterId: localStorage.getItem('voterID'),
        sessionId: session
      })
      setHasVoted(true)
      localStorage.setItem('lastPoll', question[0].id);
      localStorage.setItem('lastVote', selectedOption)
    } catch (error) {
      console.error("Error", error);
      setIsError(true);

    }
  };

  // // Determine the winning option
  // const getWinningOption = () => {
  //   if (question[0].closed) {
  //     return question[0].votes > question[1].votes ? question[0].pollItemsId : question[1].pollItemsId;
  //   }
  //   return question[0].pollItemsId;
  // };

  // const winningOption = getWinningOption();

  useEffect(() => {
    setHasVoted(false);
  }, [questionId])

  return (
    <div className="container">
      {isError && <div>There was an error submitting your answer - did you already vote?</div>}
      {!hasVoted && !question[0].closed && (
        <Fragment>
          <h3>{question[0].question}</h3>
          <div className='options'>
            <button
              className={selectedOption === question[0].pollItemsId ? 'selected' : selectedOption !== null ? 'unselected' : ''}
              onClick={() => handleOptionChange(question[0].pollItemsId)}
            >
              {question[0].answer}
            </button>
            {question[1] && (
              <button
              className={selectedOption === question[1].pollItemsId ? 'selected' : selectedOption !== null ? 'unselected' : ''}
                onClick={() => handleOptionChange(question[1].pollItemsId)}
              >
                {question[1].answer}
              </button>
            )}
          </div>
          <button
            className="submit"
            disabled={selectedOption === null}
            onClick={handleSubmit}>
              Submit
          </button>
      </Fragment>
      )}
      {hasVoted && !question[0].closed && (
        <div className="thank-you-container"><h2>Thank you<br />for voting!</h2></div>
      )}
      {question[0].closed ? (
        <Fragment>
          <h3>Results</h3>
          <div className={`results ${question[1] && question[0].votes > question[1].votes ? 'won' : ''}`}>
            <p className="option">{`${question[0].answer}`}</p>
            <p className='count'>{`${question[0].votes}`}</p>
          </div>
          {question[1] && (
            <div className={`results ${question[1].votes > question[0].votes ? 'won' : ''}`}>
              <p className="option">{`${question[1].answer}`}</p>
              <p className='count'>{`${question[1].votes}`}</p>
            </div>)}
          {parseInt(localStorage.getItem('lastPoll')) === question[0].id ? 
              <Fragment>
                <p className='note'>You voted for: {question.find((item) => item.pollItemsId === parseInt(localStorage.getItem('lastVote'))).answer}</p> 
              </Fragment>
            :
            <p className='note'>You did not participate in this round.</p>}
        </Fragment> 
      ):null}
    </div>
  );
};

export default Question;