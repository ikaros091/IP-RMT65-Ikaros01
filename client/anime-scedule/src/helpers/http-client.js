import axios from 'axios';

export const phase2Api = axios.create({
    baseURL: "http://localhost:3000",
});