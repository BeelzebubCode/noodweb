// server.js
const express = require('express');
const mysql = require('mysql');
const multer = require('multer');
const path = require('path');
const app = express();
const port = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Multer memory storage (เก็บไฟล์ใน RAM)
const upload = multer({ storage: multer.memoryStorage() });

// MySQL connection
const db = mysql.createConnection({
  host: '16.176.209.179',
  user: 'webserver',
  password: 'webserver',
  database: 'art'
});
db.connect(err => { 
  if(err) console.error(err); 
  else console.log('Connected to MySQL'); 
});

// Serve static CSS/JS
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));

// ================= Routes =================

// หน้าเว็บหลัก
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

// Admin Panel
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public/admin.html')));

// API: ดึงข้อมูลภาพทั้งหมด
app.get('/api/images', (req, res) => {
  db.query('SELECT id, name, description, likes, views, created_at FROM images ORDER BY id DESC', (err, results) => {
    if(err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Route: ส่งภาพ BLOB ตาม id
app.get('/images/:id', (req, res) => {
  const id = req.params.id;
  db.query('SELECT image_data, mime_type FROM images WHERE id = ?', [id], (err, results) => {
    if(err) return res.status(500).send('DB error');
    if(results.length === 0) return res.status(404).send('Not found');

    res.set('Content-Type', results[0].mime_type || 'image/png');
    res.send(results[0].image_data);
  });
});

// Admin API: list
app.get('/admin/api/list', (req, res) => {
  db.query('SELECT id, name, description, likes, views FROM images ORDER BY id DESC', (err, results) => {
    if(err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Admin API: add image
app.post('/admin/api/add', upload.single('image_file'), (req, res) => {
  const { name, description } = req.body;
  const imageData = req.file.buffer;
  const mimeType = req.file.mimetype;

  db.query(
    'INSERT INTO images (name, description, image_data, mime_type, likes, views) VALUES (?, ?, ?, ?, 0, 0)',
    [name, description, imageData, mimeType],
    (err, result) => {
      if(err) return res.status(500).json({ error: err });
      res.json({ message: 'Image added', id: result.insertId });
    }
  );
});

// Admin API: edit
app.post('/admin/api/edit/:id', upload.single('image_file'), (req, res) => {
  const { name, description } = req.body;
  const id = req.params.id;

  if (req.file) {
    const imageData = req.file.buffer;
    const mimeType = req.file.mimetype;
    db.query(
      'UPDATE images SET name=?, description=?, image_data=?, mime_type=? WHERE id=?',
      [name, description, imageData, mimeType, id],
      (err) => {
        if(err) return res.status(500).json({ error: err });
        res.json({ message: 'Updated successfully' });
      }
    );
  } else {
    db.query(
      'UPDATE images SET name=?, description=? WHERE id=?',
      [name, description, id],
      (err) => {
        if(err) return res.status(500).json({ error: err });
        res.json({ message: 'Updated successfully' });
      }
    );
  }
});

// Admin API: delete
app.delete('/admin/api/delete/:id', (req, res) => {
  const id = req.params.id;
  db.query('DELETE FROM images WHERE id=?', [id], (err) => {
    if(err) return res.status(500).json({ error: err });
    res.json({ message: 'Deleted successfully' });
  });
});

// ================= Comments =================
app.get('/api/comments/:imageId', (req, res) => {
  const imageId = req.params.imageId;
  db.query('SELECT * FROM comments WHERE image_id=? ORDER BY created_at DESC', [imageId], (err, results) => {
    if(err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

app.post('/api/comments/:imageId', (req, res) => {
  const imageId = req.params.imageId;
  const { username, content } = req.body;
  db.query(
    'INSERT INTO comments (image_id, username, content) VALUES (?, ?, ?)',
    [imageId, username, content],
    (err, result) => {
      if(err) return res.status(500).json({ error: err });
      res.json({ message: 'Comment added', id: result.insertId });
    }
  );
});

// ================= Likes & Views =================

// Like API
app.post('/api/like/:id', (req, res) => {
  const id = req.params.id;
  db.query('UPDATE images SET likes = likes + 1 WHERE id=?', [id], err => {
    if(err) return res.status(500).json({ error: err });
    db.query('SELECT likes FROM images WHERE id=?', [id], (err, results) => {
      if(err) return res.status(500).json({ error: err });
      res.json({ likes: results[0].likes });
    });
  });
});

// View API
app.post('/api/view/:id', (req, res) => {
  const id = req.params.id;
  db.query('UPDATE images SET views = views + 1 WHERE id=?', [id], err => {
    if (err) return res.status(500).json({ error: err });
    db.query('SELECT views FROM images WHERE id=?', [id], (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ views: results[0].views });
    });
  });
});

// ================= Single Image =================
app.get('/api/image/:id', (req, res) => {
  const id = req.params.id;
  db.query(
    'SELECT id, name, description, created_at, views, likes FROM images WHERE id = ?',
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      if (!results.length) return res.status(404).json({ error: 'Not found' });
      res.json(results[0]);
    }
  );
});

// ================= Start Server =================
app.listen(port, '0.0.0.0', () => console.log(`Server running on port ${port}`));
