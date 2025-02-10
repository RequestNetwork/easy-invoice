import axios from "axios";

export const apiClient = axios.create({
	baseURL: process.env.REQUEST_API_URL,
	headers: {
		"x-api-key": process.env.REQUEST_API_KEY,
	},
});
