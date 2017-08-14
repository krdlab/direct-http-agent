const router = require('express').Router();

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

router.post('/:id/restart', (req, res) => {
  console.log(req.method, req.path);
  // TODO: Direct インスタンスを再作成 & listen
  res.send('');
});

module.exports = router;
