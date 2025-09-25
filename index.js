const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const multer = require('multer');
const csv = require('csv-parser');

const app = express();
const port = 3000;

// Configuración de multer para manejar la carga de archivos CSV
const upload = multer({ dest: 'uploads/' });

// Verifica si la cabecera es correcta
const validateHeaders = (req, res, next) => {
  const headerValue = req.headers['asdasdasd'];
  if (headerValue && headerValue === 'asdasdasd') {
    next(); // La cabecera es correcta, continúa al siguiente middleware
  } else {
    res.status(400).json({ error: 'Cabecera inválida' });
  }
};

// Endpoint para recibir y procesar el archivo CSV
app.post('/upload-csv', validateHeaders, upload.single('csvFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se ha cargado ningún archivo CSV' });
  }

  const filePath = path.join(__dirname, req.file.path);

  const results = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Guardamos el archivo CSV en una ubicación específica en el servidor
      const outputFilePath = path.join(__dirname, 'output', 'result.csv');
      const outputStream = fs.createWriteStream(outputFilePath);
      results.forEach((row) => {
        outputStream.write(Object.values(row).join(',') + '\n');
      });
      outputStream.end();

      // Ahora enviamos el archivo CSV por FTP (o cualquier protocolo que desees)
      const targetUrl = 'ftp://direccion:puerto/carpeta_destino/result.csv';  // Cambia esto a la URL deseada
      axios
        .put(targetUrl, fs.createReadStream(outputFilePath), {
          headers: {
            'Content-Type': 'application/octet-stream',
          },
        })
        .then((response) => {
          console.log('Archivo enviado exitosamente');
          res.status(200).json({ message: 'Archivo procesado y enviado exitosamente' });
        })
        .catch((error) => {
          console.error('Error al enviar el archivo:', error);
          res.status(500).json({ error: 'Error al enviar el archivo' });
        });
    });
});

// Levantar el servidor en el puerto indicado
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});