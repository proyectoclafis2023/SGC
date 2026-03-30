/**
 * Utility to generate and download CSV templates from browser memory
 */

const TEMPLATES = {
    personal: `names;lastNames;dni;isHonorary;baseSalary;vacationDays;address;phone;email;position;status
Jorge;Valdivia;12.345.678-9;false;850000;15;Calle Falsa 123;+56912345678;jorge@example.com;Conserje;active
Esteban;Pavez;18.765.432-1;true;1200000;0;Avenida Siempre Viva 742;+56987654321;esteban@example.com;Administrador;active`,

    residentes: `names;lastNames;dni;phone;email;familyCount;hasPets;status
Alexis;Sanchez;15.555.555-5;+56911111111;as7@example.com;1;false;active
Arturo;Vidal;16.666.666-6;+56922222222;king@example.com;2;true;active`,

    propietarios: `names;lastNames;dni;phone;email;status
Marcelo;Salas;11.111.111-1;+56988888888;matador@example.com;active
Ivan;Zamorano;10.101.101-1;+56977777777;bam@example.com;active`,

    inventario: `name;description;category;stock;minStock;isActive
Zapatos de Seguridad;Calzado reforzado con punta de acero;EPP;50;10;true
Cloro Concentrado 1L;Desinfectante de superficies;Aseo;100;20;true
Resma Papel A4;75 grs, 500 hojas;Oficina;100;20;true`,

    infraestructura: `towerName;deptNumber;propertyRole;m2;waterClient;electricityClient;gasClient
Torre A;101;123-1;55;W-001;E-001;G-001
Torre A;102;123-2;70;W-002;E-002;G-002
Torre B;201;456-1;60;W-003;E-003;G-003`
};

export const downloadTemplate = (templateName: keyof typeof TEMPLATES) => {
    const content = TEMPLATES[templateName];
    // Add BOM for Excel compatibility in UTF-8
    const csvContent = '\uFEFF' + content;
    const blob = new Blob([csvContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `plantilla_${templateName}.csv`;

    // Required for Firefox
    document.body.appendChild(link);
    link.click();

    // Clean up
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
};
