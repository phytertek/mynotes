const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const Note = require('./notes');

mongoose.Promise = global.Promise;
const connect = mongoose.connect(
  'mongodb://localhost/notes',
  { useMongoClient: true }
);

const STATUS_USER_ERROR = 422;
const STATUS_SERVER_ERROR = 500;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// handle errors
app.use((req, res, next) => {
  res.sendUserError = function (err) {
    const userError = typeof err ==='string' ? { error: err } : err;
    this.status(STATUS_USER_ERROR);
    this.json(userError);
  };
  next();
});

app.use((req, res, next) => {
  res.sendSystemError = function (err) {
    const systemError = err;
    this.status(STATUS_SERVER_ERROR);
    this.json(systemError);
  };
  next();
});

app.listen(8080, () => {
  console.log('Server listening on port 8080');
});

// handle welcome/ home page
app.get('/', (req, res) => {
  res.json('hello world!');
});

// create new note
app.post('/notes', (req, res) => {
  const { title, content, created_at } = req.body;
  const newNote = new Note(req.body);
  if (!content) {
    res.sendUserError('Please add content to your note');
    return;
  }
  newNote.save((err, newNote) => {
    if(err) res.sendSystemError('Could not save note');
    res.status(200).json(newNote);
  });
});

// retrieve all notes
app.get('/notes', (req, res) => {
  Note.find({}, (err, notes) => {
    if(err) res.sendSystemError('Cannot get notes');
    res.json(notes);
  });
});

// retrieve a note
app.get('/notes/:id', (req, res) => {
  const id = req.params.id;
  Note.findById(req.params.id, (err, note) => {
    if(err) res.sendSystemError(err);
    if(!id) {
      res.sendUserError('Note not found');
      return;
    }
    res.json(note);
  });
});

// update note- find, edit, save
app.put('/notes/:id', (req, res) => {
  const id = req.params.id;
  Note.findById(req.params.id, (err, note) => {
    if(err) res.sendSystemError(err);
    if(!id) {
      res.sendUserError('Note not found');
      return;
    }
    // edit the note
    note.title = req.body.title || note.title;
    note.content = req.body.content || note.content;
    // save the note
    note.save((err, note) => {
      if(err) res.sendSystemError(err);
      res.json(note);
    });
  });
  Note.find({}, (err, notes) => {
    if(err) res.sendSystemError(err);
    res.json(notes);
  })
});

// delete note- find and delete
app.delete('/notes/:id', (req, res) => {
  const id = req.params.id;
  Note.findByIdAndRemove(req.params.id, (err, note) => {
    if(err) res.sendSystemError(err);
    if(!id) {
      res.sendUserError('Note not found');
      return;
    }
    res.json({ success: true, message: 'note successfully deleted'});
  });
  Note.find({}, (err, notes) => {
    if(err) res.sendSystemError(err);
    res.json(notes);
  })
});
