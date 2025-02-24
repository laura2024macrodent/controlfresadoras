const express = require('express');
const ExcelJS = require('exceljs');
const router = express.Router();
const pool = require('../database');
const {isLoggedIn} = require('../lib/auth'); 

router.get('/add', isLoggedIn, async (req, res) => {
    try {
        const operarioId = req.user.id_operario;
        const operarios = await pool.query('SELECT id_operario, fullname FROM operario WHERE id_operario = ?', [operarioId]);
        res.render('bloque/add', {operarios});
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener los operarios');
    }
});

/* router.post('/add', isLoggedIn, async(req, res) => {
    const {nombre,codigo_barras,cantidad,color,tamano,tipo_material,id_operario} = req.body;
    const usuario = req.user;
    const newBloque = {
        nombre,
        codigo_barras,
        cantidad,
        color,
        tamano,
        tipo_material,
        id_operario
    };
    // Insertar el nuevo bloque en la base de datos
    await pool.query('INSERT INTO bloque SET ?', [newBloque], async (err, results) => {
        if (err) throw err;

        // Obtener el id del nuevo bloque insertado
        const id_bloque = results.insertId;

        // Crear el mensaje de historial para el nuevo bloque
        const mensaje = `${usuario.fullname} agregó el bloque ${nombre}`;

        // Insertar el registro en el historial de bloques
        await pool.query('INSERT INTO historial_bloques (id_bloque, accion, mensaje, id_operario, nombre_operario) VALUES (?, ?, ?, ?, ?)', 
            [id_bloque, 'agregar', mensaje, usuario.id_operario, usuario.fullname], (err) => {
                if (err) throw err;

                // Descontar 1 unidad del producto en control_inventarios
                pool.query('UPDATE control_inventarios.productos SET cantidad = cantidad - 1 WHERE codigo_barras = ? AND cantidad > 0',
                    [codigo_barras], (err, updateResult) => {
                        if (err) {
                            console.error('Error al actualizar el inventario: ', err);
                            req.flash('error', 'Error al actualizar el inventario.');
                            return res.redirect('/bloque');
                        }

                        // Si no se actualizó el inventario, mostrar un mensaje de error
                        if (updateResult.affectedRows === 0) {
                            console.log('No se pudo descontar el inventario, código de barras no encontrado o sin suficiente cantidad.');
                            req.flash('error', 'No hay suficiente cantidad en inventario para descontar.');
                            return res.redirect('/bloque');
                        }

                        // Después de agregar al historial y actualizar el inventario, redirigir al usuario
                        req.flash('success', 'Bloque Guardado Exitosamente y cantidad descontada del inventario');
                        res.redirect('/bloque');
                    }
                );
            }
        );
    });
}); */

router.post('/add', isLoggedIn, async(req, res) => {
    const {nombre,codigo_barras,cantidad,color,tamano,tipo_material,id_operario} = req.body;
    const usuario = req.user;
    const newBloque = {
        nombre,
        codigo_barras,
        cantidad,
        color,
        tamano,
        tipo_material,
        id_operario
    };
    // Insertar el nuevo bloque en la base de datos
    await pool.query('INSERT INTO bloque SET ?', [newBloque], async (err, results) => {
        if (err) throw err;

        // Obtener el id del nuevo bloque insertado
        const id_bloque = results.insertId;

        // Crear el mensaje de historial para el nuevo bloque
        const mensaje = `${usuario.fullname} agregó el bloque ${nombre}`;

        // Insertar el registro en el historial de bloques
        await pool.query('INSERT INTO historial_bloques (id_bloque, accion, mensaje, id_operario, nombre_operario) VALUES (?, ?, ?, ?, ?)', 
            [id_bloque, 'agregar', mensaje, usuario.id_operario, usuario.fullname], (err) => {
                if (err) throw err;

                // Después de agregar al historial, redirigir al usuario
                req.flash('success', 'Bloque Guardado Exitosamente');
                res.redirect('/bloque');
            }
        );
    });
});

router.get('/', isLoggedIn, async(req, res) => {
    const bloque = await pool.query('SELECT b.*, o.fullname AS operario_fullname FROM bloque b LEFT JOIN operario o ON b.id_operario = o.id_operario ORDER BY fecha_creacion DESC;');
    console.log(bloque);
    res.render('bloque/list', {bloque});
});

// Ruta para actualizar el estado de un bloque
router.post('/update', isLoggedIn, async (req, res) => {
    const { id_bloque, estado } = req.body;

    // Si el estado es "Finalizado" (0), actualizamos la fecha de finalización
    let fechaFinalizacion = null;

    try {
        // Obtenemos la fecha de finalización actual del bloque
        const [bloque] = await pool.query('SELECT fecha_finalizacion FROM bloque WHERE id_bloque = ?', [id_bloque]);
        
        if(bloque){
            if(estado === '0'){
                if (!bloque.fecha_finalizacion) {
                    fechaFinalizacion = new Date();  // Fecha y hora actuales
                }
                else{
                    fechaFinalizacion = bloque.fecha_finalizacion;
                }
            }
            else if (estado === '1'){
                fechaFinalizacion = bloque.fecha_finalizacion;  // mantenemos la fecha de finalización existente
            }
        }
        // Realizamos la actualización en la base de datos
        await pool.query('UPDATE bloque SET estado = ?, fecha_finalizacion = ? WHERE id_bloque = ?', [estado, fechaFinalizacion, id_bloque]);
        req.flash('success', 'Estado Actualizado Exitosamente');
        res.redirect('/bloque');  // Redirigimos de vuelta a la lista de bloques
    } catch (error) {
        console.error('Error al actualizar el estado del bloque:', error);
        res.status(500).send('Error al actualizar el bloque');
    }
});

