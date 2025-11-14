// Cloudinary upload service for React Native
const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export interface UploadResult {
  secure_url: string;
  public_id: string;
}

export const uploadImageToCloudinary = async (
  fileUri: string,
  fileType: string = "image"
): Promise<string> => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary configuration missing");
  }

  try {
    const formData = new FormData();
    
    // For React Native, we need to create a file object
    // @ts-ignore - React Native FormData accepts objects with uri, type, name
    formData.append("file", {
      uri: fileUri,
      type: fileType === "image" ? "image/jpeg" : "video/mp4",
      name: `photo_${Date.now()}.${fileType === "image" ? "jpg" : "mp4"}`,
    });
    
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    
    if (fileType === "video") {
      formData.append("resource_type", "video");
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${fileType}/upload`,
      {
        method: "POST",
        body: formData,
        // Don't set Content-Type header - let fetch set it with boundary
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || "Upload failed");
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
  }
};

