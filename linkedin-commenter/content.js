const BUTTON_CONTAINER_CLASS = 'gemini-comment-buttons';
const PROCESSED_ATTR = 'data-gemini-processed';
const GENERATING_CLASS = 'gemini-generating';
const POPUP_CLASS = 'gemini-result-popup';

let apiKey = null;
let currentEditor = null;
let currentGeneratedComment = null;

chrome.storage.local.get(['geminiApiKey'], (result) => {
  apiKey = result.geminiApiKey || null;
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.geminiApiKey) {
    apiKey = changes.geminiApiKey.newValue || null;
  }
});

function findCommentEditors() {
  const selectors = [
    '.comments-comment-box__form .ql-editor',
    '.comments-comment-box-comment__text-editor .ql-editor',
    '.ql-editor[data-placeholder*="comment" i]',
    '.ql-editor[aria-label*="comment" i]',
    'div[role="textbox"][contenteditable="true"]'
  ];

  const editors = new Set();
  
  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(editor => {
      if (editor.isContentEditable && !editor.hasAttribute(PROCESSED_ATTR)) {
        editors.add(editor);
      }
    });
  });

  return Array.from(editors);
}

function injectButtons(editor) {
  if (editor.hasAttribute(PROCESSED_ATTR)) {
    return;
  }

  editor.setAttribute(PROCESSED_ATTR, 'true');

  const container = document.createElement('div');
  container.className = BUTTON_CONTAINER_CLASS;

  const generateBtn = document.createElement('button');
  generateBtn.className = 'gemini-btn gemini-btn-generate';
  generateBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 8v8m-4-4h8"/>
    </svg>
    <span>Generate Comment</span>
  `;
  generateBtn.title = 'Generate AI comment';

  const regenerateBtn = document.createElement('button');
  regenerateBtn.className = 'gemini-btn gemini-btn-regenerate';
  regenerateBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
    </svg>
    <span>Regenerate</span>
  `;
  regenerateBtn.title = 'Regenerate comment';
  regenerateBtn.style.display = 'none';

  container.appendChild(generateBtn);
  container.appendChild(regenerateBtn);

  let insertTarget = editor.parentElement;
  while (insertTarget && insertTarget !== document.body) {
    if (insertTarget.classList.contains('comments-comment-box__form') || 
        insertTarget.classList.contains('comments-comment-box-comment__text-editor') ||
        insertTarget.classList.contains('comments-comment-box')) {
      break;
    }
    insertTarget = insertTarget.parentElement;
  }

  if (insertTarget) {
    insertTarget.style.position = 'relative';
    insertTarget.appendChild(container);
  } else {
    editor.parentElement.style.position = 'relative';
    editor.parentElement.appendChild(container);
  }

  generateBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleGenerateClick(editor, generateBtn, regenerateBtn);
  });

  regenerateBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleGenerateClick(editor, generateBtn, regenerateBtn, true);
  });

  editor.addEventListener('focus', () => {
    container.style.display = 'flex';
  });
}

function showResultPopup(editor, comment, buttonContainer) {
  const existingPopup = document.querySelector(`.${POPUP_CLASS}`);
  if (existingPopup) {
    existingPopup.remove();
  }

  currentGeneratedComment = comment;

  const popup = document.createElement('div');
  popup.className = POPUP_CLASS;
  
  // Create popup structure
  const header = document.createElement('div');
  header.className = 'gemini-popup-header';
  header.innerHTML = `
    <span class="gemini-popup-title">Generated Comment</span>
    <button class="gemini-popup-close" title="Close">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  const content = document.createElement('div');
  content.className = 'gemini-popup-content';
  
  const textDiv = document.createElement('div');
  textDiv.className = 'gemini-popup-text';
  textDiv.textContent = comment; // Use textContent to preserve all text
  
  content.appendChild(textDiv);

  const actions = document.createElement('div');
  actions.className = 'gemini-popup-actions';
  actions.innerHTML = `
    <button class="gemini-popup-btn gemini-popup-btn-copy">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      Copy
    </button>
    <button class="gemini-popup-btn gemini-popup-btn-insert">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
      Insert to Comment
    </button>
  `;

  popup.appendChild(header);
  popup.appendChild(content);
  popup.appendChild(actions);

  let container = buttonContainer.parentElement;
  container.appendChild(popup);

  const closeBtn = popup.querySelector('.gemini-popup-close');
  const copyBtn = popup.querySelector('.gemini-popup-btn-copy');
  const insertBtn = popup.querySelector('.gemini-popup-btn-insert');

  closeBtn.addEventListener('click', () => {
    popup.remove();
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(comment);
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Copied!
      `;
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
      }, 2000);
    } catch (err) {
      showNotification(editor, 'Failed to copy to clipboard', 'error');
    }
  });

  insertBtn.addEventListener('click', () => {
    insertCommentToEditor(editor, comment);
    popup.remove();
    showNotification(editor, 'Comment inserted successfully!', 'success');
  });

  setTimeout(() => {
    popup.classList.add('gemini-popup-show');
  }, 10);
}

