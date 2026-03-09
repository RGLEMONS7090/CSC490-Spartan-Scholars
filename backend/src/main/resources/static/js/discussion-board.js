const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/login";
}

const discussionList = document.getElementById("discussionList");
const filterChips = Array.from(document.querySelectorAll("[data-sort]"));
let currentSort = "all";

async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    return null;
  }
  if (!response.ok) {
    let message = "Request failed.";
    try {
      const data = await response.json();
      if (data && data.message) {
        message = data.message;
      }
    } catch (_err) {
      message = "Request failed.";
    }
    throw new Error(message);
  }
  return response;
}

function escapeHtml(value) {
  const text = value ?? "";
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function initials(name) {
  const parts = (name || "User").trim().split(/\s+/);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "U";
}

function relativeTime(iso) {
  if (!iso) {
    return "just now";
  }
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function renderComment(comment, discussionId) {
  const replies = (comment.replies || []).map((reply) => renderComment(reply, discussionId)).join("");
  return `
    <article class="discussionComment" data-comment-id="${comment.id}">
      <p class="discussionComment__author">${escapeHtml(comment.authorName)}</p>
      <p class="discussionComment__content">${escapeHtml(comment.content)}</p>
      <div class="discussionComment__meta">
        <span>${relativeTime(comment.createdAt)}</span>
        <button type="button" class="discussionComment__reply" data-action="open-reply" data-discussion-id="${discussionId}" data-parent-id="${comment.id}">Reply</button>
      </div>
      <div class="discussionComment__replyMount"></div>
      <div class="discussionComment__replies">${replies}</div>
    </article>
  `;
}

function renderDiscussions(discussions) {
  if (!discussions.length) {
    discussionList.innerHTML = `
      <article class="discussionCard">
        <h2>No discussions yet</h2>
        <p class="discussionCard__text">Start the first one with the + New Discussion button.</p>
      </article>
    `;
    return;
  }

  discussionList.innerHTML = discussions.map((discussion) => `
    <article class="discussionCard" data-discussion-id="${discussion.id}">
      <div class="discussionCard__top">
        <div class="discussionCard__avatar">${initials(discussion.authorName)}</div>
        <div class="discussionCard__body">
          <h2>${escapeHtml(discussion.title)}</h2>
          <p class="discussionCard__author">by ${escapeHtml(discussion.authorName)}</p>
          <p class="discussionCard__text">${escapeHtml(discussion.description || "")}</p>
          <div class="discussionCard__meta">
            <span>${discussion.likeCount} likes</span>
            <span>${discussion.commentCount} comments</span>
          </div>
          <div class="discussionCard__actions">
            <button type="button" class="discussionCard__action ${discussion.likedByCurrentUser ? "discussionCard__action--active" : ""}" data-action="toggle-like" data-discussion-id="${discussion.id}">
              ${discussion.likedByCurrentUser ? "Liked" : "Like"}
            </button>
            <button type="button" class="discussionCard__action" data-action="comment" data-discussion-id="${discussion.id}">
              Comment
            </button>
            <button type="button" class="discussionCard__action" data-action="toggle-comments" data-discussion-id="${discussion.id}">
              View Comments
            </button>
          </div>
          <section class="discussionComments d-none" data-comments-for="${discussion.id}">
            <form class="discussionCommentComposer" data-role="comment-form" data-discussion-id="${discussion.id}">
              <textarea name="content" placeholder="Write a comment..." required></textarea>
              <div class="discussionCommentComposer__actions">
                <button type="submit">Post Comment</button>
              </div>
            </form>
            <div class="discussionCommentList" data-comment-list="${discussion.id}"></div>
          </section>
        </div>
        <div class="discussionCard__time">${relativeTime(discussion.updatedAt)}</div>
      </div>
    </article>
  `).join("");
}

async function loadDiscussions() {
  const response = await apiFetch(`/api/discussions?sort=${encodeURIComponent(currentSort)}`);
  if (!response) {
    return;
  }
  const discussions = await response.json();
  renderDiscussions(discussions);
}

async function loadComments(discussionId) {
  const listEl = document.querySelector(`[data-comment-list="${discussionId}"]`);
  if (!listEl) {
    return;
  }
  listEl.innerHTML = "<p class=\"discussionCard__text\">Loading comments...</p>";
  const response = await apiFetch(`/api/discussions/${discussionId}/comments`);
  if (!response) {
    return;
  }
  const comments = await response.json();
  if (!comments.length) {
    listEl.innerHTML = "<p class=\"discussionCard__text\">No comments yet.</p>";
    return;
  }
  listEl.innerHTML = comments.map((comment) => renderComment(comment, discussionId)).join("");
}

function setActiveChip(sort) {
  filterChips.forEach((chip) => {
    chip.classList.toggle("discussionFilters__chip--active", chip.dataset.sort === sort);
  });
}

function bumpCommentCount(discussionId, delta = 1) {
  const card = document.querySelector(`[data-discussion-id="${discussionId}"]`);
  const commentMeta = card?.querySelector(".discussionCard__meta span:last-child");
  if (!commentMeta) {
    return;
  }
  const current = Number((commentMeta.textContent.match(/\d+/) || ["0"])[0]);
  commentMeta.textContent = `${current + delta} comments`;
}

filterChips.forEach((chip) => {
  chip.addEventListener("click", async () => {
    currentSort = chip.dataset.sort || "all";
    setActiveChip(currentSort);
    try {
      await loadDiscussions();
    } catch (error) {
      alert(error.message);
    }
  });
});

discussionList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }
  const action = button.dataset.action;
  const discussionId = button.dataset.discussionId;
  if (!discussionId) {
    return;
  }

  try {
    if (action === "toggle-like") {
      await apiFetch(`/api/discussions/${discussionId}/likes`, { method: "POST" });
      await loadDiscussions();
      return;
    }

    if (action === "toggle-comments") {
      const panel = document.querySelector(`[data-comments-for="${discussionId}"]`);
      if (!panel) {
        return;
      }
      const hidden = panel.classList.contains("d-none");
      panel.classList.toggle("d-none");
      button.textContent = hidden ? "Hide Comments" : "View Comments";
      if (hidden) {
        await loadComments(discussionId);
      }
      return;
    }

    if (action === "comment") {
      const panel = document.querySelector(`[data-comments-for="${discussionId}"]`);
      const toggleBtn = document.querySelector(`button[data-action="toggle-comments"][data-discussion-id="${discussionId}"]`);
      if (panel && panel.classList.contains("d-none")) {
        panel.classList.remove("d-none");
        if (toggleBtn) {
          toggleBtn.textContent = "Hide Comments";
        }
        await loadComments(discussionId);
      }
      const textarea = panel?.querySelector("textarea[name=\"content\"]");
      textarea?.focus();
      return;
    }

    if (action === "open-reply") {
      const mount = button.closest(".discussionComment")?.querySelector(".discussionComment__replyMount");
      if (!mount) {
        return;
      }
      if (!mount.innerHTML.trim()) {
        mount.innerHTML = `
          <form class="discussionComment__replyComposer" data-role="reply-form" data-discussion-id="${discussionId}" data-parent-id="${button.dataset.parentId}">
            <textarea name="content" placeholder="Write a reply..." required></textarea>
            <button type="submit">Post Reply</button>
          </form>
        `;
      }
      const input = mount.querySelector("textarea");
      input?.focus();
    }
  } catch (error) {
    alert(error.message);
  }
});

discussionList.addEventListener("submit", async (event) => {
  const form = event.target;
  const role = form.dataset.role;
  if (role !== "comment-form" && role !== "reply-form") {
    return;
  }
  event.preventDefault();

  const discussionId = form.dataset.discussionId;
  const contentInput = form.querySelector("textarea[name=\"content\"]");
  const content = contentInput?.value.trim();
  if (!discussionId || !content) {
    return;
  }

  const payload = { content };
  if (role === "reply-form") {
    payload.parentId = Number(form.dataset.parentId);
  }

  try {
    await apiFetch(`/api/discussions/${discussionId}/comments`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    if (contentInput) {
      contentInput.value = "";
    }
    if (role === "reply-form") {
      form.remove();
    }
    await loadComments(discussionId);
    bumpCommentCount(discussionId, 1);
  } catch (error) {
    alert(error.message);
  }
});

setActiveChip(currentSort);
loadDiscussions().catch((error) => {
  alert(error.message);
});
