const grid = document.getElementById('images');

// Modal refs
const modal = document.getElementById('postModal');
const modalImg = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalTime = document.getElementById('modalTime');
const modalViews = document.getElementById('modalViews');
const modalLikes = document.getElementById('modalLikes');
const modalLikeBtn = document.getElementById('modalLikeBtn');
const modalComments = document.getElementById('modalComments');
const modalCommentForm = document.getElementById('modalCommentForm');

let currentPostId = null;

/* Helpers */
function timeAgo(iso){
  const now = new Date();
  const then = new Date(iso);
  const s = Math.floor((now - then)/1000);
  if (s < 60) return `${s} วินาทีที่แล้ว`;
  const m = Math.floor(s/60);
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m/60);
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
  const d = Math.floor(h/24);
  return `${d} วันที่แล้ว`;
}

function openModal(){ modal.setAttribute('aria-hidden','false'); }
function closeModal(){ modal.setAttribute('aria-hidden','true'); }
document.querySelectorAll('[data-close-modal]').forEach(el => el.addEventListener('click', closeModal));
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });

/* Load Feed */
fetch('/api/images')
.then(res => res.json())
.then(data => {
  data.forEach(post => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img class="card__image" src="/images/${post.id}" alt="${post.name}">
      <div class="card__body">
        <h3 class="card__title">${post.name}</h3>
        <p class="card__desc">${post.description || ''}</p>
        <div class="meta">
          <span class="chip">⏱ ${timeAgo(post.created_at)}</span>
          <span class="chip">👁 ${post.views} views</span>
          <button class="btn-like" data-like="${post.id}">👍 <span>${post.likes}</span></button>
          <button class="btn-like" data-open="${post.id}">🔍 View</button>
        </div>
        <div class="comment-section" id="comments-${post.id}">
          <h4>Comments</h4>
          <div class="comment-list"></div>
          <form class="comment-form">
            <input type="text" name="username" placeholder="Your name" required />
            <input type="text" name="content" placeholder="Add a comment..." required />
            <button type="submit">Post</button>
          </form>
        </div>
      </div>
    `;
    grid.appendChild(card);

    // comments init
    loadComments(post.id);

    // add comment
    const form = card.querySelector('.comment-form');
    form.addEventListener('submit', e=>{
      e.preventDefault();
      const username = form.username.value.trim();
      const content = form.content.value.trim();
      if(!username || !content) return;
      fetch(`/api/comments/${post.id}`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({username, content})
      })
      .then(r=>r.json())
      .then(()=>{
        form.reset();
        loadComments(post.id);
      });
    });

    // like on card
    card.querySelector('[data-like]').addEventListener('click', e=>{
      const id = e.currentTarget.getAttribute('data-like');
      likePost(id).then(newLikes=>{
        e.currentTarget.querySelector('span').textContent = newLikes;
      });
    });

    // open modal (count view only here)
    card.querySelector('[data-open]').addEventListener('click', ()=>{
      openPost(post.id);
    });

    // also open when click image/title
    card.querySelector('.card__image').addEventListener('click', ()=>openPost(post.id));
    card.querySelector('.card__title').addEventListener('click', ()=>openPost(post.id));
  });
});

function loadComments(imageId){
  fetch(`/api/comments/${imageId}`)
  .then(res=>res.json())
  .then(list=>{
    const box = document.querySelector(`#comments-${imageId} .comment-list`);
    box.innerHTML = '';
    list.forEach(c=>{
      const div = document.createElement('div');
      div.className = 'comment';
      div.innerHTML = `<strong>${c.username}:</strong> ${c.content}`;
      box.appendChild(div);
    });
  });
}

function likePost(id){
  return fetch(`/api/like/${id}`,{method:'POST'})
    .then(res=>res.json())
    .then(d=>d.likes);
}

function openPost(id){
  fetch(`/api/image/${id}`)
    .then(res=>res.json())
    .then(post=>{
      currentPostId = id;
      modalImg.src = `/images/${id}`;
      modalImg.alt = post.name;
      modalTitle.textContent = post.name;
      modalDesc.textContent = post.description || '';
      modalTime.textContent = `⏱ ${timeAgo(post.created_at)}`;
      modalViews.textContent = `👁 ${post.views} views`;
      modalLikes.textContent = post.likes;

      // count view ONLY when modal opens
      fetch(`/api/view/${id}`,{method:'POST'}).then(()=> {
        // refresh views label
        fetch(`/api/image/${id}`).then(r=>r.json()).then(p=>{
          modalViews.textContent = `👁 ${p.views} views`;
        });
      });

      // load modal comments
      fetch(`/api/comments/${id}`).then(r=>r.json()).then(list=>{
        modalComments.innerHTML='';
        list.forEach(c=>{
          const div = document.createElement('div');
          div.className = 'comment';
          div.innerHTML = `<strong>${c.username}:</strong> ${c.content}`;
          modalComments.appendChild(div);
        });
      });

      // like inside modal
      modalLikeBtn.onclick = ()=>{
        likePost(id).then(newLikes=>{
          modalLikes.textContent = newLikes;
        });
      };

      // comment inside modal
      modalCommentForm.onsubmit = (e)=>{
        e.preventDefault();
        const username = modalCommentForm.username.value.trim();
        const content = modalCommentForm.content.value.trim();
        if(!username || !content) return;
        fetch(`/api/comments/${id}`,{ 
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({username, content})
        }).then(()=> {
          modalCommentForm.reset();
          // refresh both comment lists
          loadComments(id);
          openPost(id); // re-pull modal data
        });
      };

      openModal();
    });
}
