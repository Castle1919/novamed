import dayjs from 'dayjs';

const pdfMake = require('pdfmake/build/pdfmake.js');
const pdfFonts = require('pdfmake/build/vfs_fonts.js');

if (pdfMake.vfs) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
}

const generatePdf = (data) => {
    const { appointment, form, prescriptions, doctorName } = data;

    const patientName = `${appointment.patient_details?.last_name || ''} ${appointment.patient_details?.first_name?.[0] || ''}.`;

    const prescriptionRows = prescriptions.map((p, i) => {
        return [
            { text: `${i + 1}. ${p.medicine?.name || '-'}`, style: 'medicineHeader' },
            {
                stack: [
                    { text: `Дозировка: ${p.dosage || '-'}` },
                    { text: `Частота приема: ${p.frequency || '-'}` },
                    { text: `Длительность: ${p.duration || '-'}` },
                    p.instructions ? { text: `Указания: ${p.instructions}`, italics: true } : '',
                ],
                margin: [0, 5, 0, 10]
            }
        ];
    }).flat();

    // Конвертируем лого в base64
    const getBase64ImageFromURL = (url) => {
        return new Promise((resolve, reject) => {
            var img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                var canvas = document.createElement('CANVAS');
                var ctx = canvas.getContext('2d');
                canvas.height = img.height;
                canvas.width = img.width;
                ctx.drawImage(img, 0, 0);
                var dataURL = canvas.toDataURL('image/png');
                resolve(dataURL);
            };
            img.onerror = reject;
            img.src = url;
        });
    };

    // Используем async IIFE для получения base64 логотипа
    (async () => {
        const logoBase64 = await getBase64ImageFromURL('/logo.png');

        const docDefinition = {
            content: [
                // Шапка с логотипом
                {
                    columns: [
                        {
                            image: logoBase64,
                            width: 40
                        },
                        {
                            text: 'NovaMed',
                            style: 'clinicName',
                            margin: [10, 5, 0, 0]
                        }
                    ]
                },
                { text: 'РЕЦЕПТ', style: 'header', alignment: 'center' },
                {
                    columns: [
                        { width: '*', text: `Пациент: ${patientName}`, style: 'subheader' },
                        { width: 'auto', text: `Дата: ${dayjs().format('DD.MM.YYYY HH:mm')}`, alignment: 'right' }
                    ]
                },
                { text: `Врач: ${doctorName}`, style: 'subheader', margin: [0, 5, 0, 20] },
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }], margin: [0, 0, 0, 15] },
                { text: 'НАЗНАЧЕНИЯ:', style: 'sectionHeader', margin: [0, 0, 0, 10] },
                ...prescriptionRows,
                { text: ' ', margin: [0, 10] },
                form.recommendations ? {
                    stack: [
                        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }], margin: [0, 0, 0, 10] },
                        { text: 'РЕКОМЕНДАЦИИ:', style: 'sectionHeader', margin: [0, 0, 0, 5] },
                        { text: form.recommendations }
                    ]
                } : {},

                // Блок с подписью и печатью
                {
                    columns: [
                        {
                            stack: [
                                { text: 'Подпись врача: _______________', style: 'signature' },
                                { text: doctorName, style: 'signatureName' }
                            ]
                        },
                        {
                            stack: [
                                { text: 'М.П.', style: 'signature' },
                                { text: '(место для печати)', style: 'signatureName' }
                            ],
                            alignment: 'right'
                        }
                    ],
                    margin: [0, 40, 0, 0]
                }
            ],
            styles: {
                clinicName: { fontSize: 24, bold: true, color: '#1976d2' },
                header: { fontSize: 22, bold: true, margin: [0, 20, 0, 10] },
                subheader: { fontSize: 12, bold: false },
                sectionHeader: { fontSize: 14, bold: true, color: '#1976d2' },
                medicineHeader: { fontSize: 13, bold: true, margin: [0, 5, 0, 0] },
                signature: { fontSize: 12, bold: false },
                signatureName: { fontSize: 10, italics: true, color: 'grey' }
            },
            defaultStyle: {
                font: 'Roboto',
                fontSize: 11
            }
        };

        const fileName = `Рецепт_${patientName.replace(/\s+/g, '_')}.pdf`;
        pdfMake.createPdf(docDefinition).download(fileName);
    })();
};

export default generatePdf;