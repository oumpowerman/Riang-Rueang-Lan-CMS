import firebaseConfig from '../../../../firebase-applet-config.json';

export interface ParsedLineFootageCommand {
  type: 'ADD_FOOTAGE' | 'CHECK_QUEUE' | 'HELP' | 'IGNORE';
  originalUrl?: string;
  title?: string;
  mascotNotes?: string;
}

/**
 * Parses a raw text message from LINE OA into a structured command.
 * Supports:
 * - "#ฟุต https://vt.tiktok.com/xxx"
 * - "#ฟุต ชื่อคลิป https://vt.tiktok.com/xxx"
 * - "#ฟุต ชื่อคลิป https://vt.tiktok.com/xxx โน้ต: ขยี้มุกตอนจบ"
 * - "#เช็คฟุต" / "#คิวฟุต"
 * - "#วิธีใช้ฟุต"
 */
export function parseLineFootageCommand(rawText: string): ParsedLineFootageCommand {
  const text = (rawText || '').trim();
  if (!text) return { type: 'IGNORE' };

  if (/^#(เช็คฟุต|คิวฟุต|check)/i.test(text)) {
    return { type: 'CHECK_QUEUE' };
  }

  if (/^#(วิธีใช้ฟุต|help)/i.test(text)) {
    return { type: 'HELP' };
  }

  if (!/^#(ฟุต|คลิป|ft|clip)\b/i.test(text)) {
    return { type: 'IGNORE' };
  }

  // Strip leading command prefix (#ฟุต, #คลิป, etc.)
  const body = text.replace(/^#(ฟุต|คลิป|ft|clip)\s*/i, '').trim();

  // Extract first URL (http:// or https:// or www.)
  const urlMatch = body.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/i);
  if (!urlMatch) {
    return { type: 'HELP' };
  }

  const rawUrl = urlMatch[0];
  const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

  // Remove the URL from the text to extract title and optional mascot notes
  const withoutUrl = body.replace(rawUrl, ' ').trim();

  let titlePart = withoutUrl;
  let mascotNotes = '';

  const noteMatch = withoutUrl.match(/(?:โน้ต|มุก|พากย์|note)\s*[:：]\s*(.+)$/i);
  if (noteMatch && noteMatch.index !== undefined) {
    mascotNotes = noteMatch[1].trim();
    titlePart = withoutUrl.slice(0, noteMatch.index).trim();
  }

  // Clean up extra spaces or leading/trailing hyphens
  const cleanTitle = titlePart.replace(/^[-–—:\s]+|[-–—:\s]+$/g, '').trim();

  // Derive a fallback readable title from platform if none provided
  let finalTitle = cleanTitle;
  if (!finalTitle) {
    if (/tiktok\.com/i.test(normalizedUrl)) {
      finalTitle = 'คลิปจาก TikTok (ส่งผ่าน LINE)';
    } else if (/youtube\.com|youtu\.be/i.test(normalizedUrl)) {
      finalTitle = 'คลิปจาก YouTube (ส่งผ่าน LINE)';
    } else if (/facebook\.com|fb\.watch/i.test(normalizedUrl)) {
      finalTitle = 'คลิปจาก Facebook (ส่งผ่าน LINE)';
    } else if (/instagram\.com/i.test(normalizedUrl)) {
      finalTitle = 'คลิปจาก Instagram (ส่งผ่าน LINE)';
    } else {
      finalTitle = 'คลิปจาก LINE รอตั้งชื่อ';
    }
  }

  return {
    type: 'ADD_FOOTAGE',
    originalUrl: normalizedUrl,
    title: finalTitle,
    mascotNotes: mascotNotes || 'ส่งลิงก์ผ่าน LINE OA (รอโหลดไฟล์ขึ้น Google Drive)',
  };
}

/**
 * Generates the complete Google Apps Script (Code.gs) for linking LINE OA Webhook
 * directly to this project's Cloud Firestore database.
 */
