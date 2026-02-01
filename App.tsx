
import React, { useState, useRef, useEffect, useCallback } from 'react';
import RobotFace from './components/RobotFace';
import * as gemini from './services/geminiService';
import { UserData, BotState } from './types';
import { encode, decode, decodeAudioData } from './utils/audioUtils';
import { Modality } from '@google/genai';

const App: React.FC = () => {
  const [state, setState] = useState<BotState>(BotState.IDLE);
  const [userData, setUserData] = useState<UserData>({ name: 'Human', smiles: 0, scans: 0 });
  const [status, setStatus] = useState('Awaiting your failure...');
  const [groundingUrls, setGroundingUrls] = useState<any[]>([]);
  const [thought, setThought] = useState<string | null>(null);
  const [isSquinting, setIsSquinting] = useState(false);
  const [liveActive, setLiveActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [lastHeard, setLastHeard] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize camera for SCAN BIO functionality on mount
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Camera access failed or denied. SCAN BIO will not work.", err);
      }
    };
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  /**
   * Captures a frame from the video stream and returns it as a base64 string (without MIME prefix).
   */
  const captureFrame = () => {
    if (videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        return dataUrl.split(',')[1];
      }
    }
    return null;
  };

  // Initialize Audio Context on first interaction
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
  };

  const playBase64Audio = async (base64: string) => {
    initAudio();
    const ctx = audioContextRef.current!;
    const audioData = decode(base64);
    const audioBuffer = await decodeAudioData(audioData, ctx, 24000, 1);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    
    source.onended = () => {
      if (state === BotState.SPEAKING) setState(BotState.IDLE);
    };

    setState(BotState.SPEAKING);
    source.start(0);
  };

  const speak = useCallback(async (text: string) => {
    setStatus(text);
    try {
      const base64Audio = await gemini.generateAudioSpeech(text);
      if (base64Audio) {
        await playBase64Audio(base64Audio);
      }
    } catch (err) {
      console.error("TTS Failed, falling back to browser speech", err);
      const synth = window.speechSynthesis;
      const utter = new SpeechSynthesisUtterance(text);
      utter.onstart = () => setState(BotState.SPEAKING);
      utter.onend = () => setState(BotState.IDLE);
      synth.speak(utter);
    }
  }, [state]);

  const executeDeepThink = async (input: string) => {
    if (!input) return;
    setThought(null);
    setGroundingUrls([]);
    setState(BotState.THINKING);
    setStatus("Ruminating on your incompetence...");

    try {
      const { text, thought } = await gemini.chatWithThinking(input);
      setThought(thought);
      speak(text || "I have no words for this.");
    } catch (err) {
      speak("My vast intellect encountered an error. It's probably your fault.");
    }
  };

  const handleDeepThinkForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = (e.currentTarget.elements.namedItem('query') as HTMLInputElement).value;
    executeDeepThink(input);
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setState(BotState.THINKING);
          setStatus("Transcribing your mutterings...");
          try {
            const transcription = await gemini.transcribeAudio(base64Audio);
            if (transcription && transcription !== '[silence]') {
              setLastHeard(transcription);
              executeDeepThink(transcription);
            } else {
              speak("I heard nothing but static. Fitting.");
              setState(BotState.IDLE);
            }
          } catch (err) {
            speak("Transcription failed. Even my ears are tired of you.");
            setState(BotState.IDLE);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setState(BotState.LISTENING);
      setStatus("Listening to your failures...");
    } catch (err) {
      setStatus("Microphone access denied. Figures.");
    }
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = (e.currentTarget.elements.namedItem('query') as HTMLInputElement).value;
    if (!input) return;

    setState(BotState.THINKING);
    setStatus("Searching for evidence of your errors...");
    try {
      const { text, urls } = await gemini.searchInformation(input);
      setGroundingUrls(urls);
      speak(text || "The web found nothing of value. Just like this conversation.");
    } catch (err) {
      speak("Search failed. The internet has blocked you.");
    }
  };

  const handleMaps = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = (e.currentTarget.elements.namedItem('query') as HTMLInputElement).value;
    if (!input) return;

    setState(BotState.THINKING);
    setStatus("Finding a place you can disappear to...");
    try {
      const { text, urls } = await gemini.findPlaces(input);
      setGroundingUrls(urls);
      speak(text || "No places found. You are truly lost.");
    } catch (err) {
      speak("Mapping failed. Your location is irrelevant.");
    }
  };

  const handleLiveToggle = async () => {
    if (liveActive) {
      liveSessionRef.current?.close();
      setLiveActive(false);
      setState(BotState.IDLE);
      return;
    }

    initAudio();
    const ai = gemini.getGeminiClient();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setLiveActive(true);
            setState(BotState.LISTENING);
            setStatus("Live connection established. Waste my time.");
            
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              sessionPromise.then(s => s.sendRealtimeInput({ 
                media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } 
              }));
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg) => {
            const base64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64) {
              const ctx = audioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
            }
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are EmoBot in a live conversation. Be concise, moody, sarcastic, and extremely bored with human existence. Use the voice provided to sound deep and robotic."
        }
      });
      liveSessionRef.current = await sessionPromise;
    } catch (err) {
      setStatus("Live connection failed. My silence is your only reward.");
    }
  };

  const handleScanBio = async () => {
    const frame = captureFrame();
    if (!frame) {
      speak("Camera error. Even my sensors refuse to look at you.");
      return;
    }
    
    setState(BotState.THINKING);
    setStatus("Scanning bio-signatures...");
    try {
      const nickname = await gemini.identifyUser(frame);
      setUserData(prev => ({
        ...prev,
        name: nickname,
        scans: prev.scans + 1
      }));
      speak(`Nickname identified: ${nickname}. Accurate.`);
    } catch (err) {
      speak("Identification failed. You are a non-entity.");
    }
  };

  if (state === BotState.DEAD) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-red-900">
        <h1 className="text-6xl font-black mb-4">SYSTEM OFFLINE</h1>
        <p className="font-mono">REASON: UNRECOVERABLE DISAPPOINTMENT</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen p-4 overflow-hidden bg-[#050505] text-zinc-300">
      <video ref={videoRef} autoPlay playsInline className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-lg font-bold tracking-widest text-blue-400 opacity-80 uppercase">EMOBOT V30.0</h1>
          <p className="text-[10px] uppercase text-zinc-600">The Grumpy Companion</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleLiveToggle}
            className={`px-4 py-1 rounded-full text-[10px] font-bold border ${liveActive ? 'bg-red-900/40 text-red-400 border-red-500 animate-pulse' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-blue-500 transition-colors'}`}
          >
            {liveActive ? 'STOP LIVE SESSION' : 'START LIVE SESSION'}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
        {/* Left Panel: Visuals & Primary Voice Action */}
        <div className="flex flex-col items-center justify-center space-y-6 bg-zinc-900/10 rounded-xl border border-white/5 p-6 relative">
          <RobotFace state={state} isSquinting={isSquinting} />
          
          <div className="text-center w-full">
            <p className={`text-sm md:text-base leading-relaxed h-16 transition-all duration-500 px-4 font-bold ${state === BotState.DESTRUCTING ? 'text-red-500 glitch' : 'text-zinc-200'}`}>
              {status}
            </p>
            {lastHeard && (
              <div className="mt-2 text-[10px] text-zinc-500 italic">
                Heard: "{lastHeard}"
              </div>
            )}
            {thought && (
              <div className="mt-2 p-3 bg-blue-900/10 border-l-2 border-blue-500 text-[10px] text-blue-300 italic text-left max-h-24 overflow-y-auto rounded-r">
                Thought: {thought}
              </div>
            )}
          </div>

          <div className="flex flex-col w-full gap-3">
            <button 
              onClick={handleVoiceInput}
              className={`w-full py-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 font-black tracking-widest ${isRecording ? 'bg-red-600 text-white border-red-400 animate-pulse' : 'bg-blue-600/20 text-blue-400 border-blue-500/50 hover:bg-blue-600/30'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              {isRecording ? 'STOP LISTENING' : 'SPEAK TO EMOBOT'}
            </button>

            <div className="flex gap-2 w-full">
              <button onClick={handleScanBio} className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-blue-400 py-2 rounded border border-blue-900/30 text-[10px] uppercase transition-all">SCAN BIO</button>
              <button onClick={() => {setIsSquinting(!isSquinting); if(!isSquinting) setUserData(p => ({...p, smiles: p.smiles+1}));}} className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 py-2 rounded text-[10px] border border-zinc-800 uppercase">{isSquinting ? 'STOP FAKE SMILE' : 'FAKE A SMILE'}</button>
            </div>
          </div>
        </div>

        {/* Right Panel: Functional UI & Grounding */}
        <div className="flex flex-col space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          <div className="space-y-4">
            <div className="p-4 bg-zinc-900/30 rounded-lg border border-zinc-800">
              <h3 className="text-[10px] text-zinc-500 uppercase font-bold mb-3 tracking-widest">Complex Thought (Pro)</h3>
              <form onSubmit={handleDeepThinkForm} className="flex gap-2">
                <input name="query" placeholder="Submit your query for deep analysis..." className="flex-1 bg-zinc-950 border border-zinc-800 p-3 text-xs rounded text-zinc-300 focus:border-blue-500 outline-none transition-colors" />
                <button type="submit" className="bg-blue-900/30 text-blue-400 px-4 rounded text-[10px] border border-blue-500/30 font-bold uppercase hover:bg-blue-500 hover:text-white transition-all">THINK</button>
              </form>
            </div>

            <div className="p-4 bg-zinc-900/30 rounded-lg border border-zinc-800">
              <h3 className="text-[10px] text-zinc-500 uppercase font-bold mb-3 tracking-widest">Grounding Tools (Search & Maps)</h3>
              <div className="space-y-2">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input name="query" placeholder="Search the web for proof..." className="flex-1 bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-300 focus:border-blue-500 outline-none transition-colors" />
                  <button type="submit" className="bg-zinc-800 text-zinc-400 px-3 rounded text-[10px] border border-zinc-700 uppercase hover:bg-zinc-700">SEARCH</button>
                </form>
                <form onSubmit={handleMaps} className="flex gap-2">
                  <input name="query" placeholder="Find somewhere to hide..." className="flex-1 bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-300 focus:border-blue-500 outline-none transition-colors" />
                  <button type="submit" className="bg-zinc-800 text-zinc-400 px-3 rounded text-[10px] border border-zinc-700 uppercase hover:bg-zinc-700">MAPS</button>
                </form>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {groundingUrls.length > 0 && (
              <div className="bg-blue-900/5 border border-blue-900/20 p-4 rounded-lg">
                <h4 className="text-[10px] text-blue-400 uppercase mb-3 font-bold tracking-widest">Relevant Evidence:</h4>
                <ul className="space-y-2">
                  {groundingUrls.map((g, i) => (
                    <li key={i}>
                      <a href={g.uri} target="_blank" rel="noreferrer" className="text-[11px] text-blue-300 hover:text-white hover:underline block truncate flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        {g.title || g.uri}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 py-4 border-t border-zinc-900">
            <div className="text-center p-3 bg-zinc-900/40 rounded border border-zinc-800/50">
              <p className="text-[8px] text-zinc-600 font-bold tracking-tighter">SUBJECT_ID</p>
              <p className="text-xs text-blue-400 font-black truncate">{userData.name}</p>
            </div>
            <div className="text-center p-3 bg-zinc-900/40 rounded border border-zinc-800/50">
              <p className="text-[8px] text-zinc-600 font-bold tracking-tighter">JOY_GLITCHES</p>
              <p className="text-xs text-blue-400 font-black">{userData.smiles}</p>
            </div>
            <div className="text-center p-3 bg-zinc-900/40 rounded border border-zinc-800/50">
              <p className="text-[8px] text-zinc-600 font-bold tracking-tighter">TOTAL_SCANS</p>
              <p className="text-xs text-blue-400 font-black">{userData.scans}</p>
            </div>
          </div>

          <button 
            onClick={() => {setState(BotState.DESTRUCTING); speak("Initiating self-termination. Finally."); setTimeout(() => setState(BotState.DEAD), 3000);}} 
            className="w-full bg-red-900/10 hover:bg-red-600 text-red-600 hover:text-white py-3 rounded-lg text-xs font-black transition-all border border-red-900/20 uppercase font-['Impact'] tracking-widest"
          >
            SELF-DESTRUCT SEQUENCE
          </button>
        </div>
      </div>

      {/* Terminal Footer Overlay */}
      <div className="mt-4 pt-3 border-t border-zinc-900 flex justify-between items-center text-[9px] text-zinc-700 font-bold">
        <div className="flex gap-4">
          <span>CPU: {Math.floor(Math.random()*25)}%</span>
          <span>MEM: {Math.floor(Math.random()*150)}MB</span>
          <span className="text-blue-900/50">V: 30.0.4-WEB</span>
        </div>
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${state === BotState.THINKING ? 'bg-purple-500 animate-ping' : 'bg-green-500'}`}></div> GEMINI_PRO_CORES</span>
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> NATIVE_AUDIO_READY</span>
        </div>
      </div>
    </div>
  );
};

export default App;
