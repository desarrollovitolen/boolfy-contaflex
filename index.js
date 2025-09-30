const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const multer = require('multer');
const csv = require('csv-parser');
const ftp = require('basic-ftp');  // Importar la librería FTP

const app = express();
const port = 3000;

// Configuración de multer para manejar la carga de archivos CSV
const upload = multer({ dest: 'uploads/' });

// Verifica si la cabecera es correcta
const validateHeaders = (req, res, next) => {
    const headerValue = req.headers['asdasd'];
    if (headerValue && headerValue === 'asdasd') {
        next(); 
    } else {
        res.status(400).json({ error: 'Cabecera inválida' });
    }
};

app.post('/upload-csv', validateHeaders, upload.single('csvFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se ha cargado ningún archivo CSV' });
    }

    const filePath = path.join(__dirname, req.file.path);

    const results = [];
    fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
        const outputFilePath = path.join(__dirname, 'output', 'result.csv');
        const outputStream = fs.createWriteStream(outputFilePath);
        results.forEach((row) => {
            outputStream.write(Object.values(row).join(',') + '\n');
        });
        outputStream.end();

        // Ahora, vamos a subir el archivo usando basic-ftp
        const client = new ftp.Client();
        client.ftp.verbose = true;  // Habilita los logs detallados para debug

        try {

            await client.access({
                host: '132.1.132.132',
                user: 'vitoweb',
                password: 'ps5ty15se36',
                secure: false, // Si usas FTP o FTPS, ajusta esto según sea necesario
            });

            client.ftp.timeout = 30000; 

           
            client.ftp.usePassiveMode = true;

            // Subir el archivo al servidor FTP
            await client.uploadFrom(outputFilePath, '/home/jorge/files_to_test_boolfy/result.csv');
            console.log('Archivo enviado exitosamente');

            res.status(200).json({ message: 'Archivo procesado y enviado exitosamente' });
        } catch (error) {
            console.error('Error al enviar el archivo:', error);
            res.status(500).json({ error: 'Error al enviar el archivo' });
        } finally {
            client.close();
        }
    });
});

// Levantar el servidor en el puerto indicado
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
