import axiosInstance from './axiosinstance';

export const fetcher = (url) => axiosInstance.get(url).then((res) => res.data);
