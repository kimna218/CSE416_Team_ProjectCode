import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import "../css/UploadRecipe.css";

interface Step {
  step_number: number;
  description: string;
}

interface Nutrition {
  calories: number;
  carbohydrates: number;
  protein: number;
  fat: number;
  sodium: number;
}

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dlm1w7msc/image/upload";
const CLOUDINARY_PRESET = "ml_default";

const UploadRecipe: React.FC = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null); // ✅ 파일 자체만 저장
  const [previewUrl, setPreviewUrl] = useState<string>("");      // ✅ 미리보기용 URL
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepInput, setStepInput] = useState("");
  const [nutrition, setNutrition] = useState<Nutrition>({
    calories: 0,
    carbohydrates: 0,
    protein: 0,
    fat: 0,
    sodium: 0,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const navigate = useNavigate();

  const addStep = () => {
    if (stepInput.trim()) {
      setSteps([...steps, { step_number: steps.length + 1, description: stepInput }]);
      setStepInput("");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file); // 저장만 하고 업로드는 안 함
    setPreviewUrl(URL.createObjectURL(file)); // 미리보기용
  };

  const handleSubmit = async () => {
    if (!title || !description || !imageFile || steps.length === 0) {
      alert("Please fill in all required fields.");
      return;
    }

    const user = getAuth().currentUser;
    if (!user) {
      alert("You must be logged in to upload a recipe.");
      return;
    }

    setIsUploading(true);
    setUploadMessage("Uploading image...");

    try {
      // ✅ 1. 이미지 업로드
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("upload_preset", CLOUDINARY_PRESET);

      const imageRes = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      });

      const imageData = await imageRes.json();
      const imageUrl = imageData.secure_url;
      setUploadMessage("✅ Image uploaded. Saving recipe...");

      // ✅ 2. DB에 레시피 저장
      const newRecipe = {
        title,
        description,
        image_url: imageUrl,
        ingredients,
        steps,
        nutrition,
        firebase_uid: user.uid,
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/recipes/my`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecipe),
      });

      if (!res.ok) throw new Error("Upload failed");

      alert("✅ Recipe saved to database!");
      navigate("/MyRecipe");
    } catch (err) {
      console.error("Submit failed:", err);
      alert("❌ Failed to upload. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadMessage("");
    }
  };

  return (
    <div className="upload-page">
      <h2>Upload Your Recipe</h2>

      <label>Title *</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} />

      <label>Description *</label>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} />

      <label>Recipe Image *</label>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {previewUrl && <img src={previewUrl} alt="Preview" style={{ width: "100%", marginTop: "10px" }} />}
      {uploadMessage && <p>{uploadMessage}</p>}

      <label>Ingredients</label>
      <textarea
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
        placeholder="Example: 1 cup rice\n2 eggs"
      />

      <label>Steps *</label>
      <div className="steps-box">
        <input
          value={stepInput}
          onChange={(e) => setStepInput(e.target.value)}
          placeholder="Enter step description"
        />
        <button type="button" onClick={addStep}>+ Add Step</button>
        <ul>
          {steps.map((step) => (
            <li key={step.step_number}>
              <strong>Step {step.step_number}:</strong> {step.description}
            </li>
          ))}
        </ul>
      </div>

      <label>Nutrition Info</label>
      <div className="nutrition-fields">
        {["calories", "carbohydrates", "protein", "fat", "sodium"].map((field) => (
          <div className="nutrition-row" key={field}>
            <span>{field.charAt(0).toUpperCase() + field.slice(1)}:</span>
            <input
              type="text"
              value={nutrition[field as keyof Nutrition]}
              onChange={(e) =>
                setNutrition({
                  ...nutrition,
                  [field]: Number(e.target.value),
                })
              }
            />
          </div>
        ))}
      </div>

      <button className="submit-button" onClick={handleSubmit} disabled={isUploading}>
        ✅ Save Recipe
      </button>
    </div>
  );
};

export default UploadRecipe;
