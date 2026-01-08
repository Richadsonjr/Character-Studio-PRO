
import React, { useState, useRef, useEffect } from 'react';
import { CharacterProfile, GenerationState, GenerationResult } from './types';
import { generateCharacterImages, generateCharacterVoice } from './services/geminiService';
import { decode, decodeAudioData, createWavBlob } from './utils/audioUtils';

const App: React.FC = () => {
  const [profile, setProfile] = useState<CharacterProfile>({
    name: 'Ana Clara',
    description: 'Carioca, 28 anos, estilo evangélico moderno, elegante e discreta.',
    gender: 'Feminino',
    age: 28,
    country: 'Brasil',
    state: 'Rio de Janeiro',
    accent: 'Carioca suave',
    style: 'Elegante e discreta',
    physicalTraits: 'Cabelos castanhos longos, pele clara, sorriso gentil',
    personality: 'Gentil, educada, firme na fé e comunicativa',
    backgroundType: 'description',
    backgroundValue: 'Um jardim florido ao entardecer',
    characterContext: 'Sorrindo serenamente para a foto'
  });

  const [inputText, setInputText] = useState('');
  const [genState, setGenState] = useState<GenerationState>(GenerationState.IDLE);
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [showPromptModal, setShowPromptModal] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const currentResult = history.find(h => h.id === activeId);
  const showDlwButton = process.env.EXIBE_BTN_DLW === 'sim';

  useEffect(() => {
    if (currentResult) {
      setProfile(currentResult.profile);
    }
  }, [activeId]);

  const triggerDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAll = (result: GenerationResult) => {
    result.images.forEach((img, i) => {
      setTimeout(() => triggerDownload(img, `${result.name}_${i + 1}.png`), i * 300);
    });
    if (result.audioBase64) {
      const b = createWavBlob(decode(result.audioBase64), 24000);
      const url = URL.createObjectURL(b);
      setTimeout(() => triggerDownload(url, `${result.name}_voz.wav`), result.images.length * 300);
    }
  };

  const clearHistory = () => {
    if (window.confirm("Deseja realmente limpar todo o histórico da sessão?")) {
      setHistory([]);
      setActiveId(null);
      setIsHistoryOpen(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'audio') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'image') {
          setProfile(p => ({ ...p, referenceImage: reader.result as string }));
        } else {
          setProfile(p => ({
            ...p,
            referenceAudio: {
              data: (reader.result as string).split(',')[1],
              mimeType: file.type
            }
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!profile.name || !inputText) return;
    try {
      setGenState(GenerationState.GENERATING);
      const { images, prompt } = await generateCharacterImages(profile);
      const audio = await generateCharacterVoice(inputText, profile);

      const newResult: GenerationResult = {
        id: Date.now(),
        name: profile.name,
        date: new Date().toLocaleTimeString(),
        images,
        audioBase64: audio,
        usedPrompt: prompt,
        profile: { ...profile }
      };

      setHistory(prev => [newResult, ...prev]);
      setActiveId(newResult.id);
      setGenState(GenerationState.SUCCESS);
      // Scroll to result on mobile
      window.scrollTo({ top: document.getElementById('result-area')?.offsetTop || 0, behavior: 'smooth' });
    } catch (err) {
      setGenState(GenerationState.ERROR);
    }
  };

  const playVoice = async (base64: string) => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    const buffer = await decodeAudioData(decode(base64), audioContextRef.current, 24000, 1);
    if (sourceRef.current) try { sourceRef.current.stop(); } catch {}
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    sourceRef.current = source;
    source.start(0);
  };

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 selection:bg-indigo-500/30 font-['Montserrat'] pb-24">
      
      {/* MODAL PROMPT */}
      {showPromptModal && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6" onClick={() => setShowPromptModal(null)}>
          <div className="bg-[#101015] border border-white/10 p-6 sm:p-8 rounded-[2rem] max-w-2xl w-full space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-indigo-400 font-black uppercase text-[10px] tracking-widest">Engineering Prompt</h3>
            <div className="bg-black/50 p-4 rounded-2xl border border-white/5 font-mono text-[10px] text-slate-400 leading-relaxed max-h-80 overflow-y-auto custom-scrollbar">
              {showPromptModal}
            </div>
            <button onClick={() => setShowPromptModal(null)} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Fechar</button>
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {modalImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-pointer" onClick={() => setModalImage(null)}>
          <img src={modalImage} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" />
        </div>
      )}

      {/* HEADER */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-2xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)]">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </div>
            <h1 className="text-lg sm:text-xl font-bold font-['Playfair_Display'] hidden sm:block">Character Studio PRO</h1>
            <h1 className="text-lg font-bold font-['Playfair_Display'] sm:hidden">CS PRO</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {showDlwButton && (
              <a href="/src/dlw" target="_blank" className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all">
                Backups
              </a>
            )}
            <div className="px-2 py-1 bg-white/5 rounded-lg border border-white/5 text-[7px] sm:text-[8px] font-black uppercase text-slate-500">
              High Fidelity Engine
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* FORMULÁRIO - MOBILE FIRST */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-6">
          <section className="glass-panel rounded-[2rem] p-5 sm:p-8 space-y-8 shadow-2xl">
            
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">1. Identidade & Local</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[8px] font-bold text-slate-500 uppercase ml-2">Nome Completo</label>
                  <input value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Nome" />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-500 uppercase ml-2">Gênero</label>
                  <select value={profile.gender} onChange={(e) => setProfile({...profile, gender: e.target.value as any})} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none appearance-none">
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-500 uppercase ml-2">Idade</label>
                  <input type="number" value={profile.age} onChange={(e) => setProfile({...profile, age: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-500 uppercase ml-2">País</label>
                  <input value={profile.country} onChange={(e) => setProfile({...profile, country: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" placeholder="País" />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-500 uppercase ml-2">Estado</label>
                  <input value={profile.state} onChange={(e) => setProfile({...profile, state: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" placeholder="Estado" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[8px] font-bold text-slate-500 uppercase ml-2">Sotaque</label>
                  <input value={profile.accent} onChange={(e) => setProfile({...profile, accent: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" placeholder="Ex: Carioca suave" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">2. Psicologia & Estilo</h3>
              <div className="space-y-4">
                <input value={profile.personality} onChange={(e) => setProfile({...profile, personality: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" placeholder="Personalidade" />
                <input value={profile.style} onChange={(e) => setProfile({...profile, style: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" placeholder="Estilo Visual" />
                <textarea value={profile.physicalTraits} onChange={(e) => setProfile({...profile, physicalTraits: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs h-24 resize-none outline-none" placeholder="Traços Físicos Detalhados..." />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">3. Cenário & Contexto</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                   <select value={profile.backgroundType} onChange={(e) => setProfile({...profile, backgroundType: e.target.value as any})} className="bg-white/5 border border-white/5 rounded-xl px-3 py-3 text-xs outline-none">
                     <option value="description">Descrição</option>
                     <option value="url">URL</option>
                   </select>
                   <input value={profile.backgroundValue} onChange={(e) => setProfile({...profile, backgroundValue: e.target.value})} className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" placeholder="Localização" />
                </div>
                <input value={profile.characterContext} onChange={(e) => setProfile({...profile, characterContext: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" placeholder="O que o personagem está fazendo?" />
              </div>
            </div>

            <div className="space-y-4 p-6 bg-indigo-500/5 rounded-[2rem] border border-indigo-500/10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">4. Clonagem & Referência</h3>
              
              <div className="space-y-2">
                <input type="file" ref={imageInputRef} onChange={(e) => handleFileUpload(e, 'image')} accept="image/*" className="hidden" />
                <button onClick={() => imageInputRef.current?.click()} className={`w-full py-2.5 border border-dashed rounded-xl text-[9px] font-black uppercase transition-all ${profile.referenceImage ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' : 'border-white/10 text-slate-500'}`}>
                  {profile.referenceImage ? "Foto Carregada ✓" : "Upload Rosto de Referência"}
                </button>
              </div>

              <div className="space-y-2">
                <input type="file" ref={audioInputRef} onChange={(e) => handleFileUpload(e, 'audio')} accept="audio/*" className="hidden" />
                <button onClick={() => audioInputRef.current?.click()} className={`w-full py-2.5 border border-dashed rounded-xl text-[9px] font-black uppercase transition-all ${profile.referenceAudio ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' : 'border-white/10 text-slate-500'}`}>
                  {profile.referenceAudio ? "Voz para Clonagem ✓" : "Upload Áudio MP3"}
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} className="w-full bg-indigo-500/5 border border-indigo-500/10 rounded-2xl px-5 py-4 h-28 text-sm outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Roteiro..." />
              <button onClick={handleGenerate} disabled={genState === GenerationState.GENERATING} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95">
                {genState === GenerationState.GENERATING ? "Processando..." : "Gerar Personagem"}
              </button>
            </div>
          </section>
        </div>

        {/* VISUALIZAÇÃO PRINCIPAL */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-8" id="result-area">
          {currentResult ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* STATUS BAR */}
              <div className="bg-gradient-to-r from-indigo-900/40 via-black to-black p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-white/5 flex flex-col sm:flex-row gap-6 items-center justify-between shadow-2xl">
                <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                  <button onClick={() => playVoice(currentResult.audioBase64!)} className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600 rounded-2xl sm:rounded-[2rem] flex items-center justify-center shadow-lg hover:shadow-indigo-500/40 transition-all active:scale-95 group shrink-0">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                  </button>
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tighter truncate">{currentResult.name}</h2>
                    <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Neural Output • {currentResult.date}</p>
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                  <button onClick={() => setShowPromptModal(currentResult.usedPrompt)} className="flex-1 sm:flex-none px-5 py-3 sm:py-4 bg-white/5 hover:bg-white/10 rounded-xl sm:rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">Prompt</button>
                  <button onClick={() => downloadAll(currentResult)} className="flex-1 sm:flex-none px-5 py-3 sm:py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl sm:rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl">Download All</button>
                </div>
              </div>

              {/* IMAGENS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {currentResult.images.map((img, i) => (
                  <div key={i} className={`group relative rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl ${i === 0 ? 'sm:col-span-2 aspect-video' : 'aspect-square sm:aspect-[4/3]'}`}>
                    <img 
                      src={img} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer" 
                      onClick={() => setModalImage(img)}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                       <button onClick={() => setModalImage(img)} className="p-3 sm:p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                       </button>
                       <button onClick={() => triggerDownload(img, `${currentResult.name}_${i}.png`)} className="p-3 sm:p-4 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 transition-all shadow-xl">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[400px] sm:h-full min-h-[400px] border-2 border-dashed border-white/5 rounded-[2rem] sm:rounded-[4rem] flex flex-col items-center justify-center opacity-20 text-slate-500 p-8 text-center">
               <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] leading-loose">Aguardando geração de personagem</p>
            </div>
          )}
        </div>
      </main>

      {/* DROPUP HISTÓRICO (BOTTOM SHEET) */}
      <div className={`fixed bottom-0 left-0 right-0 z-[60] transition-transform duration-500 ease-in-out transform ${isHistoryOpen ? 'translate-y-0' : 'translate-y-[calc(100%-60px)]'}`}>
        
        {/* TRIGGER BUTTON */}
        <div className="flex justify-center mb-0">
          <button 
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="bg-indigo-600 text-white px-8 py-4 rounded-t-[2rem] text-[10px] font-black uppercase tracking-widest shadow-[0_-10px_30px_rgba(79,70,229,0.3)] border-t border-x border-indigo-500/50 flex items-center gap-3 transition-all hover:bg-indigo-500 active:scale-95"
          >
            <svg className={`w-4 h-4 transition-transform duration-500 ${isHistoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
            Histórico da Sessão ({history.length})
          </button>
        </div>

        {/* CONTENT PANEL */}
        <div className="bg-[#0c0c12] border-t border-white/10 h-[60vh] sm:h-[40vh] shadow-2xl p-6 sm:p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Linha do Tempo</h3>
              <button onClick={clearHistory} className="text-[9px] font-black text-rose-500 hover:text-rose-400 uppercase tracking-widest transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Limpar Tudo
              </button>
            </div>

            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 opacity-20 text-slate-500">
                <p className="text-[10px] font-black uppercase tracking-widest">Nenhum personagem gerado nesta sessão</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {history.map((res) => (
                  <div 
                    key={res.id} 
                    onClick={() => { setActiveId(res.id); setIsHistoryOpen(false); }}
                    className={`group relative cursor-pointer rounded-2xl p-3 border transition-all duration-300 ${activeId === res.id ? 'bg-indigo-600/10 border-indigo-600/50 shadow-[0_0_20px_rgba(79,70,229,0.1)]' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}`}
                  >
                    <div className="flex gap-4">
                       <div className="w-16 h-16 rounded-xl overflow-hidden bg-black shrink-0 shadow-lg">
                          <img src={res.images[0]} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                       </div>
                       <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h4 className="text-xs font-black text-white truncate uppercase tracking-tighter">{res.name}</h4>
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">{res.date}</p>
                       </div>
                       <div className="flex flex-col justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); triggerDownload(res.images[0], `${res.name}.png`); }} className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
                             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(79, 70, 229, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(79, 70, 229, 0.4); }
        
        input, select, textarea {
          transition: all 0.2s ease;
        }
        
        @media (max-width: 640px) {
          .glass-panel {
            border-radius: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
