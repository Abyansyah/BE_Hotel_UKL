const bodyParser = require('body-parser');
const express = require('express');
const app = express();
app.use(express.json());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const tipeController = require(`../controller/tipe_kamar_controller`);
const auth = require('../auth/auth');
const { checkRole } = require(`../middleware/checkrole`);

app.get('/', auth.authVerify, checkRole(['admin', 'resepsionis']), tipeController.getAllTipekamar);
app.post('/findtipe', auth.authVerify, checkRole(['admin', 'resepsionis']), tipeController.findTipekamar);
app.post('/', auth.authVerify, checkRole(['admin', 'resepsionis']), tipeController.addTipe);
app.put('/:id', auth.authVerify, checkRole(['admin', 'resepsionis']), tipeController.updateTipe);
app.delete('/:id', auth.authVerify, checkRole(['admin', 'resepsionis']), tipeController.deleteUser);

module.exports = app;
