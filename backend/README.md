# 📝 Handwritten Text Transcriber & OCR Tool

An AI-powered web application that converts handwritten notes, documents, and images into clean, formatted digital text. Powered by **FastAPI**, **Google Gemini Vision AI**, and **React**, this tool allows you to transcribe images/PDFs and export them directly to **.docx** or **.pdf** files.

---

## ✨ Features

- **⚡ Fast AI Transcription:** Utilizes Google's `gemini-3.6-flash` vision model to transcribe cursive and messy handwriting accurately.
- **📄 Multi-Format Support:** Upload single/multiple image files (`.png`, `.jpg`, `.jpeg`) or multi-page PDF documents.
- **🧹 Automatic Text Cleaning:** Integrated regex filters automatically strip AI conversational filler (`"Here is the text..."`) and reasoning blocks (`<think>...</think>`), delivering raw, ready-to-use text.
- **💾 Easy Exporting:** Export your transcribed notes to Microsoft Word (`.docx`) or PDF (`.pdf`) format with a single click.
- **🔒 Privacy First:** Zero image retention—processed transiently in memory.

---

## 🛠️ Tech Stack

### **Backend**
- **Framework:** Python / FastAPI
- **AI Model:** Google Gemini API (`google-genai`)
- **Document Processing:** `python-docx`, `FPDF`, `pdf2image`, `Pillow`
- **ASGI Server:** Uvicorn

### **Frontend**
- **Framework:** React.js (Vite)
- **HTTP Client:** Fetch API with Blob streaming

---

## 🚀 Local Development Setup

### **Prerequisites**
- Python 3.10+
- Node.js 18+
- [Google AI Studio API Key](https://aistudio.google.com/) (Free)

### **1. Backend Setup**
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: .\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Create environment file
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env

# Run FastAPI backend server
uvicorn main:app --reload --port 8000