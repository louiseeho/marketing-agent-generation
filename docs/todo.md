To-Do

- [] Create document of how generation works
- [ ] Host on AWS
- [ ] Move API calls to AWS Lambda functions
- [ ] Settings page


Settings page:
## Planned Settings and Customization Features

The following settings and customization options are planned for future development to improve user control, flexibility, and UX in the YouTube Agent Chat app:

### AI Model Configuration
- **Temperature Slider**: Adjust the randomness/creativity of responses (0.0–1.0).
- **Max Response Length**: Limit how long agent replies can be.
- **Model Selection**: Allow switching between Gemini models (e.g., Pro, Flash).

### Comment Processing
- **Number of Comments**: User-defined number of comments to analyze (default 100).
- **Comment Sorting Options**: Sort by relevance, top liked, or newest.
- **Comment Filters**:
  - Exclude short comments
  - Filter out profanity
- **Sampling Options**: Adjust sample weighting between original video and related videos.

### Automatic Mode Settings
- **Number of Related Videos**: Customizable (default 5).
- **Keyword Extraction Sensitivity**: Control how broad or narrow the related video selection is.

### Chat Experience
- **Response Style**: Choose between formal, casual, or emoji-heavy tones.
- **Conversation Memory**: Set how many previous messages the agent remembers.
- **Clear History**: Option to reset the chat session.

### UI Preferences
- **Theme**: Light or dark mode.
- **Font Size**: Adjust chat text size.
- **Sidebar Width**: Modify the width of the left input panel.

### Export/Import
- **Export Persona**: Save the generated persona as a `.json` file.
- **Import Persona**: Load previously saved personas.
- **Export Chat History**: Download a transcript of the full conversation.

### Persona Tweaking
- Modify the tone, interests, and focus areas of the generated persona based on user preferences.

---

These settings will be accessible through a dedicated **Settings Page** (gear icon, top-right) for cleaner UX and better scalability.