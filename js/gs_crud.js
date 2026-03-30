// Google Apps Script for Bina Jaya Abadi Properti
// Deploy as Web App: Execute as Me, Anyone can access

const SHEET_ID = '1ZdH_YYpcY3xNmPDTcx8TqAh4I1qdKVPMqQJtCYdxKno';
const SHEET_NAME_PROPERTIES = 'Properties';
const SHEET_NAME_LEADS = 'Leads';

function doOptions(e) {
  return ContentService.createTextOutput('OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'properties') {
    return ContentService.createTextOutput(JSON.stringify(getProperties()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  if (action === 'property') {
    const id = e.parameter.id;
    const properties = getProperties();
    const property = properties.find(p => p.idnama_properti === id);
    if (property) {
      return ContentService.createTextOutput(JSON.stringify(property))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Properti tidak ditemukan'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: 'action invalid'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    let payload;
    if (e.postData.type === 'application/json') {
      payload = JSON.parse(e.postData.contents);
    } else {
      payload = e.parameter;
    }

    const action = payload.action;

    // Handle property CRUD operations
    if (action === 'add-property') {
      return ContentService.createTextOutput(JSON.stringify(addProperty(payload)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'update-property') {
      return ContentService.createTextOutput(JSON.stringify(updateProperty(payload)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'delete-property') {
      return ContentService.createTextOutput(JSON.stringify(deleteProperty(payload.idnama_properti)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Handle lead form submission (default action)
    if (!payload.nama_lengkap || !payload.email || !payload.no_whatsapp || !payload.pesan) {
      throw new Error('Semua field wajib diisi.');
    }

    const ws = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME_LEADS);
    if (!ws) throw new Error(`Sheet ${SHEET_NAME_LEADS} tidak ditemukan`);

    ws.appendRow([
      new Date(),
      payload.nama_lengkap,
      payload.email,
      payload.no_whatsapp,
      payload.pesan,
      'Baru'
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Lead tersimpan.'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.message || 'Gagal memproses request'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getProperties() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME_PROPERTIES);
  if (!sheet) throw new Error(`Sheet ${SHEET_NAME_PROPERTIES} tidak ditemukan`);

  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[String(h).trim().toLowerCase().replace(/\s/g, '_')] = row[i];
    });
    return obj;
  });
}

function addProperty(data) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME_PROPERTIES);
  if (!sheet) throw new Error(`Sheet ${SHEET_NAME_PROPERTIES} tidak ditemukan`);

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => {
    const headerKey = String(h).trim().toLowerCase().replace(/\s/g, '_');
    return data[headerKey] || '';
  });

  sheet.appendRow(row);
  return {
    status: 'success',
    message: 'Properti ditambahkan',
    data: data
  };
}

function updateProperty(data) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME_PROPERTIES);
  if (!sheet) throw new Error(`Sheet ${SHEET_NAME_PROPERTIES} tidak ditemukan`);

  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idIndex = headers.findIndex(h => String(h).toLowerCase().replace(/\s/g, '_') === 'idnama_properti');

  if (idIndex === -1) throw new Error('Kolom idnama_properti tidak ditemukan');

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idIndex] === data.idnama_properti) {
      const row = headers.map(h => {
        const headerKey = String(h).trim().toLowerCase().replace(/\s/g, '_');
        return data[headerKey] !== undefined ? data[headerKey] : rows[i][headers.indexOf(h)];
      });
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return {
        status: 'success',
        message: 'Properti diupdate',
        data: data
      };
    }
  }

  throw new Error('Properti tidak ditemukan');
}

function deleteProperty(id) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME_PROPERTIES);
  if (!sheet) throw new Error(`Sheet ${SHEET_NAME_PROPERTIES} tidak ditemukan`);

  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idIndex = headers.findIndex(h => String(h).toLowerCase().replace(/\s/g, '_') === 'idnama_properti');

  if (idIndex === -1) throw new Error('Kolom idnama_properti tidak ditemukan');

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idIndex] === id) {
      sheet.deleteRow(i + 1);
      return {
        status: 'success',
        message: 'Properti dihapus',
        id: id
      };
    }
  }

  throw new Error('Properti tidak ditemukan');
}