router.get('/delete/:id_bloque', isLoggedIn, async (req, res) => {
    const {id_bloque} = req.params;
    const usuario = req.user;
    // Obtener el bloque antes de eliminarlo
    await pool.query('SELECT * FROM bloque WHERE id_bloque = ?', [id_bloque], async (err, results) => {
        if (err) throw err;
        const bloque = results[0];
 
        // Crear el mensaje de historial
        const mensaje = `${usuario.fullname} eliminó el bloque ${bloque.nombre}`;

        // Insertar en historial
        await pool.query('INSERT INTO historial_bloques (id_bloque, accion, mensaje, id_operario, nombre_operario) VALUES (?, ?, ?, ?, ?)',
            [id_bloque, 'eliminar', mensaje, usuario.id_operario, usuario.fullname], async (err) => {
                if (err) throw err;

                // Eliminar el bloque de la base de datos
                await pool.query('DELETE FROM bloque WHERE id_bloque = ?', [id_bloque]);
                req.flash('success', 'Bloque Eliminado Exitosamente');
                res.redirect('/bloque');
            }
        );
    });
});

router.get('/edit/:id_bloque', isLoggedIn, async (req, res) => {
    const {id_bloque} = req.params;
    const bloque = await pool.query('SELECT * FROM bloque WHERE id_bloque = ?', [id_bloque]);
    console.log(bloque[0]);
    const operarios = await pool.query('SELECT o.id_operario, o.fullname FROM operario o JOIN bloque b ON o.id_operario = b.id_operario WHERE b.id_bloque = ?', [id_bloque])
    res.render('bloque/edit', {bloque: bloque[0], operarios: operarios});
});

router.post('/edit/:id_bloque', isLoggedIn, async (req, res) => {
    const {id_bloque} = req.params;
    const {nombre,codigo_barras,cantidad,color,tamano,tipo_material,id_operario} = req.body;
    const usuario = req.user;
    const newBloque = {
        nombre,
        codigo_barras,
        cantidad,
        color, 
        tamano,
        tipo_material,
        id_operario 
    };
    await pool.query('SELECT * FROM bloque WHERE id_bloque = ?', [id_bloque], async (err, results) => {
        if (err) throw err;
        const bloque = results[0];

        // Crear el mensaje de historial
        let mensaje = `${usuario.fullname} editó el bloque ${bloque.nombre}`;
        let cambiosDetectados = false;

       if (tamano && tamano != bloque.tamano) {
            mensaje += `- cambiando el tamaño de "${bloque.tamano}" a "${tamano}"`;
            cambiosDetectados = true;
        }
        if (color && color != bloque.color) {
            mensaje += ` - cambiando el color de "${bloque.color}" a "${color}"`;
            cambiosDetectados = true;
        }
        if (cantidad && cantidad != bloque.cantidad) {
            mensaje += ` - cambiando la cantidad de "${bloque.cantidad}" a "${cantidad}"`;
            cambiosDetectados = true;
        }
        if (tipo_material && tipo_material != bloque.tipo_material) {
            mensaje += ` - cambiando el tipo de material de "${bloque.tipo_material}" a "${tipo_material}"`;
            cambiosDetectados = true;
        }
        if (cambiosDetectados) {
            mensaje += `\n`;
            mensaje += ` - se cambio su nombre a  "${newBloque.nombre}"`;
            // Si hubo cambios, se inserta el mensaje en el historial
            await pool.query('INSERT INTO historial_bloques (id_bloque, accion, mensaje, id_operario, nombre_operario) VALUES (?, ?, ?, ?, ?)', 
                [id_bloque, 'editar', mensaje, usuario.id_operario, usuario.fullname], async (err) => {
                    if (err) throw err;

                    // Actualizar el bloque con los nuevos datos
                    await pool.query('UPDATE bloque SET ? WHERE id_bloque =?', [newBloque, id_bloque]);
                    req.flash('success', 'Bloque Actualizado Exitosamente');
                    res.redirect('/bloque');
                 });
        } else {
            // Si no hubo cambios, solo se actualiza el bloque sin registrar historial
            req.flash('success', 'No se realizaron cambios en el bloque');
            res.redirect('/bloque');
        }
    });
}); 

