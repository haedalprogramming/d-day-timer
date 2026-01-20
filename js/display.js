/**
 * 디스플레이 페이지 로직
 * Google Sheets 폴링을 통해 타이머 설정을 수신하고 표시
 */

(function () {
    // DOM 요소
    const elements = {
        container: document.getElementById('displayContainer'),
        title: document.getElementById('eventTitle'),
        hours: document.getElementById('hours'),
        minutes: document.getElementById('minutes'),
        seconds: document.getElementById('seconds'),
        progressFill: document.getElementById('progressFill'),
        progressPercent: document.getElementById('progressPercent'),
        progressRemaining: document.getElementById('progressRemaining'),
        completionMessage: document.getElementById('completionMessage'),
        waitingMessage: document.getElementById('waitingMessage'),
        timerDisplay: document.getElementById('timerDisplay'),
        connectionStatus: document.getElementById('connectionStatus'),
        statusDot: document.getElementById('statusDot'),
        statusText: document.getElementById('statusText'),
        fullscreenBtn: document.getElementById('fullscreenBtn'),
        adminBtn: document.getElementById('adminBtn')
    };

    // 상태
    let timerInterval = null;
    let pollingId = null;
    let currentSettings = null;
    let startTime = null;

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
                startPolling();
            } else {
                updateConnectionStatus('disconnected');
                showWaitingMessage('Google Sheets 연결 실패');
            }
        } else {
            updateConnectionStatus('disconnected');
            showWaitingMessage('Google Sheets 설정이 필요합니다');
        }

        // 이벤트 리스너 설정
        setupEventListeners();
    }

    /**
     * 폴링 시작
     */
    function startPolling() {
        pollingId = window.SheetsConfig.startTimerPolling((settings) => {
            handleSettingsUpdate(settings);
        });
    }

    /**
     * 설정 업데이트 처리
     */
    function handleSettingsUpdate(settings) {
        currentSettings = settings;

        if (settings && settings.is_active && settings.target_time) {
            startTime = new Date(settings.updated_at);
            showTimer();
            startCountdown();
        } else {
            stopCountdown();
            showWaitingMessage('타이머가 중지되었습니다');
        }
    }

    /**
     * 타이머 표시
     */
    function showTimer() {
        elements.waitingMessage.classList.add('hidden');
        elements.timerDisplay.classList.remove('hidden');
        elements.completionMessage.classList.add('hidden');

        if (currentSettings && currentSettings.title) {
            elements.title.textContent = currentSettings.title;
        } else {
            elements.title.textContent = '';
        }
    }

    /**
     * 대기 메시지 표시
     */
    function showWaitingMessage(message) {
        elements.timerDisplay.classList.add('hidden');
        elements.completionMessage.classList.add('hidden');
        elements.waitingMessage.classList.remove('hidden');
        elements.waitingMessage.querySelector('h2').textContent = message;
    }

    /**
     * 카운트다운 시작
     */
    function startCountdown() {
        stopCountdown();

        timerInterval = setInterval(updateTimer, 1000);
        updateTimer(); // 즉시 한 번 실행
    }

    /**
     * 카운트다운 중지
     */
    function stopCountdown() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    /**
     * 타이머 업데이트
     */
    function updateTimer() {
        if (!currentSettings || !currentSettings.target_time) return;

        const timeLeft = TimerCore.calculateTimeLeft(currentSettings.target_time);

        // 시간 표시 업데이트
        elements.hours.textContent = TimerCore.padNumber(timeLeft.hours);
        elements.minutes.textContent = TimerCore.padNumber(timeLeft.minutes);
        elements.seconds.textContent = TimerCore.padNumber(timeLeft.seconds);

        // 프로그레스 바 업데이트
        if (startTime) {
            const progress = TimerCore.calculateProgress(startTime, currentSettings.target_time);
            elements.progressFill.style.width = `${progress}%`;
            elements.progressPercent.textContent = `${progress}%`;

            // 남은 시간 텍스트
            if (timeLeft.hours > 0) {
                elements.progressRemaining.textContent =
                    `${timeLeft.hours}시간 ${timeLeft.minutes}분 남음`;
            } else if (timeLeft.minutes > 0) {
                elements.progressRemaining.textContent =
                    `${timeLeft.minutes}분 ${timeLeft.seconds}초 남음`;
            } else {
                elements.progressRemaining.textContent =
                    `${timeLeft.seconds}초 남음`;
            }
        }

        // 상태 클래스 업데이트
        const container = elements.container;
        container.classList.remove('timer-warning', 'timer-completed');

        if (timeLeft.isComplete) {
            // 완료
            container.classList.add('timer-completed');
            elements.completionMessage.classList.remove('hidden');
            stopCountdown();
        } else if (TimerCore.isWarning(timeLeft.totalMs)) {
            // 경고 (1시간 미만)
            container.classList.add('timer-warning');
        }
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
     * 이벤트 리스너 설정
     */
    function setupEventListeners() {
        // 전체화면 버튼
        elements.fullscreenBtn.addEventListener('click', toggleFullscreen);

        // 관리자 페이지 버튼
        elements.adminBtn.addEventListener('click', () => {
            window.open('admin.html', '_blank');
        });

        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            if (e.key === 'f' || e.key === 'F') {
                toggleFullscreen();
            }
            if (e.key === 'Escape' && document.fullscreenElement) {
                document.exitFullscreen();
            }
        });

        // 전체화면 변경 감지
        document.addEventListener('fullscreenchange', () => {
            document.body.classList.toggle('fullscreen', !!document.fullscreenElement);
        });
    }

    /**
     * 전체화면 토글
     */
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('전체화면 실패:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    // DOM 로드 시 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
