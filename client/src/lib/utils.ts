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
  console.log("🚀 [uploadToR2] Starting upload process...");
  console.log("📁 File details:", {
    name: file.name,
    type: file.type,
    size: file.size,
  });

  // Upload through backend (avoids CORS issues)
  console.log("📤 [uploadToR2] Uploading via backend...");
  
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("http://localhost:3003/api/upload", {
      method: "POST",
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
    });

    console.log("📡 [uploadToR2] Backend response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [uploadToR2] Upload failed. Response:", errorText);
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const { publicUrl } = await response.json();
    console.log("✅ [uploadToR2] Upload successful!");
    console.log("🔗 [uploadToR2] Public URL:", publicUrl);

    return publicUrl;
  } catch (error) {
    console.error("❌ [uploadToR2] Error during upload:", error);
    throw error;
  }
}