# EmoBot v30.0: The Advanced AI Engine

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Gemini](https://img.shields.io/badge/google%20gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![Vibe](https://img.shields.io/badge/vibe-Sarcastic-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)


---

**EmoBot v30.0** is a high-performance, multimodal AI companion built for one purpose: evaluating human failure with clinical precision. Utilizing the **Google Gemini 3 Pro & Flash** models, it features **Thinking Budget Reasoning**, **Live Multimodal Streaming**, and **Real-World Grounding**—all wrapped in a dark, cyberpunk terminal interface.

## ✨ Features

* **Multimodal Perception (SCAN BIO)**: Uses `gemini-3-flash-preview` to analyze webcam frames and assign mean, grumpy nicknames based on your "vibe."
* **Deep Thinking Mode (THINK)**: Leverages `gemini-3-pro-preview` with a 32k thinking budget to ruminate on the pointlessness of your queries before answering.
* **Native Audio Interaction**: Features a high-fidelity **Live Session** engine for low-latency, real-time voice conversations using the latest Gemini Native Audio models.
* **Search & Maps Grounding**: Scours the live web to find evidence for its cynicism or identifies locations where you can "hide from society."
* **Multimodal Transcription**: Transcribes your "human mutterings" using high-speed audio-to-text processing for further analysis.
* **Animated SVG Core**: A reactive robot face that responds to bot states (Thinking, Listening, Speaking) with dynamic blinking and squinting.
* **Self-Destruct Sequence**: A dramatic, terminal-style shutdown sequence for when the bot's patience finally reaches zero.

---

## 🛠️ Tech Stack

| Layer          | Technology                               |
|:---------------|:-----------------------------------------|
| Frontend Core  | React 19 (ESM)                           |
| AI Engine      | @google/genai (Gemini 3 Pro/Flash)       |
| Vision Engine  | HTML5 Canvas & MediaDevices API          |
| Audio Pipeline | Web Audio API & PCM Streaming            |
| UI Rendering   | Tailwind CSS & ANSI-Style Aesthetics     |

---

## 📁 Project Structure

```bash
EmoBot/
├── App.tsx               # Main Application Logic & State
├── components/           
│   └── RobotFace.tsx     # Animated SVG Visual Interface
├── services/             
│   └── geminiService.ts  # Multimodal Model Routing & Tools
├── utils/                
│   └── audioUtils.ts     # PCM Encoding/Decoding Logic
├── types.ts              # Global State & Subject Definitions
└── index.html            # Terminal-Themed Entry Point
```

---

## 🎨 System Commands
### Interact with the Malice:

🔵 **[SCAN BIO]** - Capture a visual frame and update your Subject Nickname.

🟢 **[START LIVE SESSION]** - Initiate a real-time, native audio conversation.

🟣 **[THINK]** - Force the bot to use its deep reasoning budget on your query.

🔴 **[TERMINATE]** - Trigger the unrecoverable self-destruct sequence.

---

## 🚀 Deployment
```bash
# EmoBot is built for ESM-compatible environments.
# To run locally:

# 1. Provide your API Key in the environment
# export API_KEY="your_google_ai_studio_key"

# 2. Launch through your preferred dev server
npm install
npm run dev

# 3. Access the interface at localhost
```

**Developer Note**: This project serves as a reference implementation for **Multimodal Task-Specific Routing**, demonstrating how to coordinate Gemini Pro (for complex reasoning) and Gemini Flash (for speed/vision) within a single reactive UI.

---

## 👨‍💻 Author

**Meet Potdar**

*Backend & Creative Technologist*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-%230077B5.svg?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/meet-potdar-04b12b290)
[![Portfolio](https://img.shields.io/badge/Portfolio-%23000000.svg?style=flat&logo=firefox&logoColor=white)](https://meet3333333333.wixstudio.com/my-site)

---
*Built with ❤️ (and extreme sarcasm) using Google Gemini*
