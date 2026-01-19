import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import AWS from 'aws-sdk'; // AWS SDK v2
import { api } from "@/store/api/baseApi";
import { uploadApi } from "./../store/api/storageApi";
import axios from "axios";
import { useUpdateProfile } from "@/store/api/profileApi";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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