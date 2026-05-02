const whatsappService = require('./utils/whatsappService');
(async () => {
    try {
        console.log('Testing WA Init for Shop 1...');
        await whatsappService.init(1);
        console.log('Init command sent. Checking status in 5s...');
        setTimeout(() => {
            const status = whatsappService.getStatus(1);
            console.log('Status after 5s:', JSON.stringify(status, null, 2));
            process.exit(0);
        }, 10000);
    } catch (e) {
        console.error('CRITICAL INIT ERROR:', e);
        process.exit(1);
    }
})();
