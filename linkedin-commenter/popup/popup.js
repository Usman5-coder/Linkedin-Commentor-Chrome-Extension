const apiKeyInput = document.getElementById('apiKey');
const apiKeyForm = document.getElementById('apiKeyForm');
const saveBtn = document.getElementById('saveBtn');
const statusDiv = document.getElementById('status');
const toggleVisibilityBtn = document.getElementById('toggleVisibility');

chrome.storage.local.get(['geminiApiKey'], (result) => {
  if (result.geminiApiKey) {
    apiKeyInput.value = result.geminiApiKey;
  }
});

toggleVisibilityBtn.addEventListener('click', () => {
  const isPassword = apiKeyInput.type === 'password';
  apiKeyInput.type = isPassword ? 'text' : 'password';
  
  const svg = toggleVisibilityBtn.querySelector('svg');
  if (isPassword) {
    svg.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    `;
  } else {
    svg.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    `;
  }
});

apiKeyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    showStatus('Please enter an API key', 'error');
    return;
  }

  if (!apiKey.startsWith('AIzaSy')) {
    showStatus('Invalid API key format. Gemini API keys start with "AIzaSy"', 'error');
    return;
  }

  saveBtn.disabled = true;
  const btnText = saveBtn.querySelector('span');
  const originalText = btnText.textContent;
  btnText.textContent = 'Saving...';

  try {
    await chrome.storage.local.set({ geminiApiKey: apiKey });
    
    showStatus('API key saved successfully!', 'success');
    
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 3000);
  } catch (error) {
    showStatus('Failed to save API key', 'error');
  } finally {
    saveBtn.disabled = false;
    btnText.textContent = originalText;
  }
});

function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status status-${type} status-show`;
  
  setTimeout(() => {
    statusDiv.classList.remove('status-show');
  }, 3000);
}

apiKeyInput.addEventListener('input', () => {
  if (statusDiv.classList.contains('status-error')) {
    statusDiv.textContent = '';
    statusDiv.className = 'status';
  }
});
