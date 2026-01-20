/**
 * 관리자 페이지 로직
 * Google Sheets를 통한 타이머 설정 및 프리셋 관리
 */

(function () {
    // DOM 요소
    const elements = {
        // 연결 상태
        statusDot: document.getElementById('statusDot'),
        statusText: document.getElementById('statusText'),

        // 타이머 타입 선택
        typeDateTime: document.getElementById('typeDateTime'),
        typeDuration: document.getElementById('typeDuration'),
        dateTimeGroup: document.getElementById('dateTimeGroup'),
        durationGroup: document.getElementById('durationGroup'),

        // 입력 필드
        timerTitle: document.getElementById('timerTitle'),
        targetDateTime: document.getElementById('targetDateTime'),
        durationMinutes: document.getElementById('durationMinutes'),

        // 버튼
        startTimerBtn: document.getElementById('startTimerBtn'),
        stopTimerBtn: document.getElementById('stopTimerBtn'),

        // 현재 타이머 정보
        currentTimerInfo: document.getElementById('currentTimerInfo'),
        currentTimerTitle: document.getElementById('currentTimerTitle'),
        currentTimerTarget: document.getElementById('currentTimerTarget'),

        // 프리셋
        presetsGrid: document.getElementById('presetsGrid'),
        presetTitle: document.getElementById('presetTitle'),
        presetDuration: document.getElementById('presetDuration'),
        addPresetBtn: document.getElementById('addPresetBtn'),

        // 미리보기
        previewTitle: document.getElementById('previewTitle'),
        previewHours: document.getElementById('previewHours'),
        previewMinutes: document.getElementById('previewMinutes'),
        previewSeconds: document.getElementById('previewSeconds'),
        previewStatus: document.getElementById('previewStatus'),
        previewInactive: document.getElementById('previewInactive'),
        previewTimerDisplay: document.getElementById('previewTimerDisplay'),

        // 디스플레이 열기 버튼
        openDisplayBtn: document.getElementById('openDisplayBtn')
    };

    // 상태
    let currentSettings = null;
    let previewInterval = null;
    let timerType = 'datetime'; // 'datetime' or 'duration'

    /**
     * 초기화
     */
    async function init() {
        // 설정 확인
        if (window.SheetsConfig.isConfigured()) {
            updateConnectionStatus('loading');
            const connected = await window.SheetsConfig.checkConnection();

            if (connected) {
                updateConnectionStatus('connected');
                await loadCurrentSettings();
                await loadPresets();
            } else {
                updateConnectionStatus('disconnected');
            }
        } else {
            updateConnectionStatus('disconnected');
        }

        // 이벤트 리스너 설정
        setupEventListeners();

        // 기본 datetime 최소값 설정
        setMinDateTime();
    }

    /**
     * 현재 타이머 설정 로드
     */
    async function loadCurrentSettings() {
        currentSettings = await window.SheetsConfig.getTimerSettings();
        updateCurrentTimerDisplay();
        startPreviewUpdate();
    }

    /**
     * 프리셋 로드
     */
    async function loadPresets() {
        const presets = await window.SheetsConfig.getPresets();
        renderPresets(presets);
    }

    /**
     * 연결 상태 업데이트
     */
    function updateConnectionStatus(status) {
        elements.statusDot.className = 'status-dot ' + status;

        switch (status) {
            case 'connected':
                elements.statusText.textContent = '연결됨';
                break;
            case 'disconnected':
                elements.statusText.textContent = '연결 끊김';
                break;
            case 'loading':
                elements.statusText.textContent = '연결 중...';
                break;
        }
    }

    /**
     * 현재 타이머 표시 업데이트
     */
    function updateCurrentTimerDisplay() {
        if (currentSettings && currentSettings.is_active && currentSettings.target_time) {
            elements.currentTimerInfo.classList.remove('hidden');
            elements.currentTimerTitle.textContent = currentSettings.title || '(제목 없음)';

            const targetDate = new Date(currentSettings.target_time);
            elements.currentTimerTarget.textContent =
                `목표: ${targetDate.toLocaleString('ko-KR')}`;

            elements.stopTimerBtn.disabled = false;
        } else {
            elements.currentTimerInfo.classList.add('hidden');
            elements.stopTimerBtn.disabled = true;
        }
    }

    /**
     * 미리보기 업데이트 시작
     */
    function startPreviewUpdate() {
        if (previewInterval) {
            clearInterval(previewInterval);
        }

        previewInterval = setInterval(updatePreview, 1000);
        updatePreview();
    }

    /**
     * 미리보기 업데이트
     */
    function updatePreview() {
        if (currentSettings && currentSettings.is_active && currentSettings.target_time) {
            elements.previewInactive.classList.add('hidden');
            elements.previewTimerDisplay.classList.remove('hidden');

            elements.previewTitle.textContent = currentSettings.title || '';

            const timeLeft = TimerCore.calculateTimeLeft(currentSettings.target_time);
            elements.previewHours.textContent = TimerCore.padNumber(timeLeft.hours);
            elements.previewMinutes.textContent = TimerCore.padNumber(timeLeft.minutes);
            elements.previewSeconds.textContent = TimerCore.padNumber(timeLeft.seconds);

            if (timeLeft.isComplete) {
                elements.previewStatus.textContent = '완료';
                elements.previewStatus.style.color = 'var(--accent-secondary)';
            } else if (TimerCore.isWarning(timeLeft.totalMs)) {
                elements.previewStatus.textContent = '임박';
                elements.previewStatus.style.color = 'var(--accent-warning)';
            } else {
                elements.previewStatus.textContent = '진행 중';
                elements.previewStatus.style.color = 'var(--accent-primary)';
            }
        } else {
            elements.previewInactive.classList.remove('hidden');
            elements.previewTimerDisplay.classList.add('hidden');
        }
    }

    /**
     * 프리셋 렌더링
     */
    function renderPresets(presets) {
        elements.presetsGrid.innerHTML = '';

        presets.forEach(preset => {
            const btn = document.createElement('button');
            btn.className = 'preset-btn';
            btn.innerHTML = `
                <div class="preset-title">${escapeHtml(preset.title)}</div>
                <div class="preset-time">${TimerCore.formatDuration(preset.duration_minutes)}</div>
                <span class="preset-delete" data-id="${preset.id}" title="삭제">&times;</span>
            `;

            // 프리셋 클릭 시 타이머 시작
            btn.addEventListener('click', (e) => {
                if (e.target.classList.contains('preset-delete')) {
                    return;
                }
                applyPreset(preset);
            });

            // 삭제 버튼
            btn.querySelector('.preset-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                deletePreset(preset.id);
            });

            elements.presetsGrid.appendChild(btn);
        });
    }

    /**
     * 프리셋 적용
     */
    async function applyPreset(preset) {
        const targetTime = TimerCore.getTargetTimeFromMinutes(preset.duration_minutes);

        await window.SheetsConfig.updateTimerSettings({
            title: preset.title,
            target_time: targetTime.toISOString(),
            is_active: true
        });

        await loadCurrentSettings();
    }

    /**
     * 프리셋 삭제
     */
    async function deletePreset(id) {
        if (confirm('이 프리셋을 삭제하시겠습니까?')) {
            await window.SheetsConfig.deletePreset(id);
            await loadPresets();
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    function setupEventListeners() {
        // 타이머 타입 선택
        elements.typeDateTime.addEventListener('click', () => {
            timerType = 'datetime';
            elements.typeDateTime.classList.add('active');
            elements.typeDuration.classList.remove('active');
            elements.dateTimeGroup.classList.remove('hidden');
            elements.durationGroup.classList.add('hidden');
        });

        elements.typeDuration.addEventListener('click', () => {
            timerType = 'duration';
            elements.typeDuration.classList.add('active');
            elements.typeDateTime.classList.remove('active');
            elements.durationGroup.classList.remove('hidden');
            elements.dateTimeGroup.classList.add('hidden');
        });

        // 타이머 시작
        elements.startTimerBtn.addEventListener('click', startTimer);

        // 타이머 중지
        elements.stopTimerBtn.addEventListener('click', stopTimer);

        // 프리셋 추가
        elements.addPresetBtn.addEventListener('click', addPreset);

        // 디스플레이 열기
        elements.openDisplayBtn.addEventListener('click', () => {
            window.open('display.html', '_blank');
        });

        // Enter 키로 폼 제출
        elements.timerTitle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') startTimer();
        });

        elements.durationMinutes.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') startTimer();
        });
    }

    /**
     * datetime 최소값 설정
     */
    function setMinDateTime() {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        elements.targetDateTime.min = now.toISOString().slice(0, 16);
    }

    /**
     * 타이머 시작
     */
    async function startTimer() {
        const title = elements.timerTitle.value.trim();
        let targetTime;

        if (timerType === 'datetime') {
            const dateTimeValue = elements.targetDateTime.value;
            if (!dateTimeValue) {
                alert('목표 시간을 입력해주세요.');
                return;
            }
            targetTime = new Date(dateTimeValue);

            if (targetTime <= new Date()) {
                alert('미래의 시간을 입력해주세요.');
                return;
            }
        } else {
            const minutes = parseInt(elements.durationMinutes.value);
            if (!minutes || minutes <= 0) {
                alert('유효한 시간(분)을 입력해주세요.');
                return;
            }
            targetTime = TimerCore.getTargetTimeFromMinutes(minutes);
        }

        await window.SheetsConfig.updateTimerSettings({
            title: title,
            target_time: targetTime.toISOString(),
            is_active: true
        });

        await loadCurrentSettings();

        // 입력 필드 초기화
        elements.timerTitle.value = '';
        elements.targetDateTime.value = '';
        elements.durationMinutes.value = '';
    }

    /**
     * 타이머 중지
     */
    async function stopTimer() {
        await window.SheetsConfig.updateTimerSettings({
            title: currentSettings?.title || '',
            target_time: null,
            is_active: false
        });

        await loadCurrentSettings();
    }

    /**
     * 프리셋 추가
     */
    async function addPreset() {
        const title = elements.presetTitle.value.trim();
        const duration = parseInt(elements.presetDuration.value);

        if (!title) {
            alert('프리셋 이름을 입력해주세요.');
            return;
        }

        if (!duration || duration <= 0) {
            alert('유효한 시간(분)을 입력해주세요.');
            return;
        }

        await window.SheetsConfig.addPreset(title, duration);
        await loadPresets();

        // 입력 필드 초기화
        elements.presetTitle.value = '';
        elements.presetDuration.value = '';
    }

    /**
     * HTML 이스케이프
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // DOM 로드 시 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
