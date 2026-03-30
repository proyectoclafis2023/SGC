
export const formatRUT = (rut: string) => {
    // Remove all non-alphanumeric characters and convert to uppercase
    const cleanRUT = rut.replace(/[^0-9kK]/g, '').toUpperCase();

    if (cleanRUT.length <= 1) return cleanRUT;

    // Split the verifier digit
    const body = cleanRUT.slice(0, -1);
    const dv = cleanRUT.slice(-1);

    // Format the body with dots
    let formattedBody = '';
    for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
        if (j > 0 && j % 3 === 0) {
            formattedBody = '.' + formattedBody;
        }
        formattedBody = body.charAt(i) + formattedBody;
    }

    return `${formattedBody}-${dv}`;
};

export const cleanRUT = (rut: string) => {
    return rut.replace(/[^0-9kK]/g, '').toUpperCase();
};
