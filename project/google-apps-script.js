/**
 * Google Apps Script — à coller dans Extensions > Apps Script depuis ton Google Sheet.
 * Reçoit les leads du formulaire /diagnostic et les ajoute en ligne dans la feuille "Leads".
 */
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Leads")
    || SpreadsheetApp.getActiveSpreadsheet().insertSheet("Leads");

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Date", "Prénom", "Email", "Téléphone / WhatsApp",
      "Type d'activité", "Nombre d'employés", "Perte de temps",
      "Niveau de process", "Utilisation IA", "Objectif", "Dernière réponse",
      "Score", "Estimation des heures gagnables",
    ]);
  }

  const data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    data.date || new Date().toISOString(),
    data.prenom || "",
    data.email || "",
    data.telephone || "",
    data.activite || "",
    data.taille || "",
    data.perteTemps || "",
    data.process || "",
    data.usageIA || "",
    data.objectif || "",
    data.souhait || "",
    data.score || "",
    data.heuresGagnables || "",
  ]);

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
