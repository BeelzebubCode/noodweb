const cardsContainer = document.getElementById('cardsContainer');
const formAdd = document.getElementById('formAdd');

function loadImages(){
  fetch('/admin/api/list')
  .then(res => res.json())
  .then(data => {
    cardsContainer.innerHTML = '';
    data.forEach(img => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <img src="/images/${img.id}" alt="${img.name}">
        <h3>${img.name}</h3>
        <p>${img.description}</p>
        <div class="actions">
          <button class="edit" onclick="editImage(${img.id})">Edit</button>
          <button class="delete" onclick="deleteImage(${img.id})">Delete</button>
        </div>
        <div class="comment-section" id="comments-${img.id}">
          <h4>Comments</h4>
          <div class="comment-list"></div>
          <form class="comment-form">
            <input type="text" name="username" placeholder="Your name" required>
            <input type="text" name="content" placeholder="Comment..." required>
            <button type="submit">Post</button>
          </form>
        </div>
      `;
      cardsContainer.appendChild(card);
      loadComments(img.id);

      const form = card.querySelector('.comment-form');
      form.addEventListener('submit', e=>{
        e.preventDefault();
        const username = form.username.value;
        const content = form.content.value;
        fetch(`/api/comments/${img.id}`,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({username, content})
        }).then(()=> {
          form.reset();
          loadComments(img.id);
        });
      });
    });
  });
}

formAdd.addEventListener('submit', e=>{
  e.preventDefault();
  const formData = new FormData(formAdd);
  fetch('/admin/api/add',{ method:'POST', body:formData })
  .then(res => res.json())
  .then(()=> { formAdd.reset(); loadImages(); });
});

function deleteImage(id){
  if(!confirm('Delete this image?')) return;
  fetch(`/admin/api/delete/${id}`,{method:'DELETE'})
  .then(()=> loadImages());
}

function editImage(id){
  // สามารถสร้าง modal form สำหรับแก้ไขชื่อ/description + เปลี่ยนไฟล์ภาพ
  alert('Feature modal edit: implement as needed');
}

// โหลดคอมเมนต์
function loadComments(imageId){
  fetch(`/api/comments/${imageId}`)
    .then(res => res.json())
    .then(data => {
      const list = document.querySelector(`#comments-${imageId} .comment-list`);
      list.innerHTML = '';
      data.forEach(c=>{
        const div = document.createElement('div');
        div.className = 'comment';
        div.innerHTML = `<strong>${c.username}:</strong> ${c.content}`;
        list.appendChild(div);
      });
    });
}


loadImages();
