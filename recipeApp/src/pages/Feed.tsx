import React, { useState, useEffect } from "react";
import "../css/Feed.css";
import { getAuth } from "firebase/auth";

type Comment = {
  id: number;
  username: string;
  text: string;
  created_at: string;
};

type Post = {
  id: number;
  username: string;
  caption: string;
  image_url: string;
  created_at: string;
};

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [showComments, setShowComments] = useState<Record<number, boolean>>({});
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [newCommentText, setNewCommentText] = useState<Record<number, string>>(
    {}
  );
  const [newPostCaption, setNewPostCaption] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [likes, setLikes] = useState<Record<number, number>>({});
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const [userLikes, setUserLikes] = useState<Record<number, boolean>>({});

  const CLOUDINARY_URL =
    "https://api.cloudinary.com/v1_1/dlm1w7msc/image/upload";
  const CLOUDINARY_PRESET = "ml_default";

  const auth = getAuth();
  // const uid = auth.currentUser?.uid;

  const uploadImageToCloudinary = async (
    file: File
  ): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);

    try {
      setIsUploading(true);
      const res = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setUploadMessage("✅ Upload successful!");
      return data.secure_url;
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      setUploadMessage("❌ Upload failed. Please try again.");
      return null;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadMessage(""), 3000);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/posts`);
      const data = await res.json();
      setPosts(data);

      // 좋아요 수 초기화
      const likesRes = await fetch(
        `${import.meta.env.VITE_API_URL}/posts/likes`
      );
      const likeData = await likesRes.json();
      const likeMap: Record<number, number> = {};
      likeData.forEach((item: { post_id: number; likes: number }) => {
        likeMap[item.post_id] = item.likes;
      });
      setLikes(likeMap);
    } catch (err) {
      console.error("Failed to fetch posts or likes:", err);
    }
  };

  const toggleComments = async (postId: number) => {
    setShowComments((prev) => ({ ...prev, [postId]: !prev[postId] }));

    if (!comments[postId]) {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/posts/${postId}/comments`
        );
        const data = await res.json();
        setComments((prev) => ({ ...prev, [postId]: data }));
      } catch (err) {
        console.error("Failed to load comments:", err);
      }
    }
  };

  const fetchUserLikes = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/users/${uid}/likes`
      );
      const data: { post_id: number }[] = await res.json();

      const likeStatus: Record<number, boolean> = {};
      data.forEach(({ post_id }) => {
        likeStatus[post_id] = true;
      });
      setUserLikes(likeStatus);
    } catch (err) {
      console.error("Failed to fetch user likes:", err);
    }
  };

  const handleLike = async (postId: number) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/posts/${postId}/like`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firebase_uid: uid }),
        }
      );

      const result = await res.json();

      const liked = result.liked;
      setLikes((prev) => ({
        ...prev,
        [postId]: liked
          ? (prev[postId] || 0) + 1
          : Math.max((prev[postId] || 1) - 1, 0),
      }));
      setUserLikes((prev) => ({
        ...prev,
        [postId]: liked,
      }));
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const fetchNickname = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL}/users/${uid}`);
    const data = await res.json();
    return data.user.nickname;
  };

  const handleNewPost = async () => {
    if (!newPostCaption || !uploadFile) return;

    const imageUrl = await uploadImageToCloudinary(uploadFile);
    if (!imageUrl) return;

    const nickname = await fetchNickname();

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: nickname, 
          caption: newPostCaption,
          image_url: imageUrl,
        }),
      });

      const newPost = await res.json();
      setPosts((prev) => [newPost, ...prev]);
      setNewPostCaption("");
      setUploadFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error("Failed to upload post:", err);
    }
  };

  const handleCommentSubmit = async (postId: number) => {
    const text = newCommentText[postId];
    if (!text) return;

    const nickname = await fetchNickname();

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/posts/${postId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: nickname,
            text,
          }),
        }
      );

      const newComment = await res.json();
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
      setNewCommentText((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error("Failed to submit comment:", err);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchUserLikes();
  }, []);

  return (
    <div className="feed-page">
      <section className="upload-section">
        <textarea
          value={newPostCaption}
          onChange={(e) => setNewPostCaption(e.target.value)}
          placeholder="Share what you cooked today..."
        />

        <div
          className="upload-dropzone styled-dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) {
              setUploadFile(file);
              setPreviewUrl(URL.createObjectURL(file));
            }
          }}
        >
          <p>Drag & Drop your image here</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setUploadFile(file);
                setPreviewUrl(URL.createObjectURL(file));
              }
            }}
          />
        </div>

        <div className="preview-container">
          {previewUrl && (
          <img src={previewUrl} alt="Preview" className="preview-file" />
        )}
        {uploadMessage && <p>{uploadMessage}</p>}
        <button
          className="upload-btn"
          onClick={handleNewPost}
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>
        </div>
      </section>

      <section className="post-grid">
        {posts.map((post) => (
          <div key={post.id} className="post-card">
            <img src={post.image_url} alt="food" className="post-image" />
            <div className="post-info">
              <p className="post-user">@{post.username}</p>
              <p className="post-caption">{post.caption}</p>
            </div>
            <div className="post-actions">
              <button className="like-btn" onClick={() => handleLike(post.id)}>
                {userLikes[post.id] ? "♥" : "♡"}{" "}
                {likes[post.id] || 0}
              </button>
              <button
                className="comment-toggle"
                onClick={() => toggleComments(post.id)}
              >
                💬 Comment
              </button>
            </div>
            {showComments[post.id] && (
              <div className="comments-section">
                {(comments[post.id] || []).map((comment) => (
                  <p key={comment.id}>
                    <strong>@{comment.username}:</strong> {comment.text}
                  </p>
                ))}
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newCommentText[post.id] || ""}
                  onChange={(e) =>
                    setNewCommentText((prev) => ({
                      ...prev,
                      [post.id]: e.target.value,
                    }))
                  }
                />
                <button onClick={() => handleCommentSubmit(post.id)}>
                  Submit
                </button>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
};

export default Feed;
