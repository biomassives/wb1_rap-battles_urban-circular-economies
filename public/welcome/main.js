function openJoin() {
  document.querySelector('#name').focus();
}

async function submitJoin() {
  const btn = document.getElementById('submitBtn');
  const status = document.getElementById('status');

  const payload = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    interest: document.getElementById('interest').value,
  };

  if (!payload.email) {
    status.textContent = "Email helps us connect the dots.";
    return;
  }

  btn.disabled = true;
  status.textContent = "Connecting…";

  try {
    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    status.textContent = data.message || "Welcome aboard.";
  } catch (e) {
    status.textContent = "Something went wrong. Try again soon.";
  }

  btn.disabled = false;
}

