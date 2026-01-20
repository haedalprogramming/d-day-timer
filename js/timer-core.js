/**
 * 타이머 코어 로직
 * 공통으로 사용되는 타이머 관련 유틸리티 함수
 */

const TimerCore = {
    /**
     * 남은 시간 계산
     * @param {Date|string|number} targetTime - 목표 시간
     * @returns {Object} { hours, minutes, seconds, totalMs, isComplete }
     */
    calculateTimeLeft(targetTime) {
        const target = new Date(targetTime).getTime();
        const now = Date.now();
        const diff = target - now;

        if (diff <= 0) {
            return {
                hours: 0,
                minutes: 0,
                seconds: 0,
                totalMs: 0,
                isComplete: true
            };
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return {
            hours,
            minutes,
            seconds,
            totalMs: diff,
            isComplete: false
        };
    },

    /**
     * 숫자를 2자리 문자열로 변환
     * @param {number} num
     * @returns {string}
     */
    padNumber(num) {
        return String(num).padStart(2, '0');
    },

    /**
     * 시간을 HH:MM:SS 형식으로 포맷
     * @param {number} hours
     * @param {number} minutes
     * @param {number} seconds
     * @returns {string}
     */
    formatTime(hours, minutes, seconds) {
        return `${this.padNumber(hours)}:${this.padNumber(minutes)}:${this.padNumber(seconds)}`;
    },

    /**
     * 현재 시간에서 분 단위로 목표 시간 계산
     * @param {number} minutes - 추가할 분
     * @returns {Date}
     */
    getTargetTimeFromMinutes(minutes) {
        return new Date(Date.now() + minutes * 60 * 1000);
    },

    /**
     * 진행률 계산
     * @param {Date|string|number} startTime - 시작 시간
     * @param {Date|string|number} targetTime - 목표 시간
     * @returns {number} 0-100 사이의 진행률
     */
    calculateProgress(startTime, targetTime) {
        const start = new Date(startTime).getTime();
        const target = new Date(targetTime).getTime();
        const now = Date.now();

        const total = target - start;
        const elapsed = now - start;

        if (total <= 0) return 100;
        if (elapsed <= 0) return 0;
        if (elapsed >= total) return 100;

        return Math.round((elapsed / total) * 100);
    },

    /**
     * 시간이 임박했는지 확인 (1시간 미만)
     * @param {number} totalMs - 남은 시간 (밀리초)
     * @returns {boolean}
     */
    isWarning(totalMs) {
        return totalMs > 0 && totalMs < 60 * 60 * 1000;
    },

    /**
     * 시간이 매우 임박했는지 확인 (5분 미만)
     * @param {number} totalMs - 남은 시간 (밀리초)
     * @returns {boolean}
     */
    isCritical(totalMs) {
        return totalMs > 0 && totalMs < 5 * 60 * 1000;
    },

    /**
     * 날짜/시간을 로컬 datetime-local 형식으로 변환
     * @param {Date|string} date
     * @returns {string} YYYY-MM-DDTHH:MM 형식
     */
    toLocalDateTimeString(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = this.padNumber(d.getMonth() + 1);
        const day = this.padNumber(d.getDate());
        const hours = this.padNumber(d.getHours());
        const minutes = this.padNumber(d.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    },

    /**
     * 분을 사람이 읽기 쉬운 형식으로 변환
     * @param {number} minutes
     * @returns {string}
     */
    formatDuration(minutes) {
        if (minutes < 60) {
            return `${minutes}분`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (mins === 0) {
            return `${hours}시간`;
        }
        return `${hours}시간 ${mins}분`;
    }
};

// 전역 내보내기
window.TimerCore = TimerCore;
