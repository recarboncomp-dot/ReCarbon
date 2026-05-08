/* ============================================
   RECARBON - Main JS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Navbar scroll effect ---- */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });

  /* ---- Mobile hamburger ---- */
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks = document.querySelector('.nav-links');
  hamburger?.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  // close on link click
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('open'));
  });

  /* ---- Intersection Observer: fade-up & fade-in ---- */
  const observerOptions = { threshold: 0.12 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-up, .fade-in').forEach(el => observer.observe(el));

  /* ---- Funding bars animation ---- */
  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.funding-bar-fill').forEach(bar => {
          bar.classList.add('animated');
        });
        barObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const fundingSection = document.querySelector('.funding-items');
  if (fundingSection) barObserver.observe(fundingSection);

  /* ---- Contact form ---- */
  const form = document.getElementById('contactForm');
  const statusEl = document.getElementById('contactFormStatus');
  const submitBtn = form?.querySelector('.form-submit');

  const fieldRules = {
    first_name: {
      label: 'First name',
      validate: value => value.length >= 2 ? '' : 'First name must be at least 2 characters.'
    },
    last_name: {
      label: 'Last name',
      validate: value => value.length >= 2 ? '' : 'Last name must be at least 2 characters.'
    },
    email: {
      label: 'Email',
      validate: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Enter a valid email address.'
    },
    company: {
      label: 'Organisation',
      validate: value => value.length === 0 || value.length >= 2 ? '' : 'Organisation must be at least 2 characters.'
    },
    message: {
      label: 'Message',
      validate: value => value.length >= 10 ? '' : 'Message must be at least 10 characters.'
    }
  };

  const setStatus = (message, type = '') => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `form-status${type ? ` form-status--${type}` : ''}`;
  };

  const setFieldState = (field, message) => {
    field.setCustomValidity(message);
    field.classList.toggle('is-invalid', Boolean(message));
  };

  const validateField = (field) => {
    const rule = fieldRules[field.name];
    if (!rule) return true;
    const value = field.value.trim();
    const message = rule.validate(value);
    setFieldState(field, message);
    return !message;
  };

  if (form) {
    form.querySelectorAll('.form-input, .form-textarea').forEach(field => {
      field.addEventListener('input', () => validateField(field));
      field.addEventListener('blur', () => validateField(field));
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      setStatus('');

      const fields = [...form.querySelectorAll('.form-input, .form-textarea')];
      const isValid = fields.reduce((valid, field) => validateField(field) && valid, true);

      if (!isValid || !form.checkValidity()) {
        form.reportValidity();
        setStatus('Please fix the highlighted fields.', 'error');
        return;
      }

      const originalText = submitBtn?.textContent || 'Send Message →';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }

      try {
        const formData = Object.fromEntries(new FormData(form).entries());
        
        // Save to IndexedDB
        await RecarbonDB.addSubmission(formData);

        // Also attempt to save to Firebase if configured (non-blocking)
        try {
          if (window.FirebaseService && typeof FirebaseService.saveSubmission === 'function') {
            FirebaseService.saveSubmission(formData).then(() => {
              console.info('Saved submission to Firebase');
            }).catch(err => console.warn('Failed saving to Firebase', err));
          }
        } catch (err) {
          console.warn('Firebase save attempt failed', err);
        }

        form.reset();
        fields.forEach(field => setFieldState(field, ''));
        setStatus('Your message was saved successfully.', 'success');
        if (submitBtn) submitBtn.textContent = 'Message Sent ✓';

        window.setTimeout(() => {
          setStatus('');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        }, 3000);
      } catch (error) {
        setStatus('Failed to save message. Please try again.', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  }

  /* ---- Smooth anchor scroll with offset ---- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 72;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

});
