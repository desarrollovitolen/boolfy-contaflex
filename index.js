const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const multer = require('multer');
const csv = require('csv-parser');
const ftp = require('basic-ftp');

const app = express();
const port = 3001;

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

// MODIFICACIÓN: La ruta ahora acepta el nombre del archivo como parámetro de consulta
app.post('/upload-csv', validateHeaders, upload.single('csvFile'), async (req, res) => {
    // 1. OBTENER EL NOMBRE DEL ARCHIVO DEL QUERY PARAMETER
    const fileName = req.query.fileName; // MODIFICACIÓN: Lee el parámetro 'fileName'

    if (!fileName) {
        // Validación en caso de que el parámetro falte
        return res.status(400).json({ error: 'Falta el parámetro de consulta "fileName" para el nombre del archivo de destino.' });
    }
    
    // Asegurarse de que el nombre del archivo termine con .csv si no lo hace
    const finalFileName = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`; 


    if (!req.file) {
        return res.status(400).json({ error: 'No se ha cargado ningún archivo CSV' });
    }

    const filePath = path.join(__dirname, req.file.path);

    const results = [];
    fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
        
        // 2. USAR EL NOMBRE DE ARCHIVO EN LA RUTA DE SALIDA LOCAL
        const outputFilePath = path.join(__dirname, 'output', finalFileName); // MODIFICACIÓN
        const outputStream = fs.createWriteStream(outputFilePath);
        
        results.forEach((row) => {
            outputStream.write(Object.values(row).join(',') + '\n');
        });
        outputStream.end();

        // Ahora, vamos a subir el archivo usando basic-ftp
        const client = new ftp.Client();
        client.ftp.verbose = true;

        try {
            console.log("Intentando conectarse..")
            await client.access({
                host: '132.132.132.132',
                user: 'vitoweb',
                password: 'ps5ty15se36',
                dataMode: 'PASV', 
                usePassiveMode: true, 
                secure: false, 
            });
            
            console.log("CONECTADO..")

            client.ftp.timeout = 30000; 

           
            client.ftp.usePassiveMode = true;
            
            // 3. USAR EL NOMBRE DE ARCHIVO EN LA RUTA DE DESTINO FTP
            const path_to_send = `etiquetas/boolfy/${finalFileName}` // MODIFICACIÓN
            
            console.log("Intentando enviar a ", path_to_send)
            // Subir el archivo al servidor FTP
            await client.uploadFrom(outputFilePath, path_to_send);
            console.log('Archivo enviado exitosamente');

            res.status(200).json({ message: `Archivo ${finalFileName} procesado y enviado exitosamente` });
        } catch (error) {
            console.error('Error al enviar el archivo:', error);
            res.status(500).json({ error: 'Error al enviar el archivo', details: error.message });
        } finally {
            client.close();
        }
    });
});

// Levantar el servidor en el puerto indicado
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});