/**
 * Google Sheets 설정 파일
 *
 * 사용 방법:
 * 1. Google Sheets 템플릿 복사
 * 2. Apps Script 배포
 * 3. 아래에 Web App URL 입력
 *
 * 자세한 설정 방법은 README.md 참조
 */

// Google Apps Script Web App URL - 사용자가 직접 입력해야 함
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxauArm90mJ9OfiydNv-llD6qJimYaTK8SCODevq7xLAZVMwrsoXzyISUmJ6DQ_mAEQ/exec';

// 폴링 간격 (밀리초) - 기본 2초
const POLLING_INTERVAL = 2000;

/**
 * API 초기화 확인
 * @returns {boolean}
 */
function isConfigured() {
    return GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_SCRIPT_URL' && GOOGLE_SCRIPT_URL.includes('script.google.com');
}

/**
 * API 요청 헬퍼
 * @param {string} action - API 액션
 * @param {Object} data - 요청 데이터
 * @returns {Promise<Object>}
 */
async function apiRequest(action, data = {}) {
    if (!isConfigured()) {
        console.warn('Google Sheets 설정이 필요합니다. js/google-sheets-config.js 파일을 확인하세요.');
        return null;
    }

    try {
        const url = new URL(GOOGLE_SCRIPT_URL);
        url.searchParams.append('action', action);

        // GET 요청으로 데이터 전달
        Object.keys(data).forEach(key => {
            url.searchParams.append(key, typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
        });

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API 요청 실패:', error);
        return null;
    }
}

/**
 * 연결 상태 확인
 * @returns {Promise<boolean>}
 */
async function checkConnection() {
    if (!isConfigured()) return false;

    const result = await apiRequest('ping');
    return result && result.success === true;
}

/**
 * 타이머 설정 가져오기
 * @returns {Promise<Object|null>}
 */
async function getTimerSettings() {
    const result = await apiRequest('getTimer');

    if (result && result.success) {
        return result.data;
    }
    return null;
}

/**
 * 타이머 설정 업데이트
 * @param {Object} settings - { title, target_time, is_active }
 * @returns {Promise<Object|null>}
 */
async function updateTimerSettings(settings) {
    const result = await apiRequest('setTimer', settings);

    if (result && result.success) {
        return result.data;
    }
    return null;
}

/**
 * 타이머 폴링 시작
 * @param {Function} callback - 변경 시 호출될 콜백
 * @returns {number} interval ID
 */
function startTimerPolling(callback) {
    let lastUpdatedAt = null;

    const poll = async () => {
        const settings = await getTimerSettings();

        if (settings) {
            // 변경 감지
            if (settings.updated_at !== lastUpdatedAt) {
                lastUpdatedAt = settings.updated_at;
                callback(settings);
            }
        }
    };

    // 즉시 한 번 실행
    poll();

    // 주기적으로 폴링
    return setInterval(poll, POLLING_INTERVAL);
}

/**
 * 폴링 중지
 * @param {number} intervalId
 */
function stopTimerPolling(intervalId) {
    if (intervalId) {
        clearInterval(intervalId);
    }
}

/**
 * 프리셋 목록 가져오기
 * @returns {Promise<Array>}
 */
async function getPresets() {
    const result = await apiRequest('getPresets');

    if (result && result.success) {
        return result.data || [];
    }
    return [];
}

/**
 * 프리셋 추가
 * @param {string} title - 프리셋 이름
 * @param {number} durationMinutes - 지속 시간 (분)
 * @returns {Promise<Object|null>}
 */
async function addPreset(title, durationMinutes) {
    const result = await apiRequest('addPreset', {
        title,
        duration_minutes: durationMinutes
    });

    if (result && result.success) {
        return result.data;
    }
    return null;
}

/**
 * 프리셋 삭제
 * @param {string} id - 프리셋 ID (행 번호)
 * @returns {Promise<boolean>}
 */
async function deletePreset(id) {
    const result = await apiRequest('deletePreset', { id });
    return result && result.success === true;
}

// 전역 내보내기
window.SheetsConfig = {
    isConfigured,
    checkConnection,
    getTimerSettings,
    updateTimerSettings,
    startTimerPolling,
    stopTimerPolling,
    getPresets,
    addPreset,
    deletePreset,
    POLLING_INTERVAL
};
