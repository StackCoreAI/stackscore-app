await page.goto(`${baseUrl}/pdf/view?planId=${planId}`, {
    waitUntil: 'networkidle0'
  });
  await page.emulateMediaType('screen');
  await page.evaluateHandle('document.fonts.ready');
  await page.waitForTimeout(process.env.PDF_SETTLE_MS || 100);
  const pdfBuffer = await page.pdf({ printBackground: true });
  res.setHeader('Content-Type', 'application/pdf');
  return res.end(pdfBuffer);
  