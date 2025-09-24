const grid = document.getElementById('images');

// Modal refs (ของ modal เดิมใน index.html)
const modal = document.querySelector('#postModal');
const modalImg = modal.querySelector('#modalImage');
const modalTitle = modal.querySelector('#modalTitle');
const modalDesc = modal.querySelector('#modalDesc');
const modalTime = modal.querySelector('#modalTime');
const modalViews = modal.querySelector('#modalViews');
const modalLikes = modal.querySelector('#modalLikes');
const modalLikeBtn = modal.querySelector('#modalLikeBtn');
const modalComments = modal.querySelector('#modalComments');
const modalCommentForm = modal.querySelector('#modalCommentForm');

let currentPostId = null;
let timeInterval = null;

/* Helpers */
function timeAgo(iso){
  if(!iso) return '';
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

/* ========== Modal Functions ========== */
function openModal(){ modal.setAttribute('aria-hidden','false'); }
function closeModal(){ 
  modal.setAttribute('aria-hidden','true');
  if(timeInterval) clearInterval(timeInterval);
}
document.querySelectorAll('[data-close-modal]').forEach(el=>{
  el.addEventListener('click', closeModal);
});
document.addEventListener('keydown', e=>{
  if(e.key==='Escape') closeModal();
});

/* ========== Load Feed ========== */
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
          <span class="chip" id="time-${post.id}">⏱ ${timeAgo(post.created_at)}</span>
          <span class="chip" id="views-${post.id}">👁 ${post.views} views</span>
          <button class="btn-like" data-open="${post.id}">🔍 View</button>
        </div>
      </div>
    `;
    grid.appendChild(card);

    // คลิก → เปิด popup (เปลี่ยนตรงนี้ถ้าอยากให้เปิด modal แทน)
    card.querySelector('[data-open]').addEventListener('click', ()=>openPostPopup(post.id));
    card.querySelector('.card__image').addEventListener('click', ()=>openPostPopup(post.id));
    card.querySelector('.card__title').addEventListener('click', ()=>openPostPopup(post.id));
  });
});

/* ========== Modal (แบบเก่า) ========== */
function loadComments(imageId){
  fetch(`/api/comments/${imageId}`)
  .then(res=>res.json())
  .then(list=>{
    modalComments.innerHTML = '';
    list.forEach(c=>{
      const div = document.createElement('div');
      div.className = 'comment';
      div.innerHTML = `<strong>${c.username}:</strong> ${c.content}`;
      modalComments.appendChild(div);
    });
  });
}

function openPostModal(id){
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

      if(timeInterval) clearInterval(timeInterval);
      timeInterval = setInterval(()=>{
        modalTime.textContent = `⏱ ${timeAgo(post.created_at)}`;
      },60000);

      // count view
      fetch(`/api/view/${id}`,{method:'POST'})
        .then(()=>fetch(`/api/image/${id}`))
        .then(r=>r.json())
        .then(p=>{
          modalViews.textContent = `👁 ${p.views} views`;
          const viewEl = document.getElementById(`views-${id}`);
          if(viewEl) viewEl.textContent = `👁 ${p.views} views`;
        });

      loadComments(id);

      modalLikeBtn.onclick = ()=>{
        fetch(`/api/like/${id}`,{method:'POST'}).then(r=>r.json()).then(d=>{
          modalLikes.textContent = d.likes;
        });
      };

      modalCommentForm.onsubmit = (e)=>{
        e.preventDefault();
        const username = modalCommentForm.username.value.trim();
        const content = modalCommentForm.content.value.trim();
        if(!username || !content) return;
        fetch(`/api/comments/${id}`,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({username, content})
        }).then(()=>{
          modalCommentForm.reset();
          loadComments(id);
        });
      };

      openModal();
    });
}

/* ========== Popup (ใหม่แบบ Facebook) ========== */
function openPostPopup(id){
  fetch(`/api/image/${id}`)
    .then(res=>res.json())
    .then(post=>{
      const container = document.getElementById('popupContainer');
      container.innerHTML = '';

      const overlay = document.createElement('div');
      overlay.className = 'popup-overlay';

      const box = document.createElement('div');
      box.className = 'popup-box';

      const closeBtn = document.createElement('div');
      closeBtn.className = 'popup-close';
      closeBtn.innerHTML = '&times;';
      closeBtn.onclick = ()=> container.innerHTML = '';

      const left = document.createElement('div');
      left.className = 'popup-image';
      left.innerHTML = `<img src="/images/${id}" alt="${post.name}">`;

      const right = document.createElement('div');
        right.className = 'popup-content';
        right.innerHTML = `
        <div class="popup-content-header">
          <h2>${post.name}</h2>
          <p class="muted">${post.description || ''}</p>
          <div class="meta-row">
            <span class="chip">⏱ ${timeAgo(post.created_at)}</span>
            <span class="chip">👁 ${post.views} views</span>
            <button class="chip like-btn">👍 <span>${post.likes}</span></button>
          </div>
        </div>
        <div class="popup-comment-list" id="popupComments"></div>
        <form class="popup-comment-form" id="popupCommentForm">
          <input type="text" name="username" placeholder="Your name" required />
          <input type="text" name="content" placeholder="Add a comment..." required />
          <button type="submit">Post</button>
        </form>
      `;


      box.appendChild(closeBtn);
      box.appendChild(left);
      box.appendChild(right);
      overlay.appendChild(box);
      container.appendChild(overlay);

      loadPopupComments(id);

      right.querySelector('.like-btn').onclick = ()=>{
        fetch(`/api/like/${id}`,{method:'POST'}).then(r=>r.json()).then(d=>{
          right.querySelector('.like-btn span').textContent = d.likes;
        });
      };

      right.querySelector('#popupCommentForm').onsubmit = (e)=>{
        e.preventDefault();
        const username = e.target.username.value.trim();
        const content = e.target.content.value.trim();
        if(!username || !content) return;
        fetch(`/api/comments/${id}`,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({username, content})
        }).then(()=>{
          e.target.reset();
          loadPopupComments(id);
        });
      };
    });
}

function loadPopupComments(imageId){
  fetch(`/api/comments/${imageId}`)
  .then(res=>res.json())
  .then(list=>{
    const listEl = document.getElementById('popupComments');
    if(!listEl) return;
    listEl.innerHTML = '';
    list.forEach(c=>{
      const div = document.createElement('div');
      div.className = 'comment';
      div.innerHTML = `<strong>${c.username}:</strong> ${c.content}`;
      listEl.appendChild(div);
    });
  });
}
