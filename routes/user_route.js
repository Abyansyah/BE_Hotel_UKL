const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const auth = require('../auth/auth');
app.use(express.json());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const userController = require(`../controller/user_controller`);
const { checkRole } = require(`../middleware/checkrole`);

app.post('/login', userController.login);
app.get('/getAll', auth.authVerify, checkRole(['admin', 'resepsionis']), userController.getAllUser);
app.get('/:id', userController.findUserById);
app.post('/finduser', auth.authVerify, checkRole(['admin']), userController.findUser);
app.post('/', auth.authVerify, userController.addUser);
app.put('/:id', auth.authVerify, checkRole(['admin']), userController.updateUser);
app.delete('/:id', auth.authVerify, checkRole(['admin']), userController.deleteUser);

module.exports = app;
