const helpers = {};

helpers.formatFecha = (fecha) => {
    // Convertir la fecha de string ISO a objeto Date
    const date = new Date(fecha);
    
    const localDate = new Date(date.getTime());

    // Devolver la fecha en el formato deseado
    return localDate.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Bogota',
    });  // Ejemplo: 13 de noviembre de 2024
};

helpers.formatHora = (fecha) => {
    const date = new Date(fecha);

    const localDate = new Date(date.getTime());

    return localDate.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'America/Bogota',
    });
};

helpers.eq = (a, b) => a === b;

module.exports = helpers;