function insertCommentToEditor(editor, comment) {
  editor.focus();
  editor.innerHTML = '';
  
  const p = document.createElement('p');
  p.textContent = comment;
  editor.appendChild(p);

  const range = document.createRange();
  const sel = window.getSelection();
  
  try {
    range.selectNodeContents(editor);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  } catch (e) {
    console.error('Range selection error:', e);
  }

  editor.dispatchEvent(new Event('input', { bubbles: true }));
  editor.dispatchEvent(new Event('change', { bubbles: true }));
  
  setTimeout(() => {
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  }, 100);
}

async function handleGenerateClick(editor, generateBtn, regenerateBtn, isRegenerate = false) {
  if (!apiKey) {
    showNotification(editor, 'Please set your Gemini API key in the extension popup', 'error');
    return;
  }

  currentEditor = editor;
  const postText = extractPostText(editor);

  if (!postText) {
    showNotification(editor, 'Could not extract post content', 'error');
    return;
  }

  generateBtn.disabled = true;
  regenerateBtn.disabled = true;
  generateBtn.classList.add(GENERATING_CLASS);
  
  const originalText = isRegenerate ? 'Regenerate' : 'Generate Comment';
  const btnText = generateBtn.querySelector('span') || generateBtn;
  btnText.textContent = 'Generating...';

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'generateComment',
      postText: postText,
      apiKey: apiKey
    });

    if (response.success) {
      console.log('Comment received in content script:', response.comment);
      console.log('Comment length:', response.comment.length);
      const buttonContainer = generateBtn.parentElement;
      showResultPopup(editor, response.comment, buttonContainer);
      regenerateBtn.style.display = 'inline-flex';
    } else {
      showNotification(editor, response.error || 'Failed to generate comment', 'error');
    }
  } catch (error) {
    showNotification(editor, error.message || 'Failed to generate comment', 'error');
  } finally {
    generateBtn.disabled = false;
    regenerateBtn.disabled = false;
    generateBtn.classList.remove(GENERATING_CLASS);
    btnText.textContent = originalText;
  }
}

function extractPostText(editor) {
  let postElement = editor;
  let maxIterations = 15;
  let iterations = 0;

  while (postElement && iterations < maxIterations) {
    iterations++;
    
    const articleParent = postElement.closest('article, [data-urn], .feed-shared-update-v2');
    if (articleParent) {
      postElement = articleParent;
      break;
    }
    
    postElement = postElement.parentElement;
  }

  if (!postElement) {
    return null;
  }

  const textSelectors = [
    '.feed-shared-update-v2__description',
    '.feed-shared-text',
    '.break-words',
    '[data-urn] .break-words',
    '.feed-shared-update-v2__commentary',
    '.update-components-text'
  ];

  for (const selector of textSelectors) {
    const textElement = postElement.querySelector(selector);
    if (textElement) {
      const text = textElement.innerText || textElement.textContent;
      if (text && text.trim().length > 10) {
        return text.trim().slice(0, 2000);
      }
    }
  }

  const allText = postElement.innerText || postElement.textContent;
  return allText ? allText.trim().slice(0, 2000) : null;
}

function showNotification(editor, message, type = 'info') {
  const existingNotification = document.querySelector('.gemini-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = `gemini-notification gemini-notification-${type}`;
  notification.textContent = message;

  let container = editor.closest('.comments-comment-box__form') || 
                  editor.closest('.comments-comment-box-comment__text-editor') ||
                  editor.parentElement;

  if (container) {
    container.style.position = 'relative';
    container.appendChild(notification);
  } else {
    document.body.appendChild(notification);
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '10001';
  }

  setTimeout(() => {
    notification.classList.add('gemini-notification-show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('gemini-notification-show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function initializeExtension() {
  const editors = findCommentEditors();
  editors.forEach(editor => injectButtons(editor));
}

const observer = new MutationObserver((mutations) => {
  let shouldCheck = false;

  for (const mutation of mutations) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.classList?.contains('comments-comment-box') ||
              node.classList?.contains('ql-editor') ||
              node.querySelector?.('.ql-editor, [contenteditable="true"]')) {
            shouldCheck = true;
          }
        }
      });
    }
  }

  if (shouldCheck) {
    setTimeout(initializeExtension, 100);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}

setTimeout(initializeExtension, 1000);
setInterval(initializeExtension, 3000);
