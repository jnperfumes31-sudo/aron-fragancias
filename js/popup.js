(function() {
    const STORAGE_KEY = 'singler_popup_shown_pro_v3';
    const SHOW_DELAY = 2000;
    const CLOSE_DELAY = 10000;
    // Si quieres que el popup se muestre en cada carga, poner true.
    const SHOW_ALWAYS = true;
    let autoCloseTimer = null;

    const modal = document.getElementById('singler-modal');
    if (!modal) return;

    const closeBtn = document.getElementById('singler-modal-close');
    const closeBtn2 = document.getElementById('singler-modal-close-2');
    const countdownEl = document.getElementById('auto-close-countdown');
    let previouslyFocused = null;
    let countdownInterval = null;

    function startAutoClose() {
        if (autoCloseTimer) clearTimeout(autoCloseTimer);
        if (countdownInterval) clearInterval(countdownInterval);
        
        let secondsLeft = CLOSE_DELAY / 1000;
        if (countdownEl) {
            countdownEl.textContent = secondsLeft;
            countdownInterval = setInterval(() => {
                secondsLeft--;
                if (countdownEl) countdownEl.textContent = secondsLeft;
                if (secondsLeft <= 0) clearInterval(countdownInterval);
            }, 1000);
        }
        
        autoCloseTimer = setTimeout(() => {
            closeModal();
        }, CLOSE_DELAY);
    }

    function openModal() {
        previouslyFocused = document.activeElement;
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        startAutoClose();
        
        if (closeBtn) closeBtn.focus();
        
        setTimeout(() => {
            modal.classList.add('modal-active');
        }, 10);
    }

    function closeModal() {
        if (autoCloseTimer) clearTimeout(autoCloseTimer);
        if (countdownInterval) clearInterval(countdownInterval);
        
        modal.classList.remove('modal-active');
        
        setTimeout(() => {
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
            if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
        }, 300);
    }

    function resetAutoClose() {
        if (autoCloseTimer) {
            clearTimeout(autoCloseTimer);
            clearInterval(countdownInterval);
            startAutoClose();
        }
    }

    function onKeyDown(e) {
        if (e.key === 'Escape') closeModal();
        
        if (e.key === 'Tab' && modal.getAttribute('aria-hidden') === 'false') {
            const focusable = modal.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    modal.addEventListener('mousemove', resetAutoClose);
    modal.addEventListener('keydown', resetAutoClose);

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (closeBtn2) closeBtn2.addEventListener('click', closeModal);

    document.addEventListener('keydown', onKeyDown);

    try {
        const shown = localStorage.getItem(STORAGE_KEY);
        if (SHOW_ALWAYS) {
            setTimeout(openModal, SHOW_DELAY);
        } else if (!shown) {
            setTimeout(openModal, SHOW_DELAY);
        }
    } catch (e) {
        setTimeout(openModal, SHOW_DELAY);
    }

})();