export function generateLineAppsScriptCode(lineChannelAccessToken?: string): string {
  const tokenValue = lineChannelAccessToken?.trim()
    ? lineChannelAccessToken.trim()
    : 'ใส่_LINE_CHANNEL_ACCESS_TOKEN_ของคุณที่นี่';

  return `/**
 * ============================================================================
 * LINE OA to Cloud Firestore Webhook (สำหรับระบบคลังฟุตเทจ 5 อันดับ)
 * ============================================================================
 * วิธีใช้งานใน LINE OA:
 * 1. พิมพ์: #ฟุต https://vt.tiktok.com/xxx
 * 2. พิมพ์พร้อมชื่อ: #ฟุต ลุงตู่พูดผิดฮาๆ https://vt.tiktok.com/xxx
 * 3. พิมพ์พร้อมโน้ตพากย์: #ฟุต ลุงตู่พูดผิด https://vt.tiktok.com/xxx โน้ต: ขยี้ตอนจบ
 * 4. เช็คคลิปค้างอัปโหลด Drive: #เช็คฟุต
 * ============================================================================
 */

const LINE_CHANNEL_ACCESS_TOKEN = '${tokenValue}';
const FIREBASE_PROJECT_ID = '${firebaseConfig.projectId}';
const FIRESTORE_DATABASE_ID = '${firebaseConfig.firestoreDatabaseId}';
const FIREBASE_API_KEY = '${firebaseConfig.apiKey}';

const FIRESTORE_BASE_URL =
  'https://firestore.googleapis.com/v1/projects/' +
  FIREBASE_PROJECT_ID +
  '/databases/' +
  FIRESTORE_DATABASE_ID +
  '/documents';

/**
 * ทดสอบเปิด Web App URL ผ่านเบราว์เซอร์เพื่อเช็คสถานะ
 */
function doGet() {
  return ContentService.createTextOutput(
    '✅ LINE OA -> Firestore Webhook พร้อมทำงาน! (Database: ' + FIRESTORE_DATABASE_ID + ')'
  ).setMimeType(ContentService.MimeType.TEXT);
}

/**
 * รับ Webhook Events จาก LINE Messaging API
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput('OK');
    }

    const payload = JSON.parse(e.postData.contents);
    const events = payload.events || [];

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (event.type === 'message' && event.message && event.message.type === 'text') {
        handleLineTextMessage(event.replyToken, event.message.text);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' })).setMimeType(
      ContentService.MimeType.JSON
    );
  } catch (err) {
    console.error('Webhook Error:', err);
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleLineTextMessage(replyToken, rawText) {
  const text = (rawText || '').trim();
  if (!text) return;

  // 1. คำสั่งเช็คคิวคลิปที่ยังไม่มีลิงก์ Google Drive
  if (/^#(เช็คฟุต|คิวฟุต|check)/i.test(text)) {
    const summaryReply = buildMissingDriveSummaryText();
    replyToLine(replyToken, summaryReply);
    return;
  }

  // 2. คำสั่งขอดูวิธีใช้งาน
  if (/^#(วิธีใช้ฟุต|help)/i.test(text)) {
    replyToLine(
      replyToken,
      '📌 วิธีส่งฟุตเทจเข้าคลังผ่าน LINE:\\n' +
        '1) ส่งลิงก์ด่วน:\\n#ฟุต https://vt.tiktok.com/xxx\\n\\n' +
        '2) ส่งพร้อมตั้งชื่อคลิป:\\n#ฟุต ชื่อคลิป https://vt.tiktok.com/xxx\\n\\n' +
        '3) ส่งพร้อมโน้ตมุกพากย์:\\n#ฟุต ชื่อคลิป https://... โน้ต: ขยี้ตอนจบ\\n\\n' +
        '4) เช็คคลิปค้างอัปโหลด Drive:\\n#เช็คฟุต'
    );
    return;
  }

  // 3. คำสั่งเพิ่มฟุตเทจ (#ฟุต หรือ #คลิป)
  if (!/^#(ฟุต|คลิป|ft|clip)\\b/i.test(text)) {
    return; // ข้ามข้อความแชททั่วไปที่ไม่ได้ขึ้นต้นด้วย #ฟุต
  }

  const body = text.replace(/^#(ฟุต|คลิป|ft|clip)\\s*/i, '').trim();
  const urlMatch = body.match(/(https?:\\/\\/[^\\s]+|www\\.[^\\s]+)/i);

  if (!urlMatch) {
    replyToLine(
      replyToken,
      '⚠️ ไม่พบลิงก์ในข้อความครับ\\nตัวอย่างการพิมพ์:\\n#ฟุต ชื่อคลิป https://vt.tiktok.com/xxx'
    );
    return;
  }

  const rawUrl = urlMatch[0];
  const originalUrl = /^https?:\\/\\//i.test(rawUrl) ? rawUrl : 'https://' + rawUrl;
  const withoutUrl = body.replace(rawUrl, ' ').trim();

  let titlePart = withoutUrl;
  let mascotNotes = 'ส่งลิงก์ผ่าน LINE OA (รอโหลดไฟล์ขึ้น Google Drive)';

  const noteMatch = withoutUrl.match(/(?:โน้ต|มุก|พากย์|note)\\s*[:：]\\s*(.+)$/i);
  if (noteMatch && noteMatch.index !== undefined) {
    mascotNotes = noteMatch[1].trim();
    titlePart = withoutUrl.slice(0, noteMatch.index).trim();
  }

  let cleanTitle = titlePart.replace(/^[-–—:\\s]+|[-–—:\\s]+$/g, '').trim();
  if (!cleanTitle) {
    if (/tiktok\\.com/i.test(originalUrl)) cleanTitle = 'คลิปจาก TikTok (ส่งผ่าน LINE)';
    else if (/youtube\\.com|youtu\\.be/i.test(originalUrl)) cleanTitle = 'คลิปจาก YouTube (ส่งผ่าน LINE)';
    else if (/facebook\\.com|fb\\.watch/i.test(originalUrl)) cleanTitle = 'คลิปจาก Facebook (ส่งผ่าน LINE)';
    else if (/instagram\\.com/i.test(originalUrl)) cleanTitle = 'คลิปจาก Instagram (ส่งผ่าน LINE)';
    else cleanTitle = 'คลิปจาก LINE รอตั้งชื่อ';
  }

  const created = createFootageInFirestore(cleanTitle, originalUrl, mascotNotes);
  replyToLine(
    replyToken,
    '✅ บันทึกฟุตเทจเข้าคลังเรียบร้อย!\\n' +
      '🎬 รหัส: ' + created.id + '\\n' +
      '📝 ชื่อ: ' + created.title + '\\n' +
      '📄 ชื่อไฟล์มาตรฐาน: ' + created.standardFileName + '\\n' +
      '⏳ สถานะ: รออัปโหลดไฟล์ลง Google Drive'
  );
}

/**
 * สร้าง Document ฟุตเทจใหม่ใน Collection footages
 */
function createFootageInFirestore(title, originalUrl, mascotNotes) {
  const nextId = getNextFootageId();
  const safeFileTitle = title.replace(/[\\\\/:*?"<>|]/g, '_').replace(/\\s+/g, '_');
  const standardFileName = nextId + '_' + safeFileTitle + '.mp4';
  const todayIso = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd');
  const nowIso = new Date().toISOString();

  const docUrl =
    FIRESTORE_BASE_URL +
    '/footages?documentId=' +
    encodeURIComponent(nextId) +
    '&key=' +
    encodeURIComponent(FIREBASE_API_KEY);

  const firestorePayload = {
    fields: {
      id: { stringValue: nextId },
      title: { stringValue: title },
      ingestionFlow: { stringValue: 'DIRECT_1_TO_1' },
      sourceId: { nullValue: null },
      originalUrl: { stringValue: originalUrl },
      timestampRange: { nullValue: null },
      durationSec: { integerValue: '25' },
      tags: {
        arrayValue: {
          values: [{ stringValue: 'TAG-STAGING' }],
        },
      },
      driveFileUrl: { stringValue: '' },
      standardFileName: { stringValue: standardFileName },
      mascotNotes: { stringValue: mascotNotes },
      createdAt: { stringValue: todayIso },
      updatedAt: { stringValue: nowIso },
    },
  };

  UrlFetchApp.fetch(docUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(firestorePayload),
    muteHttpExceptions: true,
  });

  return {
    id: nextId,
    title: title,
    standardFileName: standardFileName,
  };
}

/**
 * ค้นหารหัส CLP-xxxx ล่าสุดจาก Firestore เพื่อรันเลขถัดไปอัตโนมัติ
 */
function getNextFootageId() {
  let maxNumber = 0;
  let pageToken = '';

  do {
    const listUrl =
      FIRESTORE_BASE_URL +
      '/footages?pageSize=300&mask.fieldPaths=id&key=' +
      encodeURIComponent(FIREBASE_API_KEY) +
      (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '');

    const res = UrlFetchApp.fetch(listUrl, { muteHttpExceptions: true });
    const data = JSON.parse(res.getContentText() || '{}');
    const docs = data.documents || [];

    for (let i = 0; i < docs.length; i++) {
      const idStr =
        docs[i].fields && docs[i].fields.id && docs[i].fields.id.stringValue
          ? docs[i].fields.id.stringValue
          : '';
      const match = idStr.match(/^(?:CLP|FT)-(\\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    }

    pageToken = data.nextPageToken || '';
  } while (pageToken);

  const nextNum = maxNumber + 1;
  return 'CLP-' + ('0000' + nextNum).slice(-Math.max(4, String(nextNum).length));
}

/**
 * ตรวจสอบรายการที่มีลิงก์ Social แต่ยังไม่มีลิงก์ Google Drive (#เช็คฟุต)
 */
function buildMissingDriveSummaryText() {
  const listUrl =
    FIRESTORE_BASE_URL +
    '/footages?pageSize=300&key=' +
    encodeURIComponent(FIREBASE_API_KEY);

  const res = UrlFetchApp.fetch(listUrl, { muteHttpExceptions: true });
  const data = JSON.parse(res.getContentText() || '{}');
  const docs = data.documents || [];

  const pendingList = [];
  for (let i = 0; i < docs.length; i++) {
    const f = docs[i].fields || {};
    const id = (f.id && f.id.stringValue) || '';
    const title = (f.title && f.title.stringValue) || 'ไม่มีชื่อ';
    const driveUrl = (f.driveFileUrl && f.driveFileUrl.stringValue) || '';
    const origUrl = (f.originalUrl && f.originalUrl.stringValue) || '';

    if (!driveUrl.trim() && origUrl.trim()) {
      pendingList.push(id + ': ' + title);
    }
  }

  if (pendingList.length === 0) {
    return '🎉 คลิปทั้งหมดในคลังมีลิงก์ Google Drive ครบถ้วนแล้วครับ!';
  }

  const previewItems = pendingList.slice(0, 8).join('\\n• ');
  const moreText =
    pendingList.length > 8 ? '\\n...และอีก ' + (pendingList.length - 8) + ' รายการ' : '';

  return (
    '⏳ มีฟุตเทจที่มีลิงก์ Social แต่ยังไม่ได้ใส่ลิงก์ Drive จำนวน ' +
    pendingList.length +
    ' รายการ:\\n• ' +
    previewItems +
    moreText
  );
}

/**
 * ส่งข้อความตอบกลับไปยังแชท LINE OA
 */
function replyToLine(replyToken, textMessage) {
  if (!replyToken || !LINE_CHANNEL_ACCESS_TOKEN) return;
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN,
    },
    payload: JSON.stringify({
      replyToken: replyToken,
      messages: [{ type: 'text', text: textMessage }],
    }),
    muteHttpExceptions: true,
  });
}
`;
}
