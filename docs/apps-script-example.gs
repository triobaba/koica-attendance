const SECRET = 'replace-with-the-same-secret'
const GRID_SHEET = 'Attendance'
const LOG_SHEET = 'Check-in log'
const PIN_SHEET = 'Programme pins'
const HEADER_ROWS = 3
const FIXED_COLS = 3
const LOG_HEADERS = ['Checked in at', 'Date', 'Day', 'Programme', 'Time', 'Program ID', 'Full Name', 'Country', 'Latitude', 'Longitude', 'Accuracy m', 'Maps', 'Location status']
const PIN_HEADERS = ['Programme code', 'Programme', 'PIN', 'Updated at']
const COUNTRY_SHEETS = ['Ghana', 'Cameroon', 'Côte d’Ivoire', 'Nigeria', 'Senegal']

const PROGRAMMES = [
  { code: "koica-2026-001", date: "2026-08-17", dayLabel: "Mon 17 Aug", time: "09:00\u201310:30", title: "Orientation, program briefing & team formation" },
  { code: "koica-2026-002", date: "2026-08-17", dayLabel: "Mon 17 Aug", time: "10:30\u201312:00", title: "Opening ceremony" },
  { code: "koica-2026-004", date: "2026-08-17", dayLabel: "Mon 17 Aug", time: "14:00\u201317:00", title: "Country report" },
  { code: "koica-2026-006", date: "2026-08-17", dayLabel: "Mon 17 Aug", time: "19:00\u201321:00", title: "Self-introduction & networking" },
  { code: "koica-2026-007", date: "2026-08-18", dayLabel: "Tue 18 Aug", time: "09:00\u201312:00", title: "Light IoT and LED / intelligent signage applications" },
  { code: "koica-2026-009", date: "2026-08-18", dayLabel: "Tue 18 Aug", time: "14:00\u201317:00", title: "Applications and utilization of AI-ICT solutions" },
  { code: "koica-2026-011", date: "2026-08-19", dayLabel: "Wed 19 Aug", time: "09:00\u201312:00", title: "Identifying business opportunities and customer development" },
  { code: "koica-2026-013", date: "2026-08-19", dayLabel: "Wed 19 Aug", time: "14:00\u201317:00", title: "Advanced customer development" },
  { code: "koica-2026-015", date: "2026-08-20", dayLabel: "Thu 20 Aug", time: "09:00\u201312:00", title: "Market size analysis and competitive analysis" },
  { code: "koica-2026-017", date: "2026-08-20", dayLabel: "Thu 20 Aug", time: "14:00\u201317:00", title: "Entrepreneurship cases for solving social problems" },
  { code: "koica-2026-019", date: "2026-08-21", dayLabel: "Fri 21 Aug", time: "09:00\u201312:00", title: "Pitching and AP writing" },
  { code: "koica-2026-021", date: "2026-08-21", dayLabel: "Fri 21 Aug", time: "14:00\u201317:00", title: "Private-sector AP enhancement" },
  { code: "koica-2026-023", date: "2026-08-22", dayLabel: "Sat 22 Aug", time: "09:00\u201312:00", title: "Site visit: GI-KACE" },
  { code: "koica-2026-025", date: "2026-08-22", dayLabel: "Sat 22 Aug", time: "14:00\u201317:00", title: "Cultural experience: KAMP & Osu Castle" },
  { code: "koica-2026-028", date: "2026-08-24", dayLabel: "Mon 24 Aug", time: "09:00\u201312:00", title: "Hands-on: generative AI startup tools" },
  { code: "koica-2026-030", date: "2026-08-24", dayLabel: "Mon 24 Aug", time: "14:00\u201317:00", title: "Perception AI startup case analysis" },
  { code: "koica-2026-032", date: "2026-08-24", dayLabel: "Mon 24 Aug", time: "20:00\u201322:00", title: "AP preparation \u2014 small group 1" },
  { code: "koica-2026-033", date: "2026-08-25", dayLabel: "Tue 25 Aug", time: "09:00\u201312:00", title: "Hands-on MVP development using no-code platforms" },
  { code: "koica-2026-035", date: "2026-08-25", dayLabel: "Tue 25 Aug", time: "14:00\u201317:00", title: "Problem tree & stakeholder map" },
  { code: "koica-2026-037", date: "2026-08-25", dayLabel: "Tue 25 Aug", time: "20:00\u201322:00", title: "AP preparation \u2014 small group 2" },
  { code: "koica-2026-038", date: "2026-08-26", dayLabel: "Wed 26 Aug", time: "09:00\u201312:00", title: "Site visit: NYA" },
  { code: "koica-2026-040", date: "2026-08-26", dayLabel: "Wed 26 Aug", time: "14:00\u201317:00", title: "Basics of problem solving and KPIs" },
  { code: "koica-2026-042", date: "2026-08-26", dayLabel: "Wed 26 Aug", time: "20:00\u201322:00", title: "AP preparation \u2014 small group 3" },
  { code: "koica-2026-043", date: "2026-08-27", dayLabel: "Thu 27 Aug", time: "09:00\u201312:00", title: "Startup project design" },
  { code: "koica-2026-045", date: "2026-08-27", dayLabel: "Thu 27 Aug", time: "14:00\u201317:00", title: "Special lecture by YALI alumni" },
  { code: "koica-2026-047", date: "2026-08-27", dayLabel: "Thu 27 Aug", time: "20:00\u201322:00", title: "AP preparation \u2014 small group 4" },
  { code: "koica-2026-048", date: "2026-08-28", dayLabel: "Fri 28 Aug", time: "09:00\u201312:00", title: "Final submission \u2014 demo day materials" },
  { code: "koica-2026-050", date: "2026-08-28", dayLabel: "Fri 28 Aug", time: "14:00\u201317:00", title: "Demo day pitching" },
  { code: "koica-2026-051", date: "2026-08-28", dayLabel: "Fri 28 Aug", time: "17:00\u201318:00", title: "Completion ceremony" },
  { code: "koica-2026-052", date: "2026-08-28", dayLabel: "Fri 28 Aug", time: "18:00\u201320:00", title: "Farewell reception" }
]

