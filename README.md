# Lead Generation App - AI-Powered M&A Strategic Matching Tool

An intelligent mergers and acquisitions tool that leverages AI to analyze strategic fit between buyer companies and potential acquisition targets. Built with React and powered by Llama3 through Ollama for advanced batch processing and analysis.

## 🚀 Features

- **AI-Powered Analysis**: Uses Llama3 via Ollama for intelligent strategic fit scoring
- **Strategic Profiling**: Comprehensive buyer profile configuration
- **Smart Scoring**: 0-100 scoring system with detailed reasoning
- **Company Management**: Add, edit, and manage target companies

## 🛠️ Tech Stack

- **Frontend**: React 19 with Hooks
- **Styling**: Tailwind CSS 3.4
- **Icons**: Lucide React 0.525
- **AI Engine**: Llama3 via Ollama
- **State Management**: React useState/useMemo
- **HTTP Client**: Fetch API
- **Build Tool**: React Scripts 5.0
- **Testing**: Jest + React Testing Library

## 📋 Prerequisites

Before running this application, ensure you have:

1. **Node.js** (v16 or higher)
2. **npm** or **yarn** package manager
3. **Ollama** installed and running
4. **Llama3 model** downloaded

### System Requirements

- **React**: 19.1.0
- **Node.js**: v16+ (recommended v18+)
- **Memory**: 4GB+ RAM (for AI processing)
- **Storage**: 4GB+ free space (for Llama3 model)

### Installing Ollama and Llama3

1. **Install Ollama**:
   ```bash
   # macOS
   brew install ollama
   
   # Or download from https://ollama.ai
   ```

2. **Pull Llama3 model**:
   ```bash
   ollama pull llama3
   ```

3. **Start Ollama server**:
   ```bash
   ollama serve
   ```

The application expects Ollama to be running on `http://localhost:11434`.

## 🚀 Getting Started

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd lead-generation-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Build for production:
```bash
npm run build
```

## 📖 Usage

### 1. Configure Your Company Profile

Fill out the buyer profile section with:
- **Company Name**: Your company's name
- **Description**: Business overview and current operations
- **Key Strengths**: Competitive advantages and core capabilities
- **Strategic Gaps**: Areas needing improvement or expansion
- **Strategic Goals**: Key objectives and growth targets
- **Budget Range**: Available acquisition budget
- **Timeframe**: Expected acquisition timeline

### 2. Add Target Companies

Click "Add Company" to add potential acquisition targets with:
- Basic information (name, industry, location)
- Financial metrics (revenue, employees, growth rate)
- Key performance indicators
- Company description

### 3. Run AI Analysis

Click "Run Fast Batch Analysis" to:
- Analyze strategic fit using Llama3
- Generate 0-100 strategic fit scores
- Identify key synergies and risks
- Assess integration complexity
- Estimate time to value

### 4. Review Results

The tool provides:
- **Ranked Results**: Companies sorted by strategic fit score
- **Detailed Analysis**: AI-generated reasoning for each score
- **Synergy Identification**: Key areas of strategic alignment
- **Risk Assessment**: Potential integration challenges
- **Strategic Metrics**: Integration complexity and time estimates

## 🔧 Configuration

### Ollama Configuration

The application connects to Ollama at `http://localhost:11434` by default. To modify this:

1. Update the API endpoint in `lead_complementing.js`:
   ```javascript
   const response = await fetch('http://your-ollama-url:port/api/generate', {
   ```

### Analysis Parameters

Fine-tune the AI analysis by modifying these parameters in the `performLlamaAnalysis` function:

```javascript
options: {
  temperature: 0.5,    // Creativity vs consistency (0.0-1.0)
  top_p: 0.8,         // Token selection diversity
  max_tokens: 2000,   // Maximum response length
  repeat_penalty: 1.1  // Repetition avoidance
}
```

## 🏗️ Project Structure

```
```
src/
├── App.js                    # Main application component
├── lead_complementing.js     # Core M&A analysis component
├── index.js                  # React app entry point
├── index.css                 # Global styles
├── reportWebVitals.js        # Performance monitoring
├── setupTests.js             # Test configuration
└── Data/
    └── syntheticAcquisitionData.js  # Initial company data





## 📦 Dependencies

### Core Dependencies
- `react`: ^19.1.0 - Core React library
- `react-dom`: ^19.1.0 - React DOM rendering
- `lucide-react`: ^0.525.0 - Icon library
- `react-scripts`: 5.0.1 - Build toolchain

### Development Dependencies
- `tailwindcss`: ^3.4.17 - Utility-first CSS framework
- `@tailwindcss/postcss`: ^4.1.11 - PostCSS plugin
- `autoprefixer`: ^10.4.21 - CSS vendor prefixing
- `tailwind-merge`: ^3.3.1 - Utility merging
- `tailwindcss-animate`: ^1.0.7 - Animation utilities

### Testing Dependencies
- `@testing-library/react`: ^16.3.0 - React testing utilities
- `@testing-library/jest-dom`: ^6.6.3 - Jest DOM matchers
- `@testing-library/user-event`: ^13.5.0 - User event simulation

## 🎯 Key Components

## 📊 Scoring System

The AI generates scores based on:
- **Strategic Alignment** (0-30 points): Gap filling and goal alignment
- **Market Synergies** (0-25 points): Market expansion opportunities
- **Operational Fit** (0-25 points): Integration complexity and cultural fit
- **Financial Viability** (0-20 points): Budget alignment and value potential

### Score Categories

- **80-100**: Excellent Strategic Fit
- **60-79**: Good Strategic Fit
- **40-59**: Moderate Fit
- **0-39**: Limited Strategic Value

## 🔍 Troubleshooting

### Common Issues

1. **"Cannot connect to Ollama"**
   - Ensure Ollama is running: `ollama serve`
   - Check if Llama3 is installed: `ollama list`
   - Verify the API endpoint is correct

2. **"Analysis failed"**
   - Check Ollama logs for errors
   - Ensure sufficient system resources
   - Try reducing batch size for large datasets

3. **Slow Analysis**
   - Reduce the number of companies per batch
   - Check system resources (CPU/Memory)
   - Consider using a lighter model for testing

### Performance Optimization

- **Batch Size**: Automatically adjusts based on dataset size
- **Parallel Processing**: Uses parallel requests for individual analysis
- **Memory Management**: Efficient state management with React hooks
- **Progress Tracking**: Real-time feedback during long-running analyses

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai) for the local LLM infrastructure
- [Llama3](https://llama.meta.com) for the AI analysis capabilities
- [Lucide React](https://lucide.dev) for the beautiful icons
- [Tailwind CSS](https://tailwindcss.com) for the styling system

## 📧 Support

For questions or support, please open an issue in the repository or contact the development team.

---

**Note**: This tool is designed for strategic analysis and should be used in conjunction with professional M&A advisory services. AI-generated insights should be validated with comprehensive due diligence.