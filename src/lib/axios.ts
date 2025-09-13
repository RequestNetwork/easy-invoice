import { env } from "@/env/server";
import axios from "axios";

export const apiClient = axios.create({
  baseURL: env.REQUEST_API_URL,
  headers: {
    "x-api-key": env.REQUEST_API_KEY,
  },
});
