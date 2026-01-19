import { api, getAuthHeader } from "./baseApi";

export const uploadApi = ({
    fileName,
    fileType,

}: {
    fileName: string;
    fileType: string;

}) =>
    api
        .post(
            '/api/upload-url',
            { fileName, fileType },
            { headers: getAuthHeader() } // <-- attach Bearer token
        )
        .then(res => res.data);
