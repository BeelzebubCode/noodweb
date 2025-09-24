const cardsContainer = document.getElementById('cardsContainer');
const formAdd = document.getElementById('formAdd');

// โหลดรูปทั้งหมด
async function loadImages() {
  const res = await fetch('/admin/api/list');
  const data = await res.json();
  cardsContainer.innerHTML = '';

  data.forEach(img => {
    const card = document.createElement('div');
    card.className = 'card';

    // ตัด description ถ้ายาวเกิน
    const shortDesc = truncateText(img.description || '', 100);
    const hasMore = img.description && img.description.length > 100;

    card.innerHTML = `
      <img src="/images/${img.id}" alt="${img.name}">
      <h3>${img.name}</h3>
      <div class="desc">
        ${shortDesc}
        ${hasMore ? `<button class="read-more" onclick="openPopup(${img.id}, '${escapeHTML(img.name)}', '${escapeHTML(img.description)}')">อ่านเพิ่มเติม</button>` : ''}
      </div>
      <div class="actions">
        <button class="edit" onclick="openEditModal(${img.id}, '${escapeHTML(img.name)}', '${escapeHTML(img.description || '')}')">Edit</button>
        <button class="delete" onclick="deleteImage(${img.id})">Delete</button>
      </div>
      <div class="comment-section" id="comments-${img.id}">
        <h4>Comments</h4>
        <div class="comment-list"></div>
      </div>
    `;
    cardsContainer.appendChild(card);

    loadComments(img.id);
  });
}

// เพิ่มภาพใหม่
formAdd.addEventListener('submit', async e => {
  e.preventDefault();
  const formData = new FormData(formAdd);
  await fetch('/admin/api/add', { method: 'POST', body: formData });
  formAdd.reset();
  loadImages();
});

// ลบภาพ
async function deleteImage(id) {
  if (!confirm('Delete this image?')) return;
  await fetch(`/admin/api/delete/${id}`, { method: 'DELETE' });
  loadImages();
}

// ====== Modal Edit ======
function openEditModal(id, name, description) {
  // ลบ modal เดิมถ้ามี
  const old = document.querySelector('.modal-overlay');
  if (old) old.remove();

  const modal = document.createElement('div');
  modal.className = 'modal-overlay active';
  modal.innerHTML = `
    <div class="modal">
      <button class="close-btn">&times;</button>
      <h2>Edit Image</h2>
      <form id="formEdit-${id}" enctype="multipart/form-data" class="edit-form">
        <label>Title</label>
        <input type="text" name="name" value="${name}" required>

        <label>Description</label>
        <textarea name="description" rows="3">${description}</textarea>

        <label>Replace Image</label>
        <input type="file" name="image_file" id="fileInput-${id}">
        <div class="preview" id="preview-${id}"></div>

        <div class="modal-actions">
          <button type="submit" class="save">Save</button>
          <button type="button" class="cancel">Cancel</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  // ปิด modal
  modal.querySelector('.cancel').addEventListener('click', () => modal.remove());
  modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  // Preview รูป
  const fileInput = modal.querySelector(`#fileInput-${id}`);
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    const preview = modal.querySelector(`#preview-${id}`);
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        preview.innerHTML = `<img src="${ev.target.result}" alt="Preview">`;
      };
      reader.readAsDataURL(file);
    } else {
      preview.innerHTML = '';
    }
  });

  // Submit edit
  modal.querySelector(`#formEdit-${id}`).addEventListener('submit', async e => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await fetch(`/admin/api/edit/${id}`, { method: 'POST', body: formData });
    modal.remove();
    loadImages();
  });
}

// ====== Modal Popup (อ่านเพิ่มเติม) ======
function openPopup(id, name, description) {
  const old = document.querySelector('.modal-overlay');
  if (old) old.remove();

  const modal = document.createElement('div');
  modal.className = 'modal-overlay active';
  modal.innerHTML = `
    <div class="modal">
      <button class="close-btn">&times;</button>
      <img src="/images/${id}" alt="${name}" style="max-width:100%;border-radius:8px;margin-bottom:10px;">
      <h2>${name}</h2>
      <p>${description}</p>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

// โหลดคอมเมนต์ (Read-only)
async function loadComments(imageId) {
  const res = await fetch(`/api/comments/${imageId}`);
  const data = await res.json();
  const list = document.querySelector(`#comments-${imageId} .comment-list`);
  list.innerHTML = '';
  if (data.length === 0) {
    list.innerHTML = `<div class="comment empty">No comments</div>`;
  } else {
    data.slice(0, 3).forEach(c => {
      const div = document.createElement('div');
      div.className = 'comment';
      div.innerHTML = `<strong>${c.username}:</strong> ${c.content}`;
      list.appendChild(div);
    });
  }
}

// Helper: Escape HTML
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag]));
}

// Helper: ตัดข้อความ
function truncateText(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

// เริ่มโหลด
loadImages();
