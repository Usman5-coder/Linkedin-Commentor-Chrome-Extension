# LinkedIn Gemini Commenter

A production-ready Chrome extension that generates professional LinkedIn comments using Google Gemini API.

## Features

- 🤖 AI-powered comment generation using Google Gemini
- 🔄 Regenerate option for different comment variations
- 🎨 Seamless integration with LinkedIn's UI
- 🔒 Secure local API key storage
- ⚡ Fast and responsive
- 📱 Mobile-friendly design

## Installation

### Prerequisites

- Google Chrome browser
- A Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Steps

1. **Download the extension**
   - Clone this repository or download as ZIP
   - Extract the files if downloaded as ZIP

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `linkedin-gemini-commenter` folder

3. **Configure API Key**
   - Click the extension icon in Chrome toolbar
   - Enter your Gemini API key
   - Click "Save API Key"

## Usage

1. Navigate to any LinkedIn post
2. Click on a comment box
3. You'll see two buttons appear:
   - **Generate Comment**: Creates a new AI-powered comment
   - **Regenerate**: Creates a different version of the comment
4. Click "Generate Comment" to create an AI response
5. The generated comment will be automatically inserted into the comment box
6. Edit as needed and post!

## How It Works

1. **Content Extraction**: The extension safely extracts the LinkedIn post's text content
2. **AI Generation**: Sends the content to Google Gemini API with a professional prompt
3. **Smart Insertion**: Uses modern InputEvent APIs to insert the comment naturally
4. **Dynamic Monitoring**: Watches for new comment boxes using MutationObserver

## Security

- API keys are stored locally using `chrome.storage.local`
- No data is sent to external servers except Google's Gemini API
- All processing happens client-side
- No tracking or analytics

## Technical Details

- **Manifest Version**: V3
- **Permissions**: `storage`, `activeTab`
- **Host Permissions**: LinkedIn and Gemini API
- **Storage**: Chrome Storage API (not localStorage)
- **DOM Manipulation**: Safe, non-destructive methods
- **Event Handling**: Modern InputEvent API

## File Structure

```
linkedin-gemini-commenter/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for API calls
├── content.js            # LinkedIn page interaction
├── popup/
│   ├── popup.html        # Settings UI
│   ├── popup.js          # Settings logic
│   └── popup.css         # Settings styling
└── styles/
    └── inject.css        # Injected button styles
```

## Troubleshooting

### Buttons not appearing
- Refresh the LinkedIn page
- Check if the extension is enabled in `chrome://extensions/`
- Make sure you're on linkedin.com

### "API key not configured" error
- Click the extension icon and enter your API key
- Verify the key starts with "AIzaSy"

### Comments not generating
- Check your internet connection
- Verify your API key is valid
- Check the Chrome DevTools console for errors

### Comments not inserting properly
- Try clicking the comment box again
- Refresh the page if the issue persists

## API Key Setup

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key
5. Paste it in the extension popup

## Limitations

- Requires a valid Google Gemini API key
- Subject to Gemini API rate limits
- Works only on linkedin.com
- Requires internet connection

## Privacy

This extension:
- ✅ Stores API keys locally only
- ✅ Only sends post content to Gemini API
- ✅ Does not collect or store user data
- ✅ Does not track usage
- ✅ Open source and auditable

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - feel free to use and modify as needed.

## Support

For issues or questions, please open an issue on the repository.

## Disclaimer

This extension is not affiliated with, endorsed by, or sponsored by LinkedIn or Google. Use at your own discretion and in accordance with LinkedIn's Terms of Service.
