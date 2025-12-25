chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn Gemini Commenter installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateComment') {
    handleGenerateComment(request.postText, request.apiKey)
      .then(comment => sendResponse({ success: true, comment }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function handleGenerateComment(postText, apiKey) {
  if (!apiKey) {
    throw new Error('API key not configured. Please set your Gemini API key in the extension popup.');
  }

  const prompt = `You are a LinkedIn professional. Generate a thoughtful, professional, and concise comment (2-3 sentences maximum) in response to this LinkedIn post. The comment should be engaging, add value to the conversation, and sound natural. Do not use hashtags unless absolutely necessary. Do not be overly formal or robotic.

Post content:
${postText}

Generate only the comment text, nothing else:`;

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
  }

  const data = await response.json();
  
  console.log('Gemini API Response:', data);
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid response from Gemini API');
  }

  const comment = data.candidates[0].content.parts[0].text.trim();
  
  console.log('Generated comment length:', comment.length);
  console.log('Generated comment:', comment);
  
  return comment;
}
