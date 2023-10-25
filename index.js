const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('whatsapp-web.js');
//const qrCodeTerminal = require('qrcode-terminal');
const qrCodeImagen = require('qrcode');
const fs = require('fs');
const app = express();

var client;

function inicializarCliente(){
    console.log("Inicializando conexion con cliente web");
    client= new Client();
    client.initialize();
    
    client.on('disconnected', (reason) => {
        console.log(`Cliente desconectado debido a: ${reason}`);
        inicializarCliente();
    });

    client.on('ready', () => {
        console.log('Cliente Wpp Web Conectado');
    });

    client.on('qr', (qrCode) => {
        //qrCodeTerminal.generate(qrCode, { small: true });
        qrCodeImagen.toFile('./codigo-qr.png', `${qrCode}`, function (err) {
            if (err) throw err;
            console.log('Código QR generado y guardado en codigo-qr.png');
        });
    });
}

inicializarCliente();

app.use(bodyParser.json());

app.post('/enviar-mensaje', (req, res) => {
    const { destinos, mensaje } = req.body;

    if (!destinos || !Array.isArray(destinos) || destinos.length === 0) {
        return res.status(400).json({ success: false, mensaje: 'La lista de destinos es inválida.' });
    }

    const promises = destinos.map(numeroDestino => {
        return client.sendMessage(`${numeroDestino}@c.us`, mensaje)
            .then(() => {
                console.log(`Mensaje enviado a ${numeroDestino} correctamente`);
                return { success: true, numeroDestino, mensaje: 'Mensaje enviado correctamente' };
            })
            .catch(error => {
                console.error(`Error al enviar mensaje a ${numeroDestino}`, error);
                return { success: false, numeroDestino, mensaje: 'Error al enviar mensaje' };
            });
    });

    Promise.all(promises)
        .then(results => {
            res.json(results);
        });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
