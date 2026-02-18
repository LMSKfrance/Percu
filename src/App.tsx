import { useState, useEffect, useRef, useCallback } from 'react';
import { generatePattern, Pattern, GeneratorParams } from './groove/generator';
import { Transport } from './audio/transport';
import { renderWav, downloadBlob, RenderOptions } from './audio/renderWav';
import { CityMode, CITY_MAP } from './ui/constants';
import { LayoutShell } from './ui/LayoutShell';
import { TopBar } from './ui/components/TopBar';
import { SequencerPanel } from './ui/components/SequencerPanel';
import { MixerPanel } from './ui/components/MixerPanel';
import { MasterFxPanel } from './ui/components/MasterFxPanel';
import { LaneInspector } from './ui/components/LaneInspector';
import { EngineStrip } from './ui/components/EngineStrip';

function App() {
  const [pattern, setPattern] = useState<Pattern>({ tracks: [] });
  const [bpm, setBPM] = useState(128);
  const [seed, setSeed] = useState('techno');
  const [seedHistory, setSeedHistory] = useState<string[]>(['techno']);
  const [seedIdx, setSeedIdx] = useState(0);
  const [cityMode, setCityMode] = useState<CityMode>('tbilisi');
  const detroitBerlin = CITY_MAP[cityMode];
  const [percussiveNoisy, setPercussiveNoisy] = useState(0.5);
  const [density, setDensity] = useState(0.5);
  const [laneToggles, setLaneToggles] = useState<Map<string, boolean>>(new Map());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [wavBars, setWavBars] = useState<8 | 16>(8);
  const [wavFormat, setWavFormat] = useState<'float32' | 'pcm16'>('pcm16');
  const [isRendering, setIsRendering] = useState(false);
  const [selectedLane, setSelectedLane] = useState<string | null>(null);
  const [laneOffsets, setLaneOffsets] = useState<Map<string, number>>(new Map());
  const [delaySends, setDelaySends] = useState<Map<string, number>>(new Map());
  const [reverbSends, setReverbSends] = useState<Map<string, number>>(new Map());
  const [panSends, setPanSends] = useState<Map<string, number>>(new Map());
  const [compSends, setCompSends] = useState<Map<string, number>>(new Map());
  const [channelGains, setChannelGains] = useState<Map<string, number>>(new Map());
  const [percModel, setPercModel] = useState(0);
  const [percDecay, setPercDecay] = useState(0.5);
  const [percTone, setPercTone] = useState(0.5);
  const [percBite, setPercBite] = useState(0.3);
  const [percMotion, setPercMotion] = useState(0.2);
  const [rumbleAmount, setRumbleAmount] = useState(0);
  const [rumbleTune, setRumbleTune] = useState(0.5);
  const [rumbleWidth, setRumbleWidth] = useState(0.4);
  const [rumbleDecay, setRumbleDecay] = useState(0.5);
  const [rumbleDrive, setRumbleDrive] = useState(0.2);

  const transportRef = useRef<Transport | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const stepUpdateIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params: GeneratorParams = { seed, detroitBerlin, percussiveNoisy, density };
      const newPattern = generatePattern(params);
      setPattern(newPattern);
      setLaneToggles(prev => {
        const WIP = new Set(['Chord', 'Acid']);
        const next = new Map(prev);
        newPattern.tracks.forEach(t => {
          if (!next.has(t.name)) next.set(t.name, WIP.has(t.name) ? false : true);
        });
        if (transportRef.current) {
          transportRef.current.setPattern(newPattern);
          transportRef.current.setBPM(bpm);
          transportRef.current.setPercussiveNoisy(percussiveNoisy);
          newPattern.tracks.forEach(t => {
            transportRef.current?.setLaneEnabled(t.name, next.get(t.name) ?? true);
          });
        } else if (audioContextRef.current) {
          transportRef.current = new Transport(audioContextRef.current, newPattern, bpm);
          transportRef.current.setPercussiveNoisy(percussiveNoisy);
          newPattern.tracks.forEach(t => transportRef.current?.setLaneEnabled(t.name, true));
        }
        return next;
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [seed, detroitBerlin, percussiveNoisy, density, bpm]);

  useEffect(() => { transportRef.current?.setBPM(bpm); }, [bpm]);
  useEffect(() => { transportRef.current?.setPercussiveNoisy(percussiveNoisy); }, [percussiveNoisy]);
  useEffect(() => {
    if (transportRef.current) laneToggles.forEach((en, n) => transportRef.current?.setLaneEnabled(n, en));
  }, [laneToggles]);

  useEffect(() => {
    if (isPlaying) {
      stepUpdateIntervalRef.current = window.setInterval(() => {
        if (transportRef.current) setCurrentStep(transportRef.current.getCurrentStep());
      }, 30);
    } else {
      if (stepUpdateIntervalRef.current !== null) clearInterval(stepUpdateIntervalRef.current);
      stepUpdateIntervalRef.current = null;
      setCurrentStep(0);
    }
    return () => { if (stepUpdateIntervalRef.current !== null) clearInterval(stepUpdateIntervalRef.current); };
  }, [isPlaying]);

  const handlePlay = async () => {
    if (!transportRef.current) return;
    if (isPlaying) { transportRef.current.stop(); setIsPlaying(false); }
    else { await transportRef.current.play(); setIsPlaying(true); }
  };
  const handlePanic = () => {
    if (transportRef.current) transportRef.current.stop();
    setIsPlaying(false);
  };

  const pushSeed = useCallback((s: string) => {
    setSeedHistory(prev => {
      const next = [...prev.slice(0, seedIdx + 1), s];
      setSeedIdx(next.length - 1);
      return next;
    });
    setSeed(s);
  }, [seedIdx]);
  const handleSeedRandom = useCallback(() => pushSeed(Math.random().toString(36).substring(2, 10)), [pushSeed]);
  const handleSeedPrev = useCallback(() => {
    if (seedIdx > 0) { setSeedIdx(seedIdx - 1); setSeed(seedHistory[seedIdx - 1]); }
  }, [seedIdx, seedHistory]);
  const handleSeedNext = useCallback(() => {
    if (seedIdx < seedHistory.length - 1) { setSeedIdx(seedIdx + 1); setSeed(seedHistory[seedIdx + 1]); }
  }, [seedIdx, seedHistory]);
  const handleSeedChange = useCallback((s: string) => pushSeed(s), [pushSeed]);
  const handleLaneToggle = (name: string, enabled: boolean) => {
    setLaneToggles(prev => { const n = new Map(prev); n.set(name, enabled); return n; });
  };
  const handleLaneOffsetChange = (name: string, delta: number) => {
    setLaneOffsets(prev => {
      const n = new Map(prev);
      const next = (((n.get(name) ?? 0) + delta) % 16 + 16) % 16;
      n.set(name, next);
      transportRef.current?.setLaneOffset(name, next);
      return n;
    });
  };
  const handleDelaySendChange = (name: string, v: number) => {
    setDelaySends(prev => { const n = new Map(prev); n.set(name, v); return n; });
  };
  const handleReverbSendChange = (name: string, v: number) => {
    setReverbSends(prev => { const n = new Map(prev); n.set(name, v); return n; });
  };
  const handleChannelGainChange = (name: string, v: number) => {
    setChannelGains(prev => { const n = new Map(prev); n.set(name, v); return n; });
  };
  const handlePanSendChange = (name: string, v: number) => {
    setPanSends(prev => { const n = new Map(prev); n.set(name, v); return n; });
  };
  const handleCompSendChange = (name: string, v: number) => {
    setCompSends(prev => { const n = new Map(prev); n.set(name, v); return n; });
  };
  const handleDownloadWav = async () => {
    if (!pattern.tracks.length || isRendering) return;
    setIsRendering(true);
    try {
      const opts: RenderOptions = { bars: wavBars, format: wavFormat };
      const blob = await renderWav(pattern, bpm, laneToggles, percussiveNoisy, opts);
      downloadBlob(blob, `percu_${bpm}bpm_${seed.substring(0, 8)}_${wavBars}bars.wav`);
    } catch (e) { console.error(e); alert('WAV render failed'); }
    finally { setIsRendering(false); }
  };

  const laneNames = pattern.tracks.map(t => t.name);

  return (
    <LayoutShell
      topBar={
        <TopBar
          isPlaying={isPlaying} onPlay={handlePlay} onPanic={handlePanic}
          bpm={bpm} onBPMChange={setBPM}
          seed={seed} onSeedChange={handleSeedChange}
          seedHistory={seedHistory} seedIdx={seedIdx}
          onSeedPrev={handleSeedPrev} onSeedNext={handleSeedNext} onSeedRandom={handleSeedRandom}
          cityMode={cityMode} onCityModeChange={setCityMode}
          density={density} onDensityChange={setDensity}
        />
      }
      sequencer={
        <SequencerPanel
          pattern={pattern} currentStep={currentStep} isPlaying={isPlaying}
          selectedLane={selectedLane} onLaneSelect={setSelectedLane}
          laneToggles={laneToggles} onLaneToggle={handleLaneToggle}
          laneOffsets={laneOffsets} onLaneOffsetChange={handleLaneOffsetChange}
        />
      }
      mixer={
        <MixerPanel
          tracks={pattern.tracks}
          laneToggles={laneToggles} onLaneToggle={handleLaneToggle}
          selectedLane={selectedLane} onLaneSelect={setSelectedLane}
          isPlaying={isPlaying}
          channelGains={channelGains} onChannelGainChange={handleChannelGainChange}
          delaySends={delaySends} onDelaySendChange={handleDelaySendChange}
          reverbSends={reverbSends} onReverbSendChange={handleReverbSendChange}
          panSends={panSends} onPanSendChange={handlePanSendChange}
          compSends={compSends} onCompSendChange={handleCompSendChange}
        />
      }
      masterFx={
        <MasterFxPanel
          rumbleAmount={rumbleAmount} onRumbleAmountChange={setRumbleAmount}
          rumbleTune={rumbleTune} onRumbleTuneChange={setRumbleTune}
          rumbleWidth={rumbleWidth} onRumbleWidthChange={setRumbleWidth}
          rumbleDecay={rumbleDecay} onRumbleDecayChange={setRumbleDecay}
          rumbleDrive={rumbleDrive} onRumbleDriveChange={setRumbleDrive}
        />
      }
      bottomRack={
        <>
          <EngineStrip
            percModel={percModel} onPercModelChange={setPercModel}
            percDecay={percDecay} onPercDecayChange={setPercDecay}
            percTone={percTone} onPercToneChange={setPercTone}
            percBite={percBite} onPercBiteChange={setPercBite}
            percMotion={percMotion} onPercMotionChange={setPercMotion}
            percussiveNoisy={percussiveNoisy} onPercussiveNoisyChange={setPercussiveNoisy}
          />
          <LaneInspector
            selectedLane={selectedLane} lanes={laneNames}
            wavBars={wavBars} onWavBarsChange={setWavBars}
            wavFormat={wavFormat} onWavFormatChange={setWavFormat}
            onDownloadWav={handleDownloadWav}
            isRendering={isRendering}
            hasPattern={pattern.tracks.length > 0}
            onSeedRandom={handleSeedRandom}
          />
        </>
      }
    />
  );
}

export default App;
