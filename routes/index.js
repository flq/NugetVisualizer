var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.header('Access-Control-Allow-Origin', 'http://www.nuget.org/api/v2/Packages()');
  res.render('index', { title: 'Nuget Web' });
});

module.exports = router;
