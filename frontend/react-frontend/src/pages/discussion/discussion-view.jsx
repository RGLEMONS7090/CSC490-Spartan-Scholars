import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  apiFetch,
  fetchComments,
  postComment,
  toggleLike,
  initials,
  relativeTime,
} from "../../assets/js/api/discussionAPi";
import useTheme from "../../assets/js/useTheme";
import {logout} from "../../assets/js/utils/logout";
import {Helmet} from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { postReply } from "../../assets/js/api/discussionAPi";

export default function DiscussionView() {
  const location = useLocation();
  const preloadedDiscussion = location.state?.preloadedDiscussion ?? null;
  const preloadedComments = location.state?.preloadedComments ?? null;

  const [discussion, setDiscussion] = useState(preloadedDiscussion);
  const [comments, setComments] = useState(preloadedComments ?? []);
  const [loading, setLoading] = useState(!preloadedDiscussion);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");

  const { id } = useParams();

  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    async function load() {
      try {
        // Only fetch discussion if not preloaded
        if (!preloadedDiscussion) {
          const res = await apiFetch(`/api/discussions/${id}`);
          const data = await res.json();
          setDiscussion(data);
        }
  
        // Always fetch comments if not preloaded
        if (!preloadedComments) {
          const commentData = await fetchComments(id);
          setComments(commentData);
        }
  
      } finally {
        setLoading(false);
      }
    }
  
    load();
  }, [id, preloadedDiscussion, preloadedComments]);

  const handleLike = async () => {
    try {
      const updated = await toggleLike(id);
      setDiscussion(prev => ({
        ...prev,
        likeCount: updated.likeCount,
        likedByCurrentUser: updated.liked ?? updated.likedByCurrentUser
        
    }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const newComment = await postComment(id, commentText);
      setComments((prev) => [...prev, newComment]);
      setCommentText("");

      setDiscussion((prev) => ({
        ...prev,
        commentCount: prev.commentCount + 1,
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Loading...</title>
        </Helmet>
  
        <main className="main main--discussion">
          <article className="discussionCard">
            <h2>Loading discussion…</h2>
          </article>
        </main>
      </>
    );
  }  

  if (!discussion) {
    return (
      <main className="main main--discussion">
        <article className="discussionCard">
          <h2>Not found</h2>
          <p className="discussionCard__text">This discussion does not exist.</p>
        </article>
      </main>
    );
  }

  function Comment({ comment, level = 0 }) {
    const [localReply, setLocalReply] = useState("");
    const [showReplies, setShowReplies] = useState(true);
  
    return (
      <div
        className="comment"
        style={{
          marginLeft: `${level * 20}px`,
          borderLeft: level > 0 ? "2px solid var(--borderSoft)" : "none",
          paddingLeft: level > 0 ? "12px" : "0"
        }}
      >
        <p className="comment__author">{comment.authorName}
          <span className="comment__time"> • {relativeTime(comment.createdAt)} </span>
        </p>
        <p className="comment__content">{comment.content}</p>
  
        <button
          type="button"
          className="comment__replyBtn"
          onClick={() => setReplyingTo(comment.id)}
        >
          Reply
        </button>
  
        
        {replyingTo === comment.id && (
          <form
            className="replyForm"
            onSubmit={(e) => {
              e.preventDefault();
              handleReplySubmit(localReply, comment.id);
              setLocalReply("");
            }}
          >
            <textarea
              value={localReply}
              onChange={(e) => setLocalReply(e.target.value)}
              placeholder="Write a reply..."
              required
            />
            {/*<button type="submit">Post Reply</button>*/}
            <div className="replyForm__actions">
      <button type="submit" className="replyForm__postBtn">
        Post Reply
      </button>

      <button
        type="button"
        className="replyForm__cancelBtn"
        onClick={() => {
          setReplyingTo(null);
          setLocalReply("");
        }}
      >
        Cancel
      </button>
    </div>


          </form>
        )}
  
        {/* Toggle replies */}
        {comment.replies?.length > 0 && (
          <button
            type="button"
            className="comment__toggleRepliesBtn"
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies
              ? "Hide replies"
              : `Show replies (${comment.replies.length})`}
          </button>
        )}
  
        {/* Render replies ONLY when showReplies is true */}
        {showReplies && comment.replies?.length > 0 && (
          <div className="comment__replies">
            {comment.replies.map((reply) => (
              <Comment key={reply.id} comment={reply} level={level + 1} />
            ))}
          </div>
        )}

      </div>
    );
  }

  async function handleReplySubmit(content, parentId) {
    try {
      await postReply(id, parentId, content);
  
      setReplyingTo(null);
  
      const updated = await fetchComments(id);
      setComments(updated);
  
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      
      <Helmet>
        <title> Loading discussion... </title>
      </Helmet>

      {discussion && (
        <Helmet>
          <title>{discussion.title}</title>
        </Helmet>
      )}

    <main className="main main--discussion">
      <section className="discussionTop">
        <div>
          <div className="discussionTitle">
            <div className="discussionTitle__icon">D</div>
            <h1>{discussion.title}</h1>
          </div>
          <p className="discussionTop__subtitle">
            by {discussion.authorName} • {relativeTime(discussion.updatedAt)}
          </p>
        </div>

        <Link
          to="/discussion-board"
          className="discussionTop__button discussionTop__button--link"
        >
          Back to Board
        </Link>
      </section>

      <article className="discussionCard">
        <div className="discussionCard__top">
          <div className="discussionCard__avatar">
            {initials(discussion.authorName)}
          </div>

          <div className="discussionCard__body">
            <p className="discussionCard__text">{discussion.description}</p>

            <div className="discussionCard__meta">
              <span>{discussion.likeCount} likes</span>
              <span>{discussion.commentCount} comments</span>
            </div>

            <div className="discussionCard__actions">
              <button
                type="button"
                className={
                  "discussionCard__action" +
                  (discussion.likedByCurrentUser
                    ? " discussionCard__action--active"
                    : "")
                }
                onClick={handleLike}>
                  <span className="heartIcon">
                    {discussion.likedByCurrentUser ?  "❤️" : "🤍"}
                  </span>
                {discussion.likedByCurrentUser ? "Liked" : "Like"}
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Comments */}
      <section className="discussionComments">
        <form className="discussionCommentComposer" onSubmit={handlePostComment}>
          <textarea
            placeholder="Write a comment..."
            required
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <div className="discussionCommentComposer__actions">
            <button type="submit">Post Comment</button>
          </div>
        </form>

        <div className="discussionCommentList">
          {comments.length === 0 ? (
            <p className="discussionCard__text">No comments yet.</p>
          ) : (
            comments.map((c) => <Comment key={c.id} comment={c} />)
          )}
        </div>
      </section>
    </main>
    </>
  );
};

