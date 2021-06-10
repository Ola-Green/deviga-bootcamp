const router = require("express").Router();
const auth = require("../middlewares/auth");
const notifyControllers = require("../controllers/notifyController");

router.post('/notify', auth, notifyControllers.createNotify);

router.delete('/notify/:id', auth, notifyControllers.removeNotify);

router.get('/notifies', auth, notifyControllers.getNotifies)

router.patch('/isReadNotify/:id', auth, notifyControllers.isReadNotify);

router.delete('/deleteAllNotify', auth, notifyControllers.deleteAllNotifies)



module.exports = router