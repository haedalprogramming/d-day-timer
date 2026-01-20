/**
 * D-Day Timer - Google Apps Script
 *
 * 이 코드를 Google Sheets의 Apps Script에 붙여넣으세요.
 *
 * 설정 방법:
 * 1. Google Sheets에서 '확장 프로그램' > 'Apps Script' 클릭
 * 2. 기존 코드를 모두 지우고 이 파일의 내용을 붙여넣기
 * 3. 저장 (Ctrl+S)
 * 4. '배포' > '새 배포' 클릭
 * 5. 유형: '웹 앱' 선택
 * 6. 실행 대상: '나'
 * 7. 액세스 권한: '모든 사용자'
 * 8. '배포' 클릭
 * 9. 생성된 URL을 복사하여 js/google-sheets-config.js에 입력
 */

// 시트 이름 설정
const TIMER_SHEET_NAME = '타이머설정';
const PRESETS_SHEET_NAME = '프리셋';

/**
 * 스프레드시트 초기화 (처음 한 번만 실행)
 * Apps Script 에디터에서 이 함수를 선택하고 실행하세요.
 */
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 타이머 설정 시트 생성
  let timerSheet = ss.getSheetByName(TIMER_SHEET_NAME);
  if (!timerSheet) {
    timerSheet = ss.insertSheet(TIMER_SHEET_NAME);
    timerSheet.getRange('A1:E1').setValues([['title', 'target_time', 'is_active', 'updated_at', 'id']]);
    timerSheet.getRange('A2:E2').setValues([['', '', 'FALSE', new Date().toISOString(), '1']]);
    timerSheet.setFrozenRows(1);
  }

  // 프리셋 시트 생성
  let presetsSheet = ss.getSheetByName(PRESETS_SHEET_NAME);
  if (!presetsSheet) {
    presetsSheet = ss.insertSheet(PRESETS_SHEET_NAME);
    presetsSheet.getRange('A1:C1').setValues([['title', 'duration_minutes', 'id']]);
    // 기본 프리셋 추가
    presetsSheet.getRange('A2:C5').setValues([
      ['아이디어 발표', 30, '1'],
      ['점심시간', 60, '2'],
      ['개발 스프린트', 120, '3'],
      ['최종 발표', 45, '4']
    ]);
    presetsSheet.setFrozenRows(1);
  }

  // 기본 Sheet1 삭제 (있으면)
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  SpreadsheetApp.getUi().alert('초기화 완료! 이제 웹 앱으로 배포하세요.');
}

/**
 * GET 요청 처리
 */
function doGet(e) {
  const action = e.parameter.action;
  let result;

  try {
    switch (action) {
      case 'ping':
        result = { success: true, message: 'pong' };
        break;

      case 'getTimer':
        result = getTimerSettings();
        break;

      case 'setTimer':
        result = setTimerSettings(e.parameter);
        break;

      case 'getPresets':
        result = getPresets();
        break;

      case 'addPreset':
        result = addPreset(e.parameter.title, e.parameter.duration_minutes);
        break;

      case 'deletePreset':
        result = deletePreset(e.parameter.id);
        break;

      default:
        result = { success: false, error: 'Unknown action' };
    }
  } catch (error) {
    result = { success: false, error: error.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 타이머 설정 가져오기
 */
function getTimerSettings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(TIMER_SHEET_NAME);

  if (!sheet) {
    return { success: false, error: 'Timer sheet not found' };
  }

  const data = sheet.getRange('A2:E2').getValues()[0];

  return {
    success: true,
    data: {
      title: data[0] || '',
      target_time: data[1] || null,
      is_active: data[2] === true || data[2] === 'TRUE',
      updated_at: data[3] || null,
      id: data[4] || '1'
    }
  };
}

/**
 * 타이머 설정 업데이트
 */
function setTimerSettings(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(TIMER_SHEET_NAME);

  if (!sheet) {
    return { success: false, error: 'Timer sheet not found' };
  }

  const title = params.title || '';
  const targetTime = params.target_time || '';
  const isActive = params.is_active === 'true' || params.is_active === true;
  const updatedAt = new Date().toISOString();

  sheet.getRange('A2:D2').setValues([[title, targetTime, isActive, updatedAt]]);

  return {
    success: true,
    data: {
      title: title,
      target_time: targetTime,
      is_active: isActive,
      updated_at: updatedAt,
      id: '1'
    }
  };
}

/**
 * 프리셋 목록 가져오기
 */
function getPresets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(PRESETS_SHEET_NAME);

  if (!sheet) {
    return { success: true, data: [] };
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { success: true, data: [] };
  }

  const data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  const presets = data
    .filter(row => row[0]) // 빈 행 제외
    .map((row, index) => ({
      title: row[0],
      duration_minutes: parseInt(row[1]) || 0,
      id: row[2] || String(index + 2) // ID가 없으면 행 번호 사용
    }));

  return { success: true, data: presets };
}

/**
 * 프리셋 추가
 */
function addPreset(title, durationMinutes) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(PRESETS_SHEET_NAME);

  if (!sheet) {
    return { success: false, error: 'Presets sheet not found' };
  }

  const newId = String(Date.now()); // 유니크 ID 생성
  const lastRow = sheet.getLastRow();

  sheet.getRange(lastRow + 1, 1, 1, 3).setValues([[title, parseInt(durationMinutes), newId]]);

  return {
    success: true,
    data: {
      title: title,
      duration_minutes: parseInt(durationMinutes),
      id: newId
    }
  };
}

/**
 * 프리셋 삭제
 */
function deletePreset(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(PRESETS_SHEET_NAME);

  if (!sheet) {
    return { success: false, error: 'Presets sheet not found' };
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { success: false, error: 'No presets found' };
  }

  // ID로 행 찾기
  const data = sheet.getRange(2, 3, lastRow - 1, 1).getValues(); // C열 (ID)

  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 2); // 헤더 행 +1, 0-based index +1
      return { success: true };
    }
  }

  return { success: false, error: 'Preset not found' };
}
