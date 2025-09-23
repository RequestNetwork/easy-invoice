import axios from "axios";
import { serverEnv } from "./env/server";

export const apiClient = axios.create({
  baseURL: serverEnv.REQUEST_API_URL,
  headers: {
    "x-api-key": serverEnv.REQUEST_API_KEY,
  },
});
