// Contact form: POSTs to the /api/contact Worker. Turnstile auto-renders the
// .cf-turnstile widget, which adds its token to the form as cf-turnstile-response.
(function () {
  const form = document.querySelector('.contact-form');
  if (!form) return;
  const widget = form.querySelector('.cf-turnstile');
  const submitBtn = form.querySelector('button[type="submit"]');
  const statusEl = document.querySelector('.contact-status');

  function showStatus(text) {
    statusEl.hidden = false;
    statusEl.textContent = text;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    showStatus('Sending…');
    try {
      const res = await fetch('/api/contact', { method: 'POST', body: new FormData(form) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        form.hidden = true;
        showStatus('Thanks — your message has been sent.');
        return;
      }
      showStatus(data.error || 'Sorry, something went wrong. Please try again later.');
    } catch {
      showStatus('Couldn’t reach the server. Check your connection and try again.');
    }
    // Turnstile tokens are single-use, so a retry needs a fresh one.
    if (window.turnstile) window.turnstile.reset(widget);
    submitBtn.disabled = false;
  });
})();