// Ruta para generar el archivo Excel
router.get('/descargar-excel', isLoggedIn, async (req, res) => {
    try {
        // Obtener los datos de la base de datos
        const result = await pool.query('SELECT b.*, o.fullname AS operario_fullname FROM bloque b LEFT JOIN operario o ON b.id_operario = o.id_operario');

        // Crear un nuevo libro de trabajo de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Bloques');  // Nombre de la hoja

        // Definir las columnas
        worksheet.columns = [
            { header: 'ID', key: 'id_bloque', width: 5 },
            { header: 'Nombre', key: 'nombre', width: 40 },
            { header: 'Codigo de Barras', key: 'codigo_barras', width: 20 },
            { header: 'Lote', key: 'cantidad', width: 10 },
            { header: 'Estado', key: 'estado', width: 10 },
            { header: 'Color', key: 'color', width: 10 },
            { header: 'Tamaño', key: 'tamano', width: 10 },
            { header: 'Tipo de Material', key: 'tipo_material', width: 20 },
            { header: 'Fecha de Creación', key: 'fecha_creacion', width: 25 },
            { header: 'Fecha de Finalización', key: 'fecha_finalizacion', width: 25 },
            { header: 'Operario', key: 'operario_fullname', width: 30 },
        ];

        // Estilo de las celdas del encabezado
        worksheet.getRow(1).font = { bold: true, size: 12 }; // Negrita y tamaño de fuente para el encabezado
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };  // Centrado
        worksheet.getRow(1).fill = { 
            type: 'pattern', 
            pattern: 'solid', 
            fgColor: { argb: 'FF4F81BD' } // Color de fondo del encabezado (azul)
        };

        // Establecer los bordes para las celdas del encabezado
        worksheet.getRow(1).eachCell((cell) => {
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
            };
        });

        // Agregar los datos de la base de datos al archivo Excel
        result.forEach((row, index) => {
            const rowIndex = index + 2; // Las filas de datos empiezan después de la fila 1 (encabezado)

            // Convertir el estado a texto (En uso / Finalizado)
            const estadoTexto = row.estado === 1 ? 'En uso' : (row.estado === 0 ? 'Finalizado' : 'Desconocido');

            worksheet.addRow({
                id_bloque: row.id_bloque,
                nombre: row.nombre,
                codigo_barras: row.codigo_barras,
                cantidad: row.cantidad,
                estado: estadoTexto,  // Mostrar texto amigable en lugar de 1 o 0
                color: row.color,
                tamano: row.tamano,
                tipo_material: row.tipo_material,
                fecha_creacion: row.fecha_creacion ? row.fecha_creacion.toISOString().replace('T', ' /').split('.')[0] : '', // Formato de fecha
                fecha_finalizacion: row.fecha_finalizacion ? row.fecha_finalizacion.toISOString().replace('T', ' /').split('.')[0] : '', // Formato de fecha
                operario_fullname: row.operario_fullname,
            });

            // Estilo para cada celda de la fila de datos
            const currentRow = worksheet.getRow(rowIndex);
            currentRow.alignment = { vertical: 'middle', horizontal: 'center' };  // Centrado
            currentRow.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                };
            });
        });

        // Establecer los encabezados de la respuesta para indicar que es un archivo descargable
        res.setHeader('Content-Disposition', 'attachment; filename=bloques.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Escribir el archivo en la respuesta
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error al generar el archivo Excel:', error);
        res.status(500).send('Error al generar el archivo');
    }
});

router.get('/historial', isLoggedIn, async (req, res) => {
    await pool.query('SELECT * FROM historial_bloques ORDER BY fecha DESC', (err, results) => {
        if (err) throw err;

        // Agrupar los resultados por fecha y separar la hora
        const historialAgrupado = results.reduce((acc, item) => {
            let fechaString = item.fecha;

            // Si item.fecha es un objeto Date, conviértelo a string
            if (fechaString instanceof Date) {
                fechaString = fechaString.toISOString();  // Esto lo convierte a formato 'yyyy-mm-ddTHH:mm:ss.sssZ'
            }

            // Verificar cómo llega la fecha original
            console.log("Fecha original en UTC:", fechaString);

            // Separar fecha y hora
            const fechaKey = new Date(fechaString).toISOString().split('T')[0];  // 'yyyy-mm-dd'
            const horaKey = fechaString.split('T')[1].split('.')[0];  // 'HH:mm:ss' -> 'HH:mm'

            // Si no existe esa fecha en el acumulador, crearla
            if (!acc[fechaKey]) {
                acc[fechaKey] = [];
            }

            // Agregar el item con la hora separada
            acc[fechaKey].push({
                hora: horaKey,
                nombre_operario: item.nombre_operario,
                mensaje: item.mensaje,
                fecha: fechaString // mantén la fecha completa para referencia futura
            });

            return acc;
        }, {});

        // Convertir el objeto de agrupación en un arreglo
        const historial = Object.keys(historialAgrupado).map(fecha => ({
            fecha,
            cambios: historialAgrupado[fecha]
        }));

        console.log(historial); // Verifica cómo se está agrupando

        console.log('Historial agrupado:', JSON.stringify(historial, null, 2));
        
        // Pasar el historial agrupado a la vista
        res.render('bloque/historial', { historial: historial });
    });
});

module.exports = router;
