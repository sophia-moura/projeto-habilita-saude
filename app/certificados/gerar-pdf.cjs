const { chromium } = require("playwright");
const path = require("node:path");
const fs = require("node:fs/promises");
const { pathToFileURL } = require("node:url");

const TEMPLATE_PATH = path.join(
    __dirname,
    "templates",
    "index.html"
);

async function generate(dados, destino) {
    if (!dados || typeof dados !== "object") {
        throw new Error("Dados do certificado inválidos.");
    }

    if (!destino) {
        throw new Error("Informe o destino do PDF.");
    }

    const destinoAbsoluto = path.resolve(destino);

    await fs.mkdir(path.dirname(destinoAbsoluto), {
        recursive: true
    });

    let browser;

    try {
        browser = await chromium.launch({
            headless: true
        });

        const page = await browser.newPage({
            viewport: {
                width: 1536,
                height: 864
            },
            deviceScaleFactor: 1
        });

        await page.goto(
            pathToFileURL(TEMPLATE_PATH).href + "?headless&embedded",
            {
                waitUntil: "load"
            }
        );

        await page.evaluate(() => {
            window.__CERT_BACKEND_RENDER = true;
        });

        const resultado = await page.evaluate(async (dadosCertificado) => {
            if (!window.HabilitaCertificados) {
                throw new Error("Renderizador de certificados não encontrado.");
            }

            return await window.HabilitaCertificados.render(
                dadosCertificado
            );
        }, dados);

        if (!resultado || !resultado.ok || resultado.pages !== 2) {
            throw new Error("Falha ao renderizar o certificado.");
        }

        await page.waitForFunction(
            () => window.__CERT_READY === true,
            { timeout: 15000 }
        );

        const quantidadePaginas = await page.locator(
            "#pages > .sheet"
        ).count();

        if (quantidadePaginas !== 2) {
            throw new Error(
                "O certificado precisa conter exatamente duas páginas."
            );
        }

        await page.pdf({
            path: destinoAbsoluto,
            printBackground: true,
            preferCSSPageSize: true,
            displayHeaderFooter: false,
            margin: {
                top: "0",
                bottom: "0",
                left: "0",
                right: "0"
            }
        });

        return {
            sucesso: true,
            caminho: destinoAbsoluto,
            paginas: quantidadePaginas,
            versaoTemplate: resultado.templateVersion
        };

    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = {
    generate
};