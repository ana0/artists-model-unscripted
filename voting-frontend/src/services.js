import { QueryClient } from "@tanstack/react-query";
import axios from 'axios';

export const getRequest = async (url, params) => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_API_URL}${url}`, { params }
  )
  return data
}

export const getQuestions = async () => {
  return getRequest(`polls`)
}

export const getSessions = async () => {
  return getRequest(`sessions`)
}

export const getTopSession = async () => {
  return getRequest(`sessions/top`)
}

export const getTopQuestion = async () => {
  return getRequest(`polls/top`)
}

export const queryClient = new QueryClient();