from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import openai
import elevenlabs
import os
import tempfile
import PyPDF2
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

app = Flask(__name__)
CORS(app)

# Chaves das APIs
openai.api_key = os.environ.get("OPENAI_API_KEY")
elevenlabs.set_api_key(os.environ.get("ELEVENLABS_API_KEY"))

# Armazenamento temporário para conteúdo de slides
presentation_content = []
current_slide = 0

@app.route('/upload_pdf', methods=['POST'])
def upload_pdf():
    global presentation_content
    
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and file.filename.endswith('.pdf'):
        # Salvar arquivo temporariamente
        temp_file = tempfile.NamedTemporaryFile(delete=False)
        file.save(temp_file.name)
        
        # Extrair texto do PDF
        presentation_content = []
        pdf_reader = PyPDF2.PdfReader(temp_file.name)
        
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            presentation_content.append(page.extract_text())
            
        os.unlink(temp_file.name)  # Remover arquivo temporário
        
        return jsonify({
            "status": "success", 
            "slides_count": len(presentation_content),
            "content_preview": presentation_content[0][:100] + "..." if presentation_content else ""
        })
    
    return jsonify({"error": "File must be a PDF"}), 400

@app.route('/narrate_slide', methods=['GET'])
def narrate_slide():
    global current_slide, presentation_content
    
    slide_num = request.args.get('slide', type=int)
    
    if slide_num is not None and 0 <= slide_num < len(presentation_content):
        current_slide = slide_num
    else:
        slide_num = current_slide
        
    if not presentation_content or slide_num >= len(presentation_content):
        return jsonify({"error": "Invalid slide number or no presentation loaded"}), 400
    
    # Gerar uma narração otimizada para o slide atual
    prompt = f"""
    Você é um assistente de apresentação profissional. 
    Crie uma narração clara e concisa para o seguinte conteúdo de slide:
    
    {presentation_content[slide_num]}
    
    Mantenha a narração natural e engajante, como se estivesse apresentando para uma audiência.
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
    )
    
    text_response = response['choices'][0]['message']['content']
    
    # Gerar áudio da narração
    audio = elevenlabs.generate(text=text_response, voice="Adam")
    
    # Salvar áudio temporariamente
    temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
    temp_audio.write(audio)
    temp_audio.close()
    
    # Retornar informações e caminho para o áudio
    return jsonify({
        "slide_number": slide_num,
        "text": text_response,
        "audio_path": temp_audio.name
    })

@app.route('/get_audio/<path:filename>', methods=['GET'])
def get_audio(filename):
    # Enviar o arquivo de áudio
    return send_file(filename, mimetype='audio/mpeg')

@app.route('/process_audio', methods=['POST'])
def process_audio():
    data = request.get_json()
    command = data.get('command', '').lower()
    
    # Comandos especiais
    if "só um minuto" in command and "gpt" in command:
        return jsonify({"status": "paused"})
    
    if "pode continuar" in command and "gpt" in command:
        return jsonify({"status": "resumed"})
    
    # Contexto da apresentação para o GPT
    context = ""
    if presentation_content and 0 <= current_slide < len(presentation_content):
        context = f"Contexto atual do slide: {presentation_content[current_slide]}"
    
    # Processar comando com GPT
    prompt = f"""
    Você é um assistente de apresentação. Responda à seguinte pergunta ou comando durante a apresentação:
    
    {command}
    
    {context}
    
    Seja conciso e direto, como se estivesse respondendo durante uma apresentação ao vivo.
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
    )
    
    text_response = response['choices'][0]['message']['content']
    
    # Gerar áudio da resposta
    audio = elevenlabs.generate(text=text_response, voice="Adam")
    
    # Salvar áudio temporariamente
    temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
    temp_audio.write(audio)
    temp_audio.close()
    
    return jsonify({
        "status": "response",
        "text": text_response,
        "audio_path": temp_audio.name
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=os.environ.get("FLASK_DEBUG", "False").lower() == "true")