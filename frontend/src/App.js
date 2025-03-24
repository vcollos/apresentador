import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Dropzone from 'react-dropzone';
import axios from 'axios';
import './App.css';

// Configuração necessária para react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// URL do backend
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState({ text: '', audioPath: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [presentationStatus, setPresentationStatus] = useState('idle'); // idle, narrating, paused, responding
  
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);

  // Inicializar reconhecimento de voz
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR'; // Idioma do reconhecimento

      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            processVoiceCommand(transcript);
          } else {
            interimTranscript += transcript;
          }
        }
        setTranscript(interimTranscript);
      };

      recognition.onend = () => {
        if (isListening) {
          recognition.start();
        }
      };

      recognitionRef.current = recognition;
    } else {
      alert('Seu navegador não suporta reconhecimento de voz. Tente usar o Chrome.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  // Processar comando de voz
  const processVoiceCommand = async (command) => {
    // Comandos especiais
    if (command.toLowerCase().includes('só um minuto') && command.toLowerCase().includes('gpt')) {
      setIsPaused(true);
      setPresentationStatus('paused');
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    if (command.toLowerCase().includes('pode continuar') && command.toLowerCase().includes('gpt')) {
      setIsPaused(false);
      setPresentationStatus('narrating');
      if (audioRef.current) {
        audioRef.current.play();
      }
      return;
    }

    // Se o comando não for especial, enviar para processamento no backend
    try {
      setIsLoading(true);
      setPresentationStatus('responding');
      
      const response = await axios.post(`${API_URL}/process_audio`, {
        command: command
      });
      
      setResponse({
        text: response.data.text,
        audioPath: response.data.audio_path
      });
      
      // Reproduzir áudio da resposta
      if (audioRef.current) {
        audioRef.current.src = `${API_URL}/get_audio/${response.data.audio_path}`;
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Erro ao processar comando de voz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Alternar reconhecimento de voz
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

  // Lidar com upload de arquivo
  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      
      // Enviar PDF para o backend
      const formData = new FormData();
      formData.append('file', acceptedFiles[0]);
      
      try {
        const response = await axios.post(`${API_URL}/upload_pdf`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        console.log('PDF processado:', response.data);
      } catch (error) {
        console.error('Erro ao enviar PDF:', error);
      }
    }
  };

  // Carregar documento PDF
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  // Alterar página
  const changePage = (offset) => {
    const newPage = pageNumber + offset;
    if (newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);
      narrateCurrentSlide(newPage);
    }
  };

  // Narrar slide atual
  const narrateCurrentSlide = async (slideNumber) => {
    try {
      setIsLoading(true);
      setPresentationStatus('narrating');
      
      const response = await axios.get(`${API_URL}/narrate_slide?slide=${slideNumber - 1}`);
      
      setResponse({
        text: response.data.text,
        audioPath: response.data.audio_path
      });
      
      // Reproduzir áudio da narração
      if (audioRef.current) {
        audioRef.current.src = `${API_URL}/get_audio/${response.data.audio_path}`;
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Erro ao narrar slide:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Quando o áudio terminar de tocar
  const handleAudioEnded = () => {
    if (presentationStatus === 'narrating' && !isPaused) {
      // Avançar automaticamente para o próximo slide se estiver narrando
      changePage(1);
    } else {
      setPresentationStatus('idle');
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Assistente de Apresentação com Voz</h1>
      </header>
      
      <main>
        <div className="controls">
          <button 
            onClick={toggleListening} 
            className={`mic-button ${isListening ? 'active' : ''}`}
          >
            {isListening ? 'Parar Microfone' : 'Iniciar Microfone'}
          </button>
          
          <div className="status-indicator">
            Status: {presentationStatus === 'idle' ? 'Pronto' : 
                   presentationStatus === 'narrating' ? 'Narrando' :
                   presentationStatus === 'paused' ? 'Pausado' : 'Respondendo'}
          </div>
        </div>
        
        {!file ? (
          <Dropzone onDrop={onDrop} accept={{'application/pdf': ['.pdf']}}>
            {({getRootProps, getInputProps}) => (
              <div {...getRootProps()} className="dropzone">
                <input {...getInputProps()} />
                <p>Arraste e solte um arquivo PDF aqui, ou clique para selecionar</p>
              </div>
            )}
          </Dropzone>
        ) : (
          <div className="presentation-container">
            <div className="pdf-viewer">
              <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
                <Page pageNumber={pageNumber} />
              </Document>
              <p>
                Página {pageNumber} de {numPages}
              </p>
              <div className="page-controls">
                <button onClick={() => changePage(-1)} disabled={pageNumber <= 1}>
                  Anterior
                </button>
                <button onClick={() => narrateCurrentSlide(pageNumber)}>
                  Narrar Slide
                </button>
                <button onClick={() => changePage(1)} disabled={pageNumber >= numPages}>
                  Próximo
                </button>
              </div>
            </div>
            
            <div className="transcript-container">
              <div className="response-box">
                <h3>Narração/Resposta:</h3>
                <p>{response.text}</p>
              </div>
              
              <div className="voice-input">
                <h3>Comando de Voz:</h3>
                <p>{transcript}</p>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <audio 
        ref={audioRef} 
        onEnded={handleAudioEnded} 
        style={{ display: 'none' }} 
        controls
      />
      
      <footer>
        <p>Assistente de Apresentação com Voz • ChatGPT + ElevenLabs + Flask + React</p>
      </footer>
    </div>
  );
}

export default App;