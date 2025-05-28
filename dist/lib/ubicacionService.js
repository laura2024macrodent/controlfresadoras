const pool = require('../database');
const cajonesConfig = require('./cajonesConfig');

const MAX_FILAS = 10;
const MAX_COLUMNAS = 3;

async function obtenerUbicacionDisponible(material, altura) {
    let cajonesAsignados = [];

    if (material === "3D") {
        const cajon = cajonesConfig[material][altura];
        if (!cajon) throw new Error(`No hay cajón asignado para 3d altura ${altura}`);
        cajonesAsignados = cajon;  // Para 3D altura puede haber múltiples cajones
    } else {
        cajonesAsignados = cajonesConfig[material];
        if (!Array.isArray(cajonesAsignados)) cajonesAsignados = [cajonesAsignados];
    }

    // Cambiar el orden de los bucles: primero las columnas y luego las filas
    for (let cajon of cajonesAsignados) {
        console.log(`Revisando cajón ${cajon}`);  // Log para verificar qué cajón se está procesando
        for (let columna = 1; columna <= MAX_COLUMNAS; columna++) {
            for (let fila = 1; fila <= MAX_FILAS; fila++) {
                console.log(`Revisando: Cajón ${cajon}, Fila ${fila}, Columna ${columna}`);  // Log para cada ubicación
                const [resultados] = await pool.query(`
                    SELECT id_ubicacion FROM ubicacion_bloque
                    WHERE cajon = ? AND fila = ? AND columna = ?
                `, [cajon, fila, columna]);

                console.log(`Resultado de la consulta para Cajón ${cajon}, Fila ${fila}, Columna ${columna}:`, resultados);  // Ver resultados de la consulta

                if (!resultados || resultados.length === 0) {
                    console.log(`Ubicación libre encontrada: Cajón ${cajon}, Fila ${fila}, Columna ${columna}`);
                    return { cajon, fila, columna };  // Ubicación encontrada, devolverla
                }
            }
        }
    }

    throw new Error("No hay ubicaciones disponibles para este material y altura");
}

module.exports = { obtenerUbicacionDisponible };