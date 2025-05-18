import React, { useState, useEffect } from 'react';
import '../css/Feed.css';

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
  const [newCommentText, setNewCommentText] = useState<Record<number, string>>({});
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostImageUrl, setNewPostImageUrl] = useState('');

  const toggleComments = async (postId: number) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));

    if (!comments[postId]) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/posts/${postId}/comments`);
        const data = await res.json();
        setComments(prev => ({ ...prev, [postId]: data }));
      } catch (err) {
        console.error('Failed to load comments:', err);
      }
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/posts`);
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    }
  };

  const handleNewPost = async () => {
    if (!newPostCaption || !newPostImageUrl) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'cook_lover',
          caption: newPostCaption,
          image_url: newPostImageUrl,
        }),
      });

      const newPost = await res.json();
      setPosts(prev => [newPost, ...prev]);
      setNewPostCaption('');
      setNewPostImageUrl('');
    } catch (err) {
      console.error('Failed to upload post:', err);
    }
  };

  const handleCommentSubmit = async (postId: number) => {
    const text = newCommentText[postId];
    if (!text) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'user123',
          text,
        }),
      });

      const newComment = await res.json();
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
      setNewCommentText(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error('Failed to submit comment:', err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="feed-page">
      <section className="upload-section">
        <textarea
          value={newPostCaption}
          onChange={e => setNewPostCaption(e.target.value)}
          placeholder="Share what you cooked today..."
        />
        <input
          type="text"
          value={newPostImageUrl}
          onChange={e => setNewPostImageUrl(e.target.value)}
          placeholder="Paste image URL here"
        />
        <button className="upload-btn" onClick={handleNewPost}>Upload</button>
      </section>

      <section className="post-grid">
        {posts.map(post => (
          <div key={post.id} className="post-card">
            <img src={post.image_url} alt="food" className="post-image" />
            <div className="post-info">
              <p className="post-user">@{post.username}</p>
              <p className="post-caption">{post.caption}</p>
            </div>
            <div className="post-actions">
              <button className="like-btn">❤️ Like</button>
              <button className="comment-toggle" onClick={() => toggleComments(post.id)}>
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
                  value={newCommentText[post.id] || ''}
                  onChange={(e) =>
                    setNewCommentText(prev => ({ ...prev, [post.id]: e.target.value }))
                  }
                />
                <button onClick={() => handleCommentSubmit(post.id)}>Submit</button>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
};

export default Feed;
