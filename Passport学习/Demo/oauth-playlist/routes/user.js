const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/api/user/:id', function(req, res, next) {
    const user={name:"Chen-xy",age:"22",address:"bj"};
    req.session.user = user;
    console.log(req.session);
    res.send(user);
});

module.exports = router;