function doGet(e) {
  try {
    const raw = e?.parameter?.payload
    if (!raw) {
      return jsonResponse({ ok: false, error: 'missing_payload' })
    }
    return handleRequest(JSON.parse(raw))
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) })
  }
}

function doPost(e) {
  try {
    return handleRequest(JSON.parse(e.postData.contents))
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) })
  }
}

function handleRequest(body) {
  if (body.sharedSecret !== SECRET) {
    return jsonResponse({ ok: false, error: 'unauthorized' })
  }
  const action = body.action || 'mark'
  if (action === 'verifyPin') return verifyPin(body)
  if (action === 'setPin') return setPin(body)
  if (action === 'listPins') return listPins()
  return handleAttendance(body)
}

function handleAttendance(body) {
  const required = ['programId', 'fullName', 'country', 'attendanceDate', 'sessionCode', 'sessionLabel', 'checkedInAt']
  for (var i = 0; i < required.length; i++) {
    if (!body[required[i]]) {
      return jsonResponse({ ok: false, error: 'missing_' + required[i] })
    }
  }
  body.country = canonicalCountry(body.country)

  const lock = LockService.getScriptLock()
  if (!lock.tryLock(15000)) {
    return jsonResponse({ ok: false, error: 'busy_retry' })
  }
  try {
    migrateLegacySheet()
    const programme = findProgramme(body.sessionCode) || {
      code: body.sessionCode,
      date: body.attendanceDate,
      dayLabel: body.attendanceDate,
      time: body.programmeWindow || '',
      title: body.sessionLabel,
    }

    const duplicate = markGridPresent(body, programme)
    if (!duplicate) {
      appendLogRow(body, programme)
    }
    return jsonResponse({ ok: true, duplicate: duplicate })
  } finally {
    lock.releaseLock()
  }
}

function findProgramme(code) {
  for (var i = 0; i < PROGRAMMES.length; i++) {
    if (PROGRAMMES[i].code === code) return PROGRAMMES[i]
  }
  return null
}

function migrateLegacySheet() {
  const ss = SpreadsheetApp.getActive()
  const old = ss.getSheetByName('attendance')
  if (!old) return
  const first = String(old.getRange(1, 1).getValue())
  if (first === 'composite_key') {
    old.setName('attendance_old')
  }
}

