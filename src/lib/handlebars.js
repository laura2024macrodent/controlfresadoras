const helpers = {};

helpers.formatFecha = (fecha) => {
    // Convertir la fecha de string ISO a objeto Date
    const date = new Date(fecha);

    // Ajustar manualmente la hora para la zona horaria de Colombia (GMT-5)
    const colombiaOffset = 5;  // GMT-5 para Colombia
    const localDate = new Date(date.getTime() + colombiaOffset * 60 * 60 * 1000);

    // Devolver la fecha en el formato deseado
    return localDate.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });  // Ejemplo: 13 de noviembre de 2024
};

helpers.formatHora = (fecha) => {
    const date = new Date(fecha);

    const localDate = new Date(date.getTime());

    return localDate.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
};

helpers.eq = (a, b) => a === b;

module.exports = helpers;