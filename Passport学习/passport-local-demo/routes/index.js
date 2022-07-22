var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("index get via index module")
  res.render('index', { title: 'Express' });
});

module.exports = router;