function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.getActive()
  return ss.getSheetByName(name) || ss.insertSheet(name)
}

function canonicalCountry(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''

  const withoutAccents = raw.normalize
    ? raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    : raw
  const key = withoutAccents.toLowerCase().replace(/[’']/g, '').replace(/[^a-z]/g, '')

  if (key === 'ghana' || key === 'ghanaian') return 'Ghana'
  if (key === 'cameroon' || key === 'cameroonian') return 'Cameroon'
  if (
    key === 'cotedivoire' ||
    key === 'cotedivoir' ||
    key === 'ivorycoast' ||
    key === 'ivorian'
  ) {
    return 'Côte d’Ivoire'
  }
  if (key === 'nigeria' || key === 'nigerian') return 'Nigeria'
  if (key === 'senegal' || key === 'senegalese') return 'Senegal'
  return raw
}

function ensureSheetSize(sheet, rows, columns) {
  if (sheet.getMaxRows() < rows) {
    sheet.insertRowsAfter(sheet.getMaxRows(), rows - sheet.getMaxRows())
  }
  if (sheet.getMaxColumns() < columns) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), columns - sheet.getMaxColumns())
  }
}

function ensureGridHeaders(sheet) {
  const lastCol = FIXED_COLS + PROGRAMMES.length
  ensureSheetSize(sheet, HEADER_ROWS + 1, lastCol)
  const existing = sheet.getRange(3, FIXED_COLS + 1, 1, PROGRAMMES.length).getValues()[0]
  const expected = PROGRAMMES.map(function (item) { return item.code })
  if (existing.join('|') === expected.join('|') && sheet.getRange(1, 1).getValue() === '') {
    return
  }

  sheet.clear()
  const dayRow = ['', '', '']
  const titleRow = ['Program ID', 'Full Name', 'Country']
  const codeRow = ['', '', '']
  for (var i = 0; i < PROGRAMMES.length; i++) {
    dayRow.push(PROGRAMMES[i].dayLabel)
    titleRow.push(PROGRAMMES[i].time + '\n' + PROGRAMMES[i].title)
    codeRow.push(PROGRAMMES[i].code)
  }

  sheet.getRange(1, 1, 1, lastCol).setValues([dayRow])
  sheet.getRange(2, 1, 1, lastCol).setValues([titleRow])
  sheet.getRange(3, 1, 1, lastCol).setValues([codeRow])

  var start = FIXED_COLS + 1
  while (start <= lastCol) {
    var label = dayRow[start - 1]
    var end = start
    while (end < lastCol && dayRow[end] === label) {
      end += 1
    }
    if (end > start) {
      sheet.getRange(1, start, 1, end - start + 1).merge()
    }
    start = end + 1
  }

  const header = sheet.getRange(1, 1, HEADER_ROWS, lastCol)
  header.setFontWeight('bold')
  header.setWrap(true)
  header.setVerticalAlignment('middle')
  header.setHorizontalAlignment('center')
  sheet.getRange(1, 1, 1, lastCol).setBackground('#0f766e').setFontColor('#ffffff')
  sheet.getRange(2, 1, 1, lastCol).setBackground('#ccfbf1')
  sheet.setRowHeight(2, 72)
  sheet.setFrozenRows(HEADER_ROWS)
  sheet.setFrozenColumns(FIXED_COLS)
  sheet.hideRows(3)
  sheet.setColumnWidth(1, 120)
  sheet.setColumnWidth(2, 180)
  sheet.setColumnWidth(3, 120)
  for (var col = FIXED_COLS + 1; col <= lastCol; col++) {
    sheet.setColumnWidth(col, 140)
  }
}

function columnLetter(column) {
  var result = ''
  var current = column
  while (current > 0) {
    const remainder = (current - 1) % 26
    result = String.fromCharCode(65 + remainder) + result
    current = Math.floor((current - 1) / 26)
  }
  return result
}

function normalizeExistingCountries(sheet) {
  const lastRow = sheet.getLastRow()
  if (lastRow <= HEADER_ROWS) return

  const range = sheet.getRange(HEADER_ROWS + 1, 3, lastRow - HEADER_ROWS, 1)
  const values = range.getValues()
  var changed = false
  for (var i = 0; i < values.length; i++) {
    const canonical = canonicalCountry(values[i][0])
    if (canonical !== values[i][0]) {
      values[i][0] = canonical
      changed = true
    }
  }
  if (changed) range.setValues(values)
}

function countryFilterFormula(country, lastCol, lastMasterRow) {
  const masterName = GRID_SHEET.replace(/'/g, "''")
  const escapedCountry = country.replace(/"/g, '""')
  const lastColumn = columnLetter(lastCol)
  return (
    "=IFERROR(FILTER('" +
    masterName +
    "'!A4:" +
    lastColumn +
    lastMasterRow +
    ",'" +
    masterName +
    "'!C4:C" +
    lastMasterRow +
    '="' +
    escapedCountry +
    '"),"")'
  )
}

function configureCountrySheet(sheet, master, country) {
  const lastCol = FIXED_COLS + PROGRAMMES.length
  const lastMasterRow = Math.max(master.getMaxRows(), HEADER_ROWS + 1)
  ensureSheetSize(sheet, lastMasterRow, lastCol)
  ensureGridHeaders(sheet)

  const dataRows = sheet.getMaxRows() - HEADER_ROWS
  sheet.getRange(HEADER_ROWS + 1, 1, dataRows, sheet.getMaxColumns()).clearContent()

  sheet
    .getRange(HEADER_ROWS + 1, 1)
    .setFormula(countryFilterFormula(country, lastCol, lastMasterRow))

  const presentRange = sheet.getRange(
    HEADER_ROWS + 1,
    FIXED_COLS + 1,
    dataRows,
    lastCol - FIXED_COLS,
  )
  const presentRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Present')
    .setBackground('#d1fae5')
    .setRanges([presentRange])
    .build()
  sheet.setConditionalFormatRules([presentRule])
}

// Run this once after deploying the script. The five tabs remain live views of
// Attendance, so future check-ins appear automatically without extra writes.
function setupCountrySheets() {
  const master = getOrCreateSheet(GRID_SHEET)
  ensureGridHeaders(master)
  normalizeExistingCountries(master)

  for (var i = 0; i < COUNTRY_SHEETS.length; i++) {
    const country = COUNTRY_SHEETS[i]
    configureCountrySheet(getOrCreateSheet(country), master, country)
  }
  SpreadsheetApp.flush()
}

function markGridPresent(body, programme) {
  const sheet = getOrCreateSheet(GRID_SHEET)
  ensureGridHeaders(sheet)
  const lastCol = FIXED_COLS + PROGRAMMES.length
  var col = 0
  for (var i = 0; i < PROGRAMMES.length; i++) {
    if (PROGRAMMES[i].code === programme.code) {
      col = FIXED_COLS + 1 + i
      break
    }
  }
  if (!col) {
    col = lastCol
  }

  const lastRow = Math.max(sheet.getLastRow(), HEADER_ROWS)
  var row = 0
  if (lastRow > HEADER_ROWS) {
    const ids = sheet.getRange(HEADER_ROWS + 1, 1, lastRow - HEADER_ROWS, 1).getValues()
    for (var r = 0; r < ids.length; r++) {
      if (ids[r][0] === body.programId) {
        row = HEADER_ROWS + 1 + r
        break
      }
    }
  }

  if (!row) {
    row = lastRow + 1
    if (row <= HEADER_ROWS) row = HEADER_ROWS + 1
    sheet.getRange(row, 1, 1, FIXED_COLS).setValues([[body.programId, body.fullName, body.country]])
  } else {
    sheet.getRange(row, 2, 1, 2).setValues([[body.fullName, body.country]])
  }

  const cell = sheet.getRange(row, col)
  if (String(cell.getValue()) === 'Present') {
    return true
  }
  cell.setValue('Present')
  cell.setBackground('#d1fae5')
  cell.setHorizontalAlignment('center')
  return false
}

function ensureLogHeaders(sheet) {
  const needed = LOG_HEADERS.length
  if (sheet.getLastRow() > 0 && sheet.getRange(1, 1).getValue() === 'Checked in at') {
    sheet.getRange(1, 1, 1, needed).setValues([LOG_HEADERS])
  } else {
    if (sheet.getLastRow() > 0) sheet.clear()
    sheet.appendRow(LOG_HEADERS)
  }
  const header = sheet.getRange(1, 1, 1, needed)
  header.setFontWeight('bold')
  header.setBackground('#0f766e')
  header.setFontColor('#ffffff')
  sheet.setFrozenRows(1)
  sheet.setColumnWidth(4, 280)
  sheet.setColumnWidth(12, 220)
}

function appendLogRow(body, programme) {
  const sheet = getOrCreateSheet(LOG_SHEET)
  ensureLogHeaders(sheet)
  sheet.appendRow([
    body.checkedInAt,
    programme.date || body.attendanceDate,
    programme.dayLabel || '',
    programme.title || body.sessionLabel,
    programme.time || body.programmeWindow || '',
    body.programId,
    body.fullName,
    body.country,
    body.latitude === undefined || body.latitude === null ? '' : body.latitude,
    body.longitude === undefined || body.longitude === null ? '' : body.longitude,
    body.accuracyMeters === undefined || body.accuracyMeters === null ? '' : body.accuracyMeters,
    body.mapsUrl || '',
    body.locationStatus || '',
  ])
}

function ensurePinSheet() {
  const sheet = getOrCreateSheet(PIN_SHEET)
  if (sheet.getLastRow() === 0 || sheet.getRange(1, 1).getValue() !== 'Programme code') {
    if (sheet.getLastRow() > 0) sheet.clear()
    sheet.appendRow(PIN_HEADERS)
    const header = sheet.getRange(1, 1, 1, PIN_HEADERS.length)
    header.setFontWeight('bold')
    header.setBackground('#0f766e')
    header.setFontColor('#ffffff')
    sheet.setFrozenRows(1)
    sheet.setColumnWidth(2, 280)
  }
  return sheet
}

function pinRows() {
  const sheet = ensurePinSheet()
  const lastRow = sheet.getLastRow()
  if (lastRow < 2) return []
  const values = sheet.getRange(2, 1, lastRow - 1, PIN_HEADERS.length).getValues()
  const rows = []
  for (var i = 0; i < values.length; i++) {
    if (!values[i][0]) continue
    rows.push({
      sessionCode: String(values[i][0]),
      title: String(values[i][1] || ''),
      pin: String(values[i][2] || ''),
      updatedAt: String(values[i][3] || ''),
    })
  }
  return rows
}

function findStoredPin(sessionCode) {
  const rows = pinRows()
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].sessionCode === sessionCode) return rows[i].pin
  }
  return ''
}

