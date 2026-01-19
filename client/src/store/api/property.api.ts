import axios from 'axios';


export const requestRegistrationOtp = (data: {
  email: string;
  name: string;
}) =>
  axios.post("/auth/request-otp", data).then(res => res.data);

export const verifyRegistrationOtp = (data: {
  email: string;
  otp: string;
}) =>
  axios.post("/auth/verify-otp", data).then(res => res.data);

  
export const requestLoginOtp = (email: string) =>
  axios.post("/auth/request-login-otp", { email }).then(res => res.data);

export const verifyLoginOtp = (data: {
  email: string;
  otp: string;
}) =>
  axios.post("/auth/verify-login-otp", data).then(res => res.data);


export const fetchProperties = (agentId: number) =>
  axios.get(`/api/properties?agentId=${agentId}`).then(res => res.data);

export const createProperty = (data: any) =>
  axios.post('/api/properties', data).then(res => res.data);
