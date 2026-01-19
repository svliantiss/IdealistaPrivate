import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import AWS from 'aws-sdk'; // AWS SDK v2
import { api } from "@/store/api/baseApi";
import { uploadApi } from "./../store/api/storageApi";
import axios from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// export async function uploadToR2(file: File) {
//   try {
//     // Step 1: Request presigned URL from backend
//     const { signedUrl, publicUrl } = await uploadApi({
//       fileName: file.name,
//       fileType: file.type,
//     });

//     console.log("Signed URL:", signedUrl, "Public URL:", publicUrl);
//     // Step 2: Upload the file directly to R2 using the signed URL
//     const response = await axios.put(signedUrl, file, {
//       headers: {
//         "Content-Type": file.type,
//       },
//     });

//     if (!response.status.toString().startsWith("2")) {
//       const errorText = await response.data;
//       throw new Error(`Upload failed: ${response.status} - ${errorText}`);
//     }

//     // Step 3: Return the public URL of the uploaded file
//     return publicUrl;
//   } catch (error: any) {
//     console.error("R2 Upload Error:", error);
//     throw new Error(error.message || "Unknown upload error");
//   }
// }


export async function uploadToR2(file: File) {
  // 1. Ask backend for signed URL
  const { signedUrl, publicUrl } = await fetch("http://localhost:3003/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
    }),
  }).then(res => res.json());

  // 2. Upload directly to R2
  const response = await fetch(signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type, // MUST MATCH
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  // 3. Use public URL
  return publicUrl;
}