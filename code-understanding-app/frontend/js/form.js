(function(){
  const form = document.getElementById('contactForm');
  if (!form) return;

  const status = document.getElementById('formStatus');

  function setError(field, message){
    const group = field.closest('.form-field');
    if(!group) return;
    group.classList.add('has-error');
    const err = group.querySelector('.field-error');
    if (err) err.textContent = message || '';
  }

  function clearError(field){
    const group = field.closest('.form-field');
    if(!group) return;
    group.classList.remove('has-error');
    const err = group.querySelector('.field-error');
    if (err) err.textContent = '';
  }

  function validateEmail(value){
    return /.+@.+\..+/.test(value);
  }

  function validate(){
    let valid = true;
    const name = form.elements['name'];
    const email = form.elements['email'];
    const subject = form.elements['subject'];
    const message = form.elements['message'];

    [name, email, subject, message].forEach(clearError);

    if (!name.value.trim()) { setError(name, 'Please enter your name'); valid = false; }
    if (!email.value.trim()) { setError(email, 'Please enter your email'); valid = false; }
    else if(!validateEmail(email.value.trim())) { setError(email, 'Please enter a valid email'); valid = false; }
    if (!subject.value.trim()) { setError(subject, 'Please enter a subject'); valid = false; }
    if (!message.value.trim()) { setError(message, 'Please enter a message'); valid = false; }

    return valid;
  }

  form.addEventListener('input', (e)=>{
    const t = e.target;
    if (t.matches('input, textarea')) {
      if (t.value.trim()) clearError(t);
    }
  });

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    status.textContent = '';

    if (!validate()) {
      status.className = 'form-status error';
      status.textContent = 'Please correct the highlighted fields.';
      return;
    }

    // Simulate async submission
    const submitBtn = form.querySelector('button[type="submit"]');
    const original = submitBtn.innerHTML;
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;

    try {
      await new Promise(res => setTimeout(res, 900));
      status.className = 'form-status success';
      status.textContent = 'Thanks! Your message has been sent.';
      form.reset();
    } catch (err) {
      status.className = 'form-status error';
      status.textContent = 'Sorry, something went wrong. Please try again.';
    } finally {
      submitBtn.classList.remove('btn-loading');
      submitBtn.disabled = false;
      submitBtn.innerHTML = original;
    }
  });
})();
