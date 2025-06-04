import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  const { id } = useParams<{ id: string }>();
  const editMode = Boolean(id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
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

  useEffect(() => {
    if (!editMode) return;
    const fetchRecipe = async () => {
      const user = getAuth().currentUser;
      if (!user) return;

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/recipes/my/${id}?firebase_uid=${user.uid}`
        );
        const data = await res.json();
        setTitle(data.title);
        setDescription(data.description);
        setIngredients(data.ingredients);
        setSteps(data.steps || []);
        setNutrition(data.nutrition || {});
        setPreviewUrl(data.image_url);
      } catch (err) {
        console.error("Error loading recipe:", err);
      }
    };
    fetchRecipe();
  }, [editMode, id]);

  const addStep = () => {
    if (stepInput.trim()) {
      setSteps([...steps, { step_number: steps.length + 1, description: stepInput }]);
      setStepInput("");
    }
  };

  const removeStep = (index: number) => {
    const updatedSteps = steps.filter((_, i) => i !== index).map((s, i) => ({
      step_number: i + 1,
      description: s.description,
    }));
    setSteps(updatedSteps);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!title || !ingredients || !description || steps.length === 0) {
      alert("Please fill in all required fields.");
      return;
    }

    const user = getAuth().currentUser;
    if (!user) {
      alert("You must be logged in to upload a recipe.");
      return;
    }

    setIsUploading(true);
    setUploadMessage(editMode ? "Updating recipe..." : "Uploading image...");

    try {
      let imageUrl = previewUrl;

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("upload_preset", CLOUDINARY_PRESET);

        const imageRes = await fetch(CLOUDINARY_URL, {
          method: "POST",
          body: formData,
        });
        const imageData = await imageRes.json();
        imageUrl = imageData.secure_url;
      }

      const recipePayload = {
        title,
        description,
        image_url: imageUrl,
        ingredients,
        steps,
        nutrition,
        firebase_uid: user.uid,
      };

      const endpoint = editMode
        ? `${import.meta.env.VITE_API_URL}/recipes/my/${id}`
        : `${import.meta.env.VITE_API_URL}/recipes/my`;

      const method = editMode ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipePayload),
      });

      if (!res.ok) throw new Error("Save failed");

      alert(editMode ? "Recipe updated!" : "Recipe uploaded!");
      navigate("/MyRecipe");
    } catch (err) {
      console.error("Submit failed:", err);
      alert("❌ Failed to save recipe.");
    } finally {
      setIsUploading(false);
      setUploadMessage("");
    }
  };

  return (
    <div className="top-class upload-wrapper">
      <div className="upload-page">
        <h2>{editMode ? "Edit Your Recipe" : "Upload Your Recipe"}</h2>

        <label>Title *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />

        <label>Description *</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />

        <label>Recipe Image {editMode ? "(optional)" : "*"}</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {previewUrl && <img src={previewUrl} alt="Preview" className="preview-image" />}
        {uploadMessage && <p>{uploadMessage}</p>}

        <label>Ingredients *</label>
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
            {steps.map((step, index) => (
              <li key={index}>
                <strong>Step {step.step_number}:</strong> {step.description}
                <button type="button" onClick={() => removeStep(index)} style={{ marginLeft: 10, color: 'crimson' }}>🗑</button>
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

        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={isUploading}
        >
          {editMode ? "Save Changes" : "Save Recipe"}
        </button>
      </div>
    </div>
  );
};

export default UploadRecipe;
