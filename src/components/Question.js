import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Result from './Result.js';

const TriviaGame = () => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [options, setOptions] = useState([]);
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [userAnswer, setUserAnswer] = useState(null);
    const [result, setResult] = useState('');
    const [correctCount, setCorrectCount] = useState(0);
    const [incorrectCount, setIncorrectCount] = useState(0);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
            fetchQuestions();
    }, []);

      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const fetchQuestions = async (retryCount = 0) => {
        setIsLoading(true);
        try {
            const response = await fetch('https://opentdb.com/api.php?amount=1');
            if (!response.ok) {
                if (response.status === 429 && retryCount < 3) {
                    // Exponential backoff
                    await sleep((2 ** retryCount) * 1000);
                    fetchQuestions(retryCount + 1);
                } else {
                    throw new Error('Failed to fetch questions');
                }
                return;
            }
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                localStorage.setItem('triviaQuestions', JSON.stringify(data.results));
                setQuestions(data.results);
                setCurrentQuestion(data.results[0]);
                setError(null);
            } else {
                throw new Error('No question data found');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const setCurrentQuestion = (questionData) => {
        const answerOptions = [...questionData.incorrect_answers, questionData.correct_answer].sort(
            () => Math.random() - 0.5
        );
        setOptions(answerOptions);
        setCorrectAnswer(questionData.correct_answer);
    };

    const handleOptionClick = (option) => {
        setUserAnswer(option);
    };

    const handleSubmitClick = () => {
        setSubmitted(true);
        if (userAnswer === correctAnswer) {
            setResult('Correct!');
            setCorrectCount(correctCount + 1);
        } else {
            setResult('Incorrect!');
            setIncorrectCount(incorrectCount + 1);
        }
    };

    const nextQuestion = () => {
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < questions.length) {
            setCurrentQuestionIndex(nextIndex);
            setCurrentQuestion(questions[nextIndex]);
            setResult('');
            setUserAnswer(null);
            setSubmitted(false);
        } else {
            checkResult();
        }
    };

    let navigate = useNavigate();

    const checkResult = () => {
        navigate('/Result', { state: { correctCount, incorrectCount } });
    };

    return (
        <div className='font-mainFont bg-blue-950 size-full h-dvh flex justify-center text-white tracking-wider'>
            <div>
                <div className='QuestionBox'>
                    {error ? (
                        <p>Error: {error}</p>
                    ) : isLoading ? (
                        <p>Loading questions...</p>
                    ) : questions.length > 0 ? (
                        <div>
                            <h2 className='text-2xl font-bold mb-5 text-center text-slate-100'>
                                Question {currentQuestionIndex + 1}
                                <span className='text-gray-500'> / 10</span>
                            </h2>
                            <div className='questions_part mb-5'>
                                <span className='text-gray-400 mr-2'>Q.</span>
                                <span dangerouslySetInnerHTML={{ __html: questions[currentQuestionIndex].question }} />
                            </div>
                            <div className='answer_part flex flex-col gap-4'>
                                {options.map((option, index) => (
                                    <button
                                        className={`ans_btn border rounded-md p-2 hover:bg-blue-500 
                                            ${submitted && option === correctAnswer ? 'bg-green-500' : ''}
                                            ${submitted && option === userAnswer && option !== correctAnswer
                                                ? 'bg-red-500'
                                                : ''}
                                            ${!submitted && option === userAnswer ? 'bg-blue-800' : ''}`}
                                        key={index}
                                        onClick={() => handleOptionClick(option)}
                                        disabled={submitted}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                            {!result && (
                                <div className='submit_btn_part flex justify-center'>
                                    <button
                                        className='ans_btn bg-white text-blue-950 font-bold my-5 w-6/12 border rounded-md p-2'
                                        onClick={handleSubmitClick}
                                        disabled={submitted || userAnswer === null}
                                    >
                                        Submit
                                    </button>
                                </div>
                            )}
                            {result && (
                                <div className='mt-5 flex justify-center flex-col items-center'>
                                    {result === 'Correct!' && <p className='text-green-500'>Correct! Well done.</p>}
                                    {result === 'Incorrect!' && <p className='text-red-500'>Oops! Answer is incorrect.</p>}
                                    {currentQuestionIndex < 9 ? (
                                        <button className='bg-white text-blue-950 font-bold my-5 w-6/12 border rounded-md p-2' onClick={nextQuestion}>
                                            Next Question
                                        </button>
                                    ) : (
                                        <button className='bg-white text-blue-950 font-bold my-5 w-6/12 border rounded-md p-2' onClick={checkResult}>
                                            Check Result
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p>No questions available.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TriviaGame;
