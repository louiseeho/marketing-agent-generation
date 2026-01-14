## To-Do
- Create document on how generation works (or create a page for this)
- Host on AWS
- Move API calls to AWS Lambda functions
- Settings page
- Refactor codebase to reduce redundancy

Settings page:
AI Model Configuration
- **Max Response Length**: Limit how long agent replies can be.

Comment Processing
- **Comment Filters**:
  - Exclude short comments
  - Filter out profanity
- **Sampling Options**: Adjust sample weighting between original video and related videos.

### Automatic Mode Settings
- **Number of Related Videos**: Customizable (default 5).
- **Keyword Extraction Sensitivity**: Control how broad or narrow the related video selection is.

### Export/Import
- **Export Persona**: Save the generated persona as a `.json` file.
- **Import Persona**: Load previously saved personas.
- **Export Chat History**: Download a transcript of the full conversation.

### Persona Tweaking
- Modify the tone, interests, and focus areas of the generated persona based on user preferences.