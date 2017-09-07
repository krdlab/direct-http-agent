const router = require('express').Router();

// TODO: implementation

router.get('/', (req, res) => {
  console.log(req.method, req.path);
  res.send('');
});

router.post('/', (req, res) => {
  console.log(req.method, req.path);
  res.send('');
});

router.delete('/:id', (req, res) => {
  console.log(req.method, req.path);
  res.send('');
});

module.exports = router;