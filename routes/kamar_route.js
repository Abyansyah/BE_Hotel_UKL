const bodyParser = require('body-parser');
const express = require('express');
const app = express();
app.use(express.json());
const auth = require('../auth/auth');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const kamarController = require(`../controller/kamar_controller`);
const { checkRole } = require(`../middleware/checkrole`);

app.get('/', auth.authVerify, checkRole(['admin', 'resepsionis']), kamarController.getAllkamar);
app.get('/avaIble', kamarController.getAvaible);
app.get('/:id', auth.authVerify, checkRole(['admin', 'resepsionis']), kamarController.findTipeById);
app.post('/findtipe', auth.authVerify, checkRole(['admin', 'resepsionis']), kamarController.findKamar);
app.get('/findByTipe/:tipeKamarId', kamarController.findTipK);
app.post('/', auth.authVerify, checkRole(['admin', 'resepsionis']), kamarController.addKamar);
app.put('/:id', auth.authVerify, checkRole(['admin', 'resepsionis']), kamarController.updateKamar);
app.delete('/:id', auth.authVerify, checkRole(['admin', 'resepsionis']), kamarController.deleteKamar);

module.exports = app;
