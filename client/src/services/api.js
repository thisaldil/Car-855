import axios from 'axios';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', withCredentials: true });
export const errMsg = (e) => e?.response?.data?.details?.[0]?.message ? `${e.response.data.details[0].path ? e.response.data.details[0].path + ': ' : ''}${e.response.data.details[0].message}` : e?.response?.data?.message || e?.message || 'Something went wrong';
export const get = (url, params) => api.get(url, { params }).then((r) => r.data);
