import os
import io
import re
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from google import genai
from docx import Document
from fpdf import FPDF
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Handwriting Transcriber API (Gemini)")

# Enable CORS and expose headers so the browser can download files properly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Initialize Google Gemini Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class ExportRequest(BaseModel):
    text: str
    format: str  # "docx" or "pdf"

def clean_transcription_text(text: str) -> str:
    """Strips out model thinking blocks (<think>...</think>) and conversational preambles."""
    if not text:
        return ""
    
    # 1. Remove <think>...</think> blocks including unclosed <think> tags
    cleaned = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL | re.IGNORECASE)
    cleaned = re.sub(r'<think>.*$', '', cleaned, flags=re.DOTALL | re.IGNORECASE)
    
    # 2. Split lines and filter out introductory fluff
    lines = cleaned.strip().split("\n")
    filtered_lines = []
    skip_intro = True
    
    for line in lines:
        line_str = line.strip()
        if skip_intro:
            lower = line_str.lower()
            if (
                lower.startswith("here is") or 
                lower.startswith("here's") or 
                lower.startswith("the handwritten text") or 
                lower.startswith("transcription:") or 
                not line_str
            ):
                continue
            else:
                skip_intro = False
        filtered_lines.append(line)
        
    result = "\n".join(filtered_lines).strip()
    return result if result else cleaned.strip()

@app.post("/api/transcribe")
async def transcribe_handwriting(file: UploadFile = File(...)):
    contents = await file.read()
    
    try:
        image = Image.open(io.BytesIO(contents))
        
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=[
                image,
                "Transcribe all handwritten text in this image accurately. "
                "CRITICAL INSTRUCTION: Output ONLY the raw transcribed text. "
                "Do NOT include thinking blocks, conversational introductions, or greetings."
            ]
        )
        
        raw_text = response.text if response.text else ""
        cleaned_text = clean_transcription_text(raw_text)
        
        return {"text": cleaned_text}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Transcription failed: {str(e)}")

@app.post("/api/export")
async def export_document(data: ExportRequest):
    # Sanitize text before exporting
    cleaned_text = clean_transcription_text(data.text)

    if data.format == "docx":
        doc = Document()
        doc.add_heading("Transcribed Document", level=1)
        for line in cleaned_text.split("\n"):
            if line.strip():
                doc.add_paragraph(line)
        
        file_stream = io.BytesIO()
        doc.save(file_stream)
        file_stream.seek(0)
        
        return StreamingResponse(
            file_stream,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": "attachment; filename=transcription.docx"}
        )

    elif data.format == "pdf":
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Helvetica", size=12)
        for line in cleaned_text.split("\n"):
            pdf.multi_cell(0, 8, txt=line.encode('latin-1', 'replace').decode('latin-1'))
            pdf.ln(1)
            
        pdf_bytes = pdf.output()
        file_stream = io.BytesIO(pdf_bytes)
        
        return StreamingResponse(
            file_stream,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=transcription.pdf"}
        )

    raise HTTPException(status_code=400, detail="Invalid format selected")