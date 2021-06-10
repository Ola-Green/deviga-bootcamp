const router = require('express').Router()
const messageControllers = require('../controllers/messageControllers');
const auth = require('../middlewares/auth')

router.post('/message', auth, messageControllers.createMessage);

router.get('/conversations', auth, messageControllers.getConversations);

router.get('/message/:id', auth, messageControllers.getMessages);

router.delete('/message/:id', auth, messageControllers.deleteMessages);

router.delete('/conversation/:id', auth, messageControllers.deleteConversation);


module.exports = router