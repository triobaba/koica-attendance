# KYLP Attendance MVP (Google Sheets)

Browser self check-in for KOICA Youth Leaders Program:

- scan pass card with camera (Claude vision)
- extract and confirm `programId`, `fullName`, `country` (scan only — no typed fields except the PIN)
- mark Present for the **current programme** from the [KOICA Ghana itinerary](https://serene-sawine-f5fe79.netlify.app/) (one Present per person per programme; meals are skipped)
- queue writes offline and auto-sync when network returns

## Stack

- Frontend: React + TypeScript + Vite
- OCR endpoint: `api/read-pass.ts` (Claude)
- Sheet write endpoint: `api/mark-attendance.ts` (proxy to Apps Script)

## Setup

1. Install:

```bash
npm install
```

2. Copy env:

```bash
cp .env.example .env
```

3. Set `.env` values:
   - `VITE_PROGRAM_PIN`
   - `ANTHROPIC_API_KEY`
   - `GOOGLE_APPS_SCRIPT_URL`
   - `GOOGLE_APPS_SCRIPT_SHARED_SECRET`

4. Run:

```bash
npm run dev
```

`npm run dev` serves the UI and the local `/api/read-pass` and `/api/mark-attendance` endpoints.

## Google Sheet setup

You do **not** need to pre-fill columns. The Apps Script creates an `attendance` tab and writes the header on first check-in.

### 1. Create the spreadsheet

1. Open [Google Sheets](https://sheets.google.com) and create a blank spreadsheet.
2. Name it something like `KYLP Attendance`.
3. You can leave Sheet1 as-is. The script will add a tab named `attendance`.

### 2. Attach Apps Script

1. In the spreadsheet: **Extensions → Apps Script**.
2. Delete any starter code.
3. Paste the contents of `docs/apps-script-example.gs`.
4. Change this line to a random secret (same value you put in `.env`):

```js
const SECRET = 'replace-with-the-same-secret'
```

5. Click **Save** (disk icon). Name the project if prompted.

### 3. Deploy as a Web App

1. Click **Deploy → New deployment**.
2. Click the gear next to **Select type** and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone (sometimes shown as **Anyone, even anonymous**)
     Do **not** choose "Anyone with a Google account" — that shows a login page and check-ins will fail.
4. Click **Deploy**.
5. Authorize the script when Google asks (your Google account).
6. Copy the **Web app URL**. It looks like:

```text
https://script.google.com/macros/s/AKfycb.../exec
```

7. Put that URL in `.env` as `GOOGLE_APPS_SCRIPT_URL`.
8. Put the same secret as `GOOGLE_APPS_SCRIPT_SHARED_SECRET`.

"Anyone" is required so phones at the venue can check in without a Google login. The shared secret is what keeps random internet posts out.

If you change the script later: **Deploy → Manage deployments → Edit (pencil) → New version → Deploy**.

### Country attendance tabs

After deploying the latest script, select `setupCountrySheets` in the Apps Script
function menu and click **Run** once. It creates live attendance views for Ghana,
Cameroon, Côte d’Ivoire, Nigeria, and Senegal. Existing country spellings are
normalized and future check-ins update the country tabs automatically from the
master `Attendance` sheet.

### 4. What the spreadsheet looks like

After you paste the updated `docs/apps-script-example.gs` and deploy a **new version**, the first check-in creates two tabs:

**Attendance** — one row per person, programmes as columns grouped by day (from the [KOICA itinerary](https://serene-sawine-f5fe79.netlify.app/)):

| Program ID | Full Name | Country | Mon 17 Aug | | | | Tue 18 Aug | |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| | | | 09:00–10:30 Orientation... | 10:30–12:00 Opening ceremony | 14:00–17:00 Country report | 19:00–21:00 Networking | 09:00–12:00 Light IoT... | 14:00–17:00 AI-ICT... |
| KYLP088 | Ama Mensah | Ghana | Present | | | | Present | |

**Check-in log** — one row per successful Present, with readable names:

| Checked in at | Date | Day | Programme | Time | Program ID | Full Name | Country |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-08-18T14:05:00.000Z | 2026-08-18 | Tue 18 Aug | Applications and utilization of AI-ICT solutions | 14:00–17:00 | KYLP088 | Ama Mensah | Ghana |

The same person can be Present for many programmes. A second scan for the **same programme** returns `{ "ok": true, "duplicate": true }` and does not overwrite extra rows. Meals are not columns.

If an old `attendance` tab still has `composite_key`, the script renames it to `attendance_old` and builds the new tabs.

## Google Apps Script Contract

`api/mark-attendance.ts` sends this JSON to your Apps Script Web App:

```json
{
  "programId": "KYLP088",
  "fullName": "Ama Mensah",
  "country": "Ghana",
  "attendanceDate": "2026-08-18",
  "sessionCode": "koica-2026-009",
  "sessionLabel": "Applications and utilization of AI-ICT solutions",
  "programmeWindow": "14:00–17:00",
  "source": "vision",
  "editedBeforeConfirm": false,
  "checkedInAt": "2026-08-18T14:05:00.000Z",
  "sharedSecret": "your-secret"
}
```

Apps Script should return:

```json
{ "ok": true, "duplicate": false }
```

or for duplicate:

```json
{ "ok": true, "duplicate": true }
```
