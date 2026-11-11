import axios from 'axios';
const productionApiUrl = 'https://car-855-4c2q.vercel.app/api';
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? productionApiUrl : 'http://localhost:5000/api'),
  withCredentials: true,
});
export const errMsg = (e) => e?.response?.data?.details?.[0]?.message ? `${e.response.data.details[0].path ? e.response.data.details[0].path + ': ' : ''}${e.response.data.details[0].message}` : e?.response?.data?.message || e?.message || 'Something went wrong';
export const get = (url, params) => api.get(url, { params }).then((r) => r.data);
