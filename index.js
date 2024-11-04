const pup = require('puppeteer');
const nodemailer = require('nodemailer')
const dotenv = require('dotenv')

dotenv.config()

const url = 'https://www.mercadolivre.com.br/';
const searchFor = 'chaleira';
let count = 1;
let collectedData = [];

async function sendEmail(content) {
    var transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "a7e5189fc55287",
          pass: "4cd4a7dbf2e644"
        }
      });

    const mailOptions = {
        from: process.env.EMAIL,
        to: 'arthurgdasilva77@gmail.com',
        subject: 'Dados coletados do web scraping',
        html: content
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('E-mail enviado com sucesso!');
    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
    }
}

(async () => {
    const browser = await pup.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(url);

    await page.waitForSelector('#cb1-edit');
    await page.type('#cb1-edit', searchFor);

    await Promise.all([
        page.waitForNavigation(),
        page.click('.nav-search-btn')
    ]);

    const links = await page.$$eval('.ui-search-item__group__element > .ui-search-link', item => item.map(link => link.href)).then(res => res.slice(0, 10))
    console.log(links)

    for(const link of links){
        console.log(`página: ${count}`)
        await page.goto(link);
        await page.waitForSelector('.ui-pdp-title');

        const title = await page.$eval('.ui-pdp-title', element => element.innerText);
        const price = await page.$eval('.andes-money-amount', element => element.innerHTML);

        const obj = {title, price};
        collectedData.push(obj)
        count++
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    await browser.close();

    const emailContent = collectedData.map(item => `<p><strong>Título:</strong> ${item.title}<br><strong>Preço:</strong> ${item.price}</p>`).join('');

    await sendEmail(emailContent);
    
})();