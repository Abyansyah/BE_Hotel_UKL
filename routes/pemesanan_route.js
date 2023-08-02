const bodyParser = require('body-parser');
const express = require('express');
const app = express();
app.use(express.json());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const pemesananController = require(`../controller/pemesanan_controller`);
const auth = require('../auth/auth');
const { checkRole } = require(`../middleware/checkrole`);

app.get('/', auth.authVerify, checkRole(['admin', 'resepsionis']), pemesananController.getPemesanan);
app.get('/tgl', auth.authVerify, checkRole(['admin', 'resepsionis']), pemesananController.findDatatgl);
app.get('/:id', auth.authVerify, checkRole(['admin', 'resepsionis']), pemesananController.getPemesananById);
app.put('/status/:id', auth.authVerify, checkRole(['admin', 'resepsionis']), pemesananController.updateStatus);
app.post('/', auth.authVerify, checkRole(['admin', 'resepsionis']), pemesananController.addPemesanan);
app.post('/findcheckin', pemesananController.findDatatgl);
app.put('/:id', auth.authVerify, checkRole(['admin', 'resepsionis']), pemesananController.updatePemesanan);
app.delete('/:id', auth.authVerify, checkRole(['admin', 'resepsionis']), pemesananController.deletePemesanan);

module.exports = app;