function verifyPin(body) {
  const pin = String(body.pin || '')
  const sessionCode = String(body.sessionCode || '')
  const defaultPin = String(body.defaultPin || '')
  const stored = findStoredPin(sessionCode) || findStoredPin('*') || defaultPin
  if (!stored || pin !== stored) {
    return jsonResponse({ ok: false, error: 'invalid_pin' })
  }
  return jsonResponse({ ok: true })
}

function setPin(body) {
  const sessionCode = String(body.sessionCode || '').trim()
  const pin = String(body.pin || '').trim()
  const title = String(body.title || '')
  if (!sessionCode || !pin) {
    return jsonResponse({ ok: false, error: 'missing_pin' })
  }
  const lock = LockService.getScriptLock()
  if (!lock.tryLock(15000)) {
    return jsonResponse({ ok: false, error: 'busy_retry' })
  }
  try {
    const sheet = ensurePinSheet()
    const lastRow = Math.max(sheet.getLastRow(), 1)
    var row = 0
    if (lastRow > 1) {
      const codes = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
      for (var i = 0; i < codes.length; i++) {
        if (String(codes[i][0]) === sessionCode) {
          row = i + 2
          break
        }
      }
    }
    const updatedAt = new Date().toISOString()
    if (!row) {
      sheet.appendRow([sessionCode, title, pin, updatedAt])
    } else {
      sheet.getRange(row, 1, 1, PIN_HEADERS.length).setValues([[sessionCode, title, pin, updatedAt]])
    }
    return jsonResponse({ ok: true, pins: pinRows() })
  } finally {
    lock.releaseLock()
  }
}

function listPins() {
  return jsonResponse({ ok: true, pins: pinRows() })
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
