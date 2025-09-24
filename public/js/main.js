const container = document.getElementById('images');

fetch('/api/images')
.then(res => res.json())
.then(data => {
  data.forEach(img => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <img src="/images/${img.id}" alt="${img.name}">
      <h3>${img.name}</h3>
      <p>${img.description}</p>
      <div class="comment-section" id="comments-${img.id}">
        <h4>Comments</h4>
        <div class="comment-list"></div>
        <form class="comment-form">
          <input type="text" name="username" placeholder="Your name" required>
          <input type="text" name="content" placeholder="Add a comment..." required>
          <button type="submit">Post</button>
        </form>
      </div>
    `;
    container.appendChild(div);

    // โหลด comment
    loadComments(img.id);

    // เพิ่ม comment
    const form = div.querySelector('.comment-form');
    form.addEventListener('submit', e=>{
      e.preventDefault();
      const username = form.username.value;
      const content = form.content.value;
      fetch(`/api/comments/${img.id}`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({username, content})
      })
      .then(res=>res.json())
      .then(()=>{
        form.reset();
        loadComments(img.id);
      });
    });
  });
});

function loadComments(imageId){
  fetch(`/api/comments/${imageId}`)
  .then(res=>res.json())
  .then(data=>{
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
