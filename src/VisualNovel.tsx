import React, { useState, useEffect } from 'react';
import type { Scene } from './storyParser';
import { loadStory } from './storyParser';
import './VisualNovel.css';
import EndRoll from './EndRoll';
import CenterScrollText from './CenterScrollText';
import Quiz from './Quiz.tsx';
import TitleScreen from './TitleScreen.tsx';
import ChapterSelect from './ChapterSelect.tsx';

const CHARACTER_IMAGES: Record<string, string> = {
  '太郎': '/images/man.png',
  '彁': '/images/sei.png',
  '零': '/images/zeroAnime/frame01.png',
  '焔': '/images/en.png', 
  '結': '/images/yui.png', 
  '守': '/images/mamoru.png', 
  '問': '/images/toi.png', 
  '希': '/images/nozomi.png', 
  '老人': '/images/keirou_ojiichan_smile2.png', 
  'クラスメイト': '/images/boy_face_smile.png', 
};

export default function VisualNovel() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const ZERO_FRAMES = 16;
  const ZERO_FPS = 24; // default frames per second for the animation (adjustable)
  const [zeroUnlocked, setZeroUnlocked] = useState(false);
  const [zeroTriggers, setZeroTriggers] = useState<Set<string>>(new Set());
  // ゲート用アンロック管理（シーン単位）
  const [unlockedScenes, setUnlockedScenes] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem('unlockedScenes');
      if (raw) {
        return new Set(JSON.parse(raw) as number[]);
      }
    } catch (e) {
      console.error('❌ Error loading unlockedScenes:', e);
    }
    return new Set([0]);
  });
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizTargetScene, setQuizTargetScene] = useState<number | null>(null);
  const [showTitle, setShowTitle] = useState(true);
  const [showChapterSelect, setShowChapterSelect] = useState(false);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [chapterLoadProgress, setChapterLoadProgress] = useState<{loaded:number; total:number}>({loaded:0, total:0});
  const [, setChapterLoadingText] = useState('');
  // クイズクリア状態を管理（章インデックスをキーとする）
  const [clearedQuizzes, setClearedQuizzes] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem('clearedQuizzes');
      if (raw) {
        return new Set(JSON.parse(raw) as number[]);
      }
    } catch (e) {
      console.error('❌ Error loading clearedQuizzes:', e);
    }
    return new Set();
  });
  // 章の読了状態を管理（章インデックスをキーとする）
  const [completedChapters, setCompletedChapters] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem('completedChapters');
      if (raw) {
        return new Set(JSON.parse(raw) as number[]);
      }
    } catch (e) {
      console.error('❌ Error loading completedChapters:', e);
    }
    return new Set();
  });
  // endroll transition state
  const [pendingEndroll, setPendingEndroll] = useState(false);
  const [showEndroll, setShowEndroll] = useState(false);
  const ENDROLL_FADE_MS = 2000;
  // video-only: use /images/zero.mp4 (looped)
  // ログ表示機能
  // ログ表示機能（内部 state を使わずコンソール出力のみ）
  const addLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString();
    // 併せてコンソールにも出す
    // eslint-disable-next-line no-console
    console.log(`${ts} ${msg}`);
  };
  // 表示済み台詞の履歴（トランスクリプト）表示フラグ
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    loadStory().then((loadedScenes) => {
      setScenes(loadedScenes as Scene[]);
      // compute zero trigger positions from dialogues in the parsed scenes
      const triggers = new Set<string>();
      const zeroRegex = /^\s*[「『]?\s*零\s*[。\.!！…]*\s*[」』]?\s*$/;
      loadedScenes.forEach((s, si) => {
        (s.dialogues || []).forEach((d: any, di: number) => {
          const txt = (d.text || '').toString();
          if (zeroRegex.test(txt)) {
            // only register zero triggers for scenes 7 and 8 (1-based)
            if (si === 6 || si === 7) triggers.add(`${si}:${di}`);
          }
        });
      });
      setZeroTriggers(triggers);
      setLoading(false);
      addLog(`Story loaded: ${loadedScenes.length} scenes`);
    });
  }, []);

  // unlockedScenes を保存
  useEffect(() => {
    try {
      const data = Array.from(unlockedScenes);
      localStorage.setItem('unlockedScenes', JSON.stringify(data));
      console.log('💾 Saved unlockedScenes:', data);
    } catch (e) {
      console.error('❌ Error saving unlockedScenes:', e);
    }
  }, [unlockedScenes]);

  // clearedQuizzes を保存
  useEffect(() => {
    try {
      const data = Array.from(clearedQuizzes);
      localStorage.setItem('clearedQuizzes', JSON.stringify(data));
      console.log('💾 Saved clearedQuizzes:', data);
    } catch (e) {
      console.error('❌ Error saving clearedQuizzes:', e);
    }
  }, [clearedQuizzes]);

  // completedChapters を保存
  useEffect(() => {
    try {
      const data = Array.from(completedChapters);
      localStorage.setItem('completedChapters', JSON.stringify(data));
      console.log('💾 Saved completedChapters:', data);
    } catch (e) {
      console.error('❌ Error saving completedChapters:', e);
    }
  }, [completedChapters]);

  // ページ全体のスクロールを無効化する（コンポーネントマウント時）
  useEffect(() => {
    try {
      document.body.classList.add('vn-no-scroll');
    } catch (e) {
      // ignore server-side or non-browser environments
    }
    return () => {
      try {
        document.body.classList.remove('vn-no-scroll');
      } catch (e) {
        // ignore
      }
    };
  }, []);

  // video playback handled in render when `零` is visible

  // 現在の台詞からstory.jsonのcharactersフィールドを取得
  const getCurrentCharacters = (): string[] => {
    const currentScene = scenes[currentSceneIndex];
    if (!currentScene) return [];
    const currentDialogue = currentScene.dialogues[currentDialogueIndex];
    const dialogueChars = (currentDialogue as any)?.characters;
    if (Array.isArray(dialogueChars)) {
      return dialogueChars;
    }
    return [];
  };

  // シーン／台詞の変更をログに残す
  // useEffect(() => {
  //   const scene = scenes[currentSceneIndex];
  //   const dlg = scene?.dialogues?.[currentDialogueIndex];
  //   const text = (dlg && dlg.text) ? dlg.text.toString() : '';
  //   addLog(`Scene ${currentSceneIndex + 1}/${scenes.length} Dialogue ${currentDialogueIndex + 1}/${scene?.dialogues?.length || 0}: ${text}`);
  // }, [currentSceneIndex, currentDialogueIndex, scenes]);

  // 現在のシーンに零が含まれるか判定するユーティリティ
  function sceneContainsZero(scene: any) {
    if (!scene) return false;
    return Array.isArray(scene.characters) && scene.characters.includes('零');
  }

  // ヘルパー: dialogue.speaker が特定の名前を含むか判定
  function speakerIncludes(s: any, name: string) {
    if (!s) return false;
    if (Array.isArray(s)) return s.includes(name);
    if (typeof s === 'string') return s === name || s.includes(name);
    return false;
  }

  // (zero utterance detection is handled via `zeroTriggers` derived from the parsed story)

  // zero フレームを事前読み込みして滑らかに再生する
  const zeroFramesRef = React.useRef<HTMLImageElement[] | null>(null);
  const animRef = React.useRef<number | null>(null);
  const frameIndexRef = React.useRef(0);

  // 一度だけフレームをプリロード
  useEffect(() => {
    if (zeroFramesRef.current) return;

    // First try deterministic frameNN pattern and keep order
    const frameOrdered: Array<HTMLImageElement | null> = new Array(ZERO_FRAMES).fill(null);
    let remainingFrame = ZERO_FRAMES;
    let anyFrameLoaded = false;

    for (let i = 1; i <= ZERO_FRAMES; i++) {
      const idx = i - 1;
      const src = `/images/zeroAnime/frame${String(i).padStart(2, '0')}.png`;
      const img = new Image();
      img.onload = () => {
        frameOrdered[idx] = img;
        anyFrameLoaded = true;
        remainingFrame--;
        if (remainingFrame <= 0) {
          if (anyFrameLoaded) {
            zeroFramesRef.current = frameOrdered.filter(Boolean) as HTMLImageElement[];
          }
        }
        // addLog(`Preloaded zero frame: ${src}`);
      };
      img.onerror = () => {
        remainingFrame--;
        if (remainingFrame <= 0) {
          if (anyFrameLoaded) {
            zeroFramesRef.current = frameOrdered.filter(Boolean) as HTMLImageElement[];
          }
        }
      };
      img.src = src;
    }

    // If none of the frameNN pattern existed, try Scene1_000..Scene1_099 deterministically
    setTimeout(() => {
      if (zeroFramesRef.current && zeroFramesRef.current.length > 0) return;
      const sceneMapSize = 100;
      const sceneOrdered: Array<HTMLImageElement | null> = new Array(sceneMapSize).fill(null);
      let remainingScene = sceneMapSize;
      let anySceneLoaded = false;
      for (let i = 0; i < sceneMapSize; i++) {
        const src = `/images/zeroAnime/Scene1_${String(i).padStart(3, '0')}.png`;
        const img = new Image();
        img.onload = () => {
          sceneOrdered[i] = img;
          anySceneLoaded = true;
          remainingScene--;
          if (remainingScene <= 0 && anySceneLoaded) {
            zeroFramesRef.current = sceneOrdered.filter(Boolean) as HTMLImageElement[];
          }
          // addLog(`Preloaded zero frame (alt): ${src}`);
        };
        img.onerror = () => {
          remainingScene--;
          if (remainingScene <= 0 && anySceneLoaded) {
            zeroFramesRef.current = sceneOrdered.filter(Boolean) as HTMLImageElement[];
          }
        };
        img.src = src;
      }
      // final safety: if none loaded, set null
      setTimeout(() => {
        if (!zeroFramesRef.current) zeroFramesRef.current = null;
      }, 1000);
    }, 300);
  }, []);

  // アニメーションループを常時回し、表示されているときのみ img.src を更新する。
  // こうすることで表示・非表示を切り替えても再生位置がリセットされない。
  useEffect(() => {
    const frames = zeroFramesRef.current;
    if (!frames || frames.length === 0) return;
    if (animRef.current) return; // 既にループ中

    const frameDuration = 1000 / ZERO_FPS;
    let lastTs = 0;

    const step = (ts: number) => {
      if (!lastTs) lastTs = ts;
      const elapsed = ts - lastTs;
      if (elapsed >= frameDuration) {
        frameIndexRef.current = (frameIndexRef.current + 1) % frames.length;
        lastTs = ts;
      }

      // 画像要素が存在し、表示条件が満たされているときだけ src を更新
      const imgEl = document.getElementById('zero-sprite-img') as HTMLImageElement | null;
      // テスト用のキャラクター配列も考慮して零が含まれるか判定
      const currentChars = getCurrentCharacters();
      const hasZero = currentChars.includes('零');
      const sceneHasZeroNow = sceneContainsZero(scenes[currentSceneIndex]);
      const key = `${currentSceneIndex}:${currentDialogueIndex}`;
      const triggerNow = zeroTriggers.has(key);
      const shouldShow = zeroUnlocked || sceneHasZeroNow || triggerNow || hasZero;
      if (imgEl && shouldShow && frames[frameIndexRef.current]) {
        imgEl.src = frames[frameIndexRef.current].src;
      }

      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
  }, [zeroTriggers, zeroUnlocked, scenes, currentSceneIndex, currentDialogueIndex, ZERO_FPS]);

  // シーンが変わったとき、もしそのシーンの characters に 零 が含まれていたら
  // 一度フラグを立てて以後表示を永続化する
  useEffect(() => {
    const sceneHas = sceneContainsZero(scenes[currentSceneIndex]);
    const key = `${currentSceneIndex}:${currentDialogueIndex}`;
    // If the scene is one that should contain 零, or the current dialogue
    // matches a zero trigger, unlock zero. Also unlock when the specific
    // line in scene7 appears: "久しぶりだね、彁。君は、また意味を持とうとしてるんだね"
    const currentText = scenes[currentSceneIndex]?.dialogues?.[currentDialogueIndex]?.text || '';
    const triggerLine = '久しぶりだね、彁。君は、また意味を持とうとしてるんだね';
    if (sceneHas || zeroTriggers.has(key) || currentText.includes(triggerLine)) {
      if (!zeroUnlocked) {
        setZeroUnlocked(true);
        addLog('Zero unlocked');
      }
    }
  }, [scenes, currentSceneIndex, currentDialogueIndex, zeroTriggers]);

  // クイズの結果ハンドラ
  const handleQuizResult = (success: boolean) => {
    if (quizTargetScene === null) {
      setQuizOpen(false);
      return;
    }
    if (success) {
      // クイズをクリアした章を記録
      setClearedQuizzes((prev) => new Set(Array.from(prev).concat([quizTargetScene])));
      // 次の章を解放
      const nextScene = quizTargetScene + 1;
      if (nextScene < scenes.length) {
        setUnlockedScenes((prev) => new Set(Array.from(prev).concat([nextScene])));
      }
      // 章選択画面に戻る
      setShowChapterSelect(true);
    }
    setQuizTargetScene(null);
    setQuizOpen(false);
  };

  const handleClick = () => {
    if (quizOpen) return;
    const currentScene = scenes[currentSceneIndex];
    
    if (!currentScene) return;

    // If this is the last dialogue, initiate endroll fade on click
    if (currentSceneIndex === scenes.length - 1 && currentDialogueIndex === currentScene.dialogues.length - 1) {
      if (!pendingEndroll && !showEndroll) {
        setPendingEndroll(true);
        // after fade, show endroll (unmount VN and mount EndRoll)
        setTimeout(() => {
          setShowEndroll(true);
        }, ENDROLL_FADE_MS);
      }
      return;
    }

    // 次の台詞に進む
    if (currentDialogueIndex < currentScene.dialogues.length - 1) {
      setCurrentDialogueIndex(currentDialogueIndex + 1);
    } else {
      // 章の終わりに到達 → 章を読了済みとしてマーク
      setCompletedChapters((prev) => new Set(Array.from(prev).concat([currentSceneIndex])));
      // 章選択画面に戻る
      setShowChapterSelect(true);
    }
  };

  if (loading) {
    return (
      <div className="visual-novel loading">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  if (scenes.length === 0) {
    return (
      <div className="visual-novel error">
        <div className="error-text">ストーリーを読み込めませんでした</div>
      </div>
    );
  }

  if (showTitle) {
    return <TitleScreen onStart={() => {
      setShowTitle(false);
      setShowChapterSelect(true);
    }} />;
  }

  // 章ごとに1対1対応するクイズデータ
  // 各章に専用のクイズを設定
  // correctAnswer: ユーザーが入力すべき正解の文字列
  // imageUrl: クイズ画像のパス（後で追加）
  const chapterQuizzes = [
    // 序章（index: 0）
    { correctAnswer: '日', imageUrl: '/images/quizzes/chapter0.png' },
    // 第1章（index: 1）
    { correctAnswer: '水晶', imageUrl: '/images/quizzes/chapter1.png' },
    // 第2章（index: 2）
    { correctAnswer: '枠', imageUrl: '/images/quizzes/chapter2.png' },
    // 第3章（index: 3）
    { correctAnswer: '蛙', imageUrl: '/images/quizzes/chapter3.png' },
    // 第4章（index: 4）
    { correctAnswer: '亜音速', imageUrl: '/images/quizzes/chapter4.png' },
    // 第5章（index: 5）
    { correctAnswer: ['得点', '特典'], imageUrl: '/images/quizzes/chapter5.png' },
    // 第6章（index: 6）
    { correctAnswer: '迂路', imageUrl: '/images/quizzes/chapter6.png' },
    // 第7章（index: 7）
    { correctAnswer: ['クサ', '草'], imageUrl: '/images/quizzes/chapter7.png' },
    // 第8章（index: 8）
    { correctAnswer: '稜線', imageUrl: '/images/quizzes/chapter8.png' },
    // 終章（index: 9）- クイズなし
    null,
  ];

  // 章選択画面を表示
  if (showChapterSelect) {
    const chapters = scenes.map((scene, index) => ({
      index,
      title: scene.title || `章 ${index + 1}`,
      isUnlocked: unlockedScenes.has(index),
      isQuizCleared: clearedQuizzes.has(index),
      isCompleted: completedChapters.has(index)
    }));

    // helper: preload images used by a given scene (chapter)
    const preloadChapterImages = async (chapterIndex: number) => {
      const scene = scenes[chapterIndex];
      if (!scene) return;
      const urls = new Set<string>();

      // collect background candidates
      if ((scene as any).background) {
        const name = (scene as any).background;
        ['.jpg', '.png', '.jpeg', '.webp'].forEach(ext => urls.add(`/images/backgrounds/${name}${ext}`));
      }
      (scene.dialogues || []).forEach((d: any) => {
        if (d.background) {
          const name = d.background;
          ['.jpg', '.png', '.jpeg', '.webp'].forEach(ext => urls.add(`/images/backgrounds/${name}${ext}`));
        }
        if (Array.isArray(d.characters)) {
          d.characters.forEach((c: string) => {
            const img = CHARACTER_IMAGES[c];
            if (img) urls.add(img);
            if (c === '零') {
              for (let i = 1; i <= ZERO_FRAMES; i++) {
                urls.add(`/images/zeroAnime/frame${String(i).padStart(2, '0')}.png`);
              }
            }
          });
        }
      });

      const urlArray = Array.from(urls);
      setChapterLoadProgress({loaded: 0, total: urlArray.length});
      setChapterLoading(true);
      setChapterLoadingText('読み込み中...');

      let loaded = 0;
      const promises = urlArray.map((u) => new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => { loaded++; setChapterLoadProgress({loaded, total: urlArray.length}); resolve(); };
        img.onerror = () => { loaded++; setChapterLoadProgress({loaded, total: urlArray.length}); resolve(); };
        img.src = u;
      }));

      // wait for all or timeout
      await Promise.race([Promise.all(promises), new Promise(res => setTimeout(res, 8000))]);
      setTimeout(() => {
        setChapterLoading(false);
        setChapterLoadingText('');
      }, 200);
    };

    return (
      <>
        <ChapterSelect
          chapters={chapters}
          onSelectChapter={(chapterIndex) => {
            (async () => {
              try {
                await preloadChapterImages(chapterIndex);
              } catch (e) {
                console.error('Chapter preload error', e);
              }
              setCurrentSceneIndex(chapterIndex);
              setCurrentDialogueIndex(0);
              setShowChapterSelect(false);
            })();
          }}
          onStartQuiz={(chapterIndex) => {
            console.log('onStartQuiz called:', chapterIndex, 'quizData:', chapterQuizzes[chapterIndex]);
            setQuizTargetScene(chapterIndex);
            setQuizOpen(true);
            // setShowChapterSelect(false); を削除 - 章選択画面を閉じない
          }}
          onBack={() => {
            setShowTitle(true);
            setShowChapterSelect(false);
          }}
        />
        {quizOpen && quizTargetScene !== null && chapterQuizzes[quizTargetScene] && (
          <Quiz
            open={quizOpen}
            correctAnswer={chapterQuizzes[quizTargetScene].correctAnswer}
            imageUrl={chapterQuizzes[quizTargetScene].imageUrl}
            isAlreadyCleared={clearedQuizzes.has(quizTargetScene)}
            onClose={() => { setQuizOpen(false); setQuizTargetScene(null); }}
            onResult={handleQuizResult}
          />
        )}

        {chapterLoading && (
          <div className="chapter-loading-overlay" onClick={(e) => e.stopPropagation()}>
            <div className="chapter-loading-box">
              <div className="spinner" aria-hidden />
              <div style={{color:'#fff'}}>
                <div style={{fontSize:16, fontWeight:700}}>読み込み中...</div>
                <div style={{fontSize:13, opacity:0.9}}>{chapterLoadProgress.loaded} / {chapterLoadProgress.total}</div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  const currentScene = scenes[currentSceneIndex];
  const currentDialogue = currentScene?.dialogues[currentDialogueIndex];
  const isLastDialogue = 
    currentSceneIndex === scenes.length - 1 && 
    currentDialogueIndex === currentScene.dialogues.length - 1;

  if (showEndroll) {
    return <EndRoll onBackToTitle={() => {
      setShowEndroll(false);
      setPendingEndroll(false);
      setShowTitle(true);
      setShowChapterSelect(false);
    }} />;
  }

  const bgClass = (currentDialogue as any)?.background || '';
  const needBrighten = (() => {
    const title = currentScene?.title || '';
    if (currentSceneIndex === 2) return true; // scene3 (1-based) を明るくする
    if (/第三章|消えゆく|消えゆく世界/.test(title)) return true;
    return false;
  })();

  return (
    <div className="visual-novel" onClick={handleClick} onMouseDown={(e) => e.preventDefault()}>
      <style>{`
        .end-fade-overlay{ position:fixed; inset:0; background:#000; pointer-events:none; opacity:0; transition:opacity 2000ms linear; z-index:150 }
        .end-fade-overlay.active{ opacity:1 }
      `}</style>
      {/* 背景エリア */}
      <div className={`background ${bgClass}`}>
        <div className={`background-brighten ${needBrighten ? 'active' : ''}`}></div>
        <div className="background-overlay"></div>
      </div>

      {/* タイトル・章名の中央表示（下から上がって中央で止まる） */}
      {currentDialogueIndex === 0 && !currentDialogue?.speaker && (
        <CenterScrollText duration={900}>
          <div className="center-title">
            <div className="center-title-text">{currentScene.title}</div>
          </div>
        </CenterScrollText>
      )}

      {/* キャラクター表示エリア */}
      <div className="character-area">
        {(() => {
          const characters = getCurrentCharacters();
          
          // キャラクター画像マッピング（定義は上部の定数を参照）
          const characterImages = CHARACTER_IMAGES;

          // 背後に白いもやもや（やや濃いめ）を表示するキャラクター一覧
          const glowCharacters = new Set(['焔', '守', '希', '彁', '問', '結']);

          // キャラクター組み合わせごとの完全な配置定義
          type CharacterLayout = {
            left: string;
            bottom: string;
            scale: number;
            width: number;
            height: number;
            zIndex: number;
          };
          
          const layoutConfigs: Record<string, Record<string, CharacterLayout>> = {
            '["太郎"]': {
              '太郎': {left: '50%', bottom: '8%', scale: 1.0, width: 200, height: 400, zIndex: 10}
            },
            '["太郎","彁"]': {
              '太郎': {left: '35%', bottom: '8%', scale: 1.0, width: 190, height: 380, zIndex: 10},
              '彁': {left: '65%', bottom: '8%', scale: 1.0, width: 200, height: 400, zIndex: 10}
            },
            '["太郎","彁","零"]': {
              '太郎': {left: '25%', bottom: '8%', scale: 1.0, width: 180, height: 360, zIndex: 10},
              '彁': {left: '75%', bottom: '8%', scale: 1.0, width: 190, height: 380, zIndex: 10},
              '零': {left: '50%', bottom: '-75%', scale: 1.0, width: 900, height: 1485, zIndex: 10}
            },
            '["太郎","彁","零","結"]': {
              '太郎': {left: '20%', bottom: '8%', scale: 1.0, width: 170, height: 340, zIndex: 10},
              '彁': {left: '40%', bottom: '8%', scale: 1.0, width: 180, height: 360, zIndex: 10},
              '零': {left: '60%', bottom: '-87%', scale: 1.0, width: 855, height: 1395, zIndex: 10},
              '結': {left: '80%', bottom: '8%', scale: 1.0, width: 165, height: 330, zIndex: 10}
            },
            '["太郎","彁","零","結","守","問","希"]': {
              '太郎': {left: '20%', bottom: '2%', scale: 1.0, width: 170, height: 340, zIndex: 10},
              '彁': {left: '80%', bottom: '-5%', scale: 1.0, width: 170, height: 340, zIndex: 10},
              '零': {left: '50%', bottom: '-75%', scale: 1.0, width: 810, height: 1350, zIndex: 5},
              '結': {left: '10%', bottom: '35%', scale: 1.0, width: 160, height: 320, zIndex: 5},
              '守': {left: '35%', bottom: '35%', scale: 1.0, width: 170, height: 340, zIndex: 5},
              '問': {left: '65%', bottom: '35%', scale: 1.0, width: 160, height: 320, zIndex: 10},
              '希': {left: '90%', bottom: '35%', scale: 1.0, width: 155, height: 310, zIndex: 5}
            },
            '["太郎","彁","零","結","守","問","希","焔"]': {
              '太郎': {left: '20%', bottom: '2%', scale: 1.0, width: 170, height: 340, zIndex: 10},
              '彁': {left: '80%', bottom: '-5%', scale: 1.0, width: 170, height: 340, zIndex: 10},
              '零': {left: '50%', bottom: '-92%', scale: 1.0, width: 810, height: 1350, zIndex: 5},
              '結': {left: '10%', bottom: '35%', scale: 1.0, width: 160, height: 320, zIndex: 5},
              '守': {left: '30%', bottom: '35%', scale: 1.0, width: 170, height: 340, zIndex: 5},
              '問': {left: '70%', bottom: '35%', scale: 1.0, width: 160, height: 320, zIndex: 10},
              '希': {left: '90%', bottom: '35%', scale: 1.0, width: 155, height: 310, zIndex: 5},
              '焔': {left: '50%', bottom: '45%', scale: 1.0, width: 165, height: 330, zIndex: 10}
            },
            '["太郎","彁","零","結","守","問","希","焔","老人"]': {
              '太郎': {left: '20%', bottom: '1%', scale: 1.0, width: 170, height: 340, zIndex: 10},
              '彁': {left: '80%', bottom: '-5%', scale: 1.0, width: 170, height: 340, zIndex: 10},
              '零': {left: '50%', bottom: '-92%', scale: 1.0, width: 810, height: 1350, zIndex: 5},
              '結': {left: '10%', bottom: '45%', scale: 1.0, width: 160, height: 320, zIndex: 5},
              '守': {left: '26%', bottom: '44%', scale: 1.0, width: 170, height: 340, zIndex: 5},
              '問': {left: '72%', bottom: '45%', scale: 1.0, width: 160, height: 320, zIndex: 10},
              '希': {left: '90%', bottom: '45%', scale: 1.0, width: 155, height: 310, zIndex: 5},
              '焔': {left: '41%', bottom: '45%', scale: 1.0, width: 165, height: 330, zIndex: 10},
              '老人': {left: '57%', bottom: '52%', scale: 1.0, width: 140, height: 260, zIndex: 10}
            },
            '["太郎","彁","焔"]': {
              '太郎': {left: '25%', bottom: '8%', scale: 1.0, width: 180, height: 360, zIndex: 10},
              '彁': {left: '50%', bottom: '8%', scale: 1.0, width: 190, height: 380, zIndex: 10},
              '焔': {left: '75%', bottom: '8%', scale: 1.0, width: 175, height: 350, zIndex: 10}
            },
            '["太郎","彁","老人"]': {
              '太郎': {left: '25%', bottom: '8%', scale: 1.0, width: 180, height: 360, zIndex: 10},
              '彁': {left: '50%', bottom: '8%', scale: 1.0, width: 190, height: 380, zIndex: 10},
              '老人': {left: '75%', bottom: '8%', scale: 1.0, width: 160, height: 300, zIndex: 10}
            },
            '["太郎","彁","結"]': {
              '太郎': {left: '25%', bottom: '8%', scale: 1.0, width: 180, height: 360, zIndex: 10},
              '彁': {left: '50%', bottom: '8%', scale: 1.0, width: 190, height: 380, zIndex: 10},
              '結': {left: '75%', bottom: '8%', scale: 1.0, width: 165, height: 330, zIndex: 10}
            },
            '["太郎","彁","守"]': {
              '太郎': {left: '25%', bottom: '8%', scale: 1.0, width: 180, height: 360, zIndex: 10},
              '彁': {left: '50%', bottom: '8%', scale: 1.0, width: 190, height: 380, zIndex: 10},
              '守': {left: '75%', bottom: '8%', scale: 1.0, width: 180, height: 360, zIndex: 10}
            },
            '["太郎","彁","問"]': {
              '太郎': {left: '25%', bottom: '8%', scale: 1.0, width: 180, height: 360, zIndex: 10},
              '彁': {left: '50%', bottom: '8%', scale: 1.0, width: 190, height: 380, zIndex: 10},
              '問': {left: '75%', bottom: '8%', scale: 1.0, width: 170, height: 340, zIndex: 10}
            },
            '["太郎","彁","希"]': {
              '太郎': {left: '25%', bottom: '8%', scale: 1.0, width: 180, height: 360, zIndex: 10},
              '彁': {left: '50%', bottom: '8%', scale: 1.0, width: 190, height: 380, zIndex: 10},
              '希': {left: '75%', bottom: '8%', scale: 1.0, width: 165, height: 330, zIndex: 10}
            },
            '["太郎","クラスメイト"]': {
              '太郎': {left: '35%', bottom: '8%', scale: 1.0, width: 190, height: 380, zIndex: 10},
              'クラスメイト': {left: '65%', bottom: '8%', scale: 1.0, width: 180, height: 360, zIndex: 10}
            },
            '["彁","零"]': {
              '彁': {left: '40%', bottom: '8%', scale: 1.0, width: 200, height: 400, zIndex: 10},
              '零': {left: '60%', bottom: '-89%', scale: 1.0, width: 945, height: 1575, zIndex: 10}
            }
          };

          // 組み合わせキーを生成（順序を保持）
          const layoutKey = JSON.stringify(characters);
          const layout = layoutConfigs[layoutKey];

          if (!layout) {
            // 定義されていない組み合わせの場合はデフォルト配置
            const charCount = characters.length;
            return characters.map((charName, index) => {
              const isSpeaking = speakerIncludes(currentDialogue?.speaker, charName);
              const imageSrc = characterImages[charName] || '/images/man.png';
              
              const leftPosition = charCount === 1 ? 50 : 10 + (80 / (charCount - 1)) * index;
              const scale = Math.max(0.6, 1 - (charCount * 0.08));
              
              const style = {
                position: 'absolute' as const,
                left: `${leftPosition}%`,
                bottom: '8%',
                transform: `translateX(-50%) scale(${scale})`,
                transformOrigin: 'bottom center',
                transition: 'all 0.3s ease',
                zIndex: 10,
                width: '160px',
                height: '320px',
              };

              if (charName === '零') {
                return (
                  <div key={`${charName}-${index}`} className={`zero-gif-container ${isSpeaking ? 'speaking' : ''}`} style={style} aria-hidden>
                    <img
                      src={imageSrc}
                      alt="零"
                      className="zero-sprite"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      id="zero-sprite-img"
                      style={{width: '100%', height: '100%', objectFit: 'contain'}}
                    />
                    <div className="character-name-tag zero-name-tag" style={{position: 'fixed', bottom: '500px', left: `${leftPosition}%`, transform: 'translateX(-50%)', zIndex: 100}}>零</div>
                  </div>
                );
              }

              // デフォルト配置時のもやもや
              const glowNeeded = glowCharacters.has(charName);
              // 正円で上下左右を大きくし、円全体を上へずらす
              const baseSize = 260; // 大きめの円サイズ基準
              const size = Math.round(baseSize * 1.0);
              const glowStyle: React.CSSProperties = {
                position: 'absolute',
                left: '50%',
                bottom: '8%',
                transform: 'translateX(-50%) translateY(-22%)',
                width: `${size}px`,
                height: `${size}px`,
                background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.88) 36%, rgba(255,255,255,0.0) 70%)',
                filter: 'blur(14px)',
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 9,
              };

              return (
                <div key={`${charName}-${index}`} className={`character-container ${isSpeaking ? 'speaking' : ''}`} style={style}>
                  {glowNeeded ? <div className="character-glow" style={glowStyle} /> : null}
                  <img 
                    src={imageSrc}
                    alt={charName}
                    className="character-image"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    style={{width: '100%', height: '100%', objectFit: 'contain', position: 'relative', zIndex: 11}}
                  />
                  <div className="character-name-tag">{charName}</div>
                </div>
              );
            });
          }

          // 定義された配置を使用
          const isCrowded = characters.length >= 7;
          const veryCloseCharacters = ['守', '彁', '問', '結', '希', '焔'];
          return characters.map((charName, index) => {
            const isSpeaking = speakerIncludes(currentDialogue?.speaker, charName);
            const imageSrc = characterImages[charName] || '/images/man.png';
            const config = layout[charName];
            
            if (!config) return null;

            const style = {
              position: 'absolute' as const,
              left: config.left,
              bottom: config.bottom,
              transform: `translateX(-50%) scale(${config.scale})`,
              transformOrigin: 'bottom center',
              transition: 'all 0.3s ease',
              zIndex: config.zIndex,
              width: `${config.width}px`,
              height: `${config.height}px`,
            };
            
            const isVeryClose = isCrowded && veryCloseCharacters.includes(charName);
            
            if (charName === '零') {
              return (
                <div key={`${charName}-${index}`} className={`zero-gif-container ${isSpeaking ? 'speaking' : ''}`} style={style} aria-hidden>
                  <img
                    src={imageSrc}
                    alt="零"
                    className="zero-sprite"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    id="zero-sprite-img"
                    style={{width: '100%', height: '100%', objectFit: 'contain'}}
                  />
                  <div className={`character-name-tag zero-name-tag ${isCrowded ? 'crowded' : ''}`} style={{position: 'fixed', bottom: '500px', left: '50%', transform: 'translateX(-50%)', zIndex: 100}}>零</div>
                </div>
              );
            }

            // 背後のもやもやを表示（指定キャラのみ）
            const glowNeeded = new Set(['焔', '守', '希', '彁', '問', '結']).has(charName);
            // 正円で上下左右を大きくし、円全体を上へずらす（定義済みレイアウト用）
            const confW = typeof config.width === 'number' ? config.width : parseInt(String(config.width)) || 160;
            const confH = typeof config.height === 'number' ? config.height : parseInt(String(config.height)) || confW;
            const size2 = Math.round(Math.min(confW, confH) * 1.6);
            const glowStyle: React.CSSProperties = {
              position: 'absolute',
              left: '50%',
              bottom: config.bottom,
              transform: 'translateX(-50%) translateY(-15%)',
              width: `${size2}px`,
              height: `${size2}px`,
              background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.88) 36%, rgba(255,255,255,0.0) 70%)',
              filter: 'blur(14px)',
              borderRadius: '50%',
              pointerEvents: 'none',
              zIndex: config.zIndex - 1,
            };

            return (
              <div key={`${charName}-${index}`} className={`character-container ${isSpeaking ? 'speaking' : ''}`} style={style}>
                {glowNeeded ? <div className="character-glow" style={glowStyle} /> : null}
                <img 
                  src={imageSrc}
                  alt={charName}
                  className="character-image"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  style={{width: '100%', height: '100%', objectFit: 'contain', position: 'relative', zIndex: 11}}
                />
                <div className={`character-name-tag ${isVeryClose ? 'very-close' : isCrowded ? 'crowded' : ''}`}>{charName}</div>
              </div>
            );
          });
        })()}
      </div>

      {/* テキストボックス */}
      <div className="text-box">
        <div className="dialogue-text">
          {currentDialogue?.text}
        </div>
        {!isLastDialogue && (
          <div className="continue-indicator">▼</div>
        )}
      </div>

      {/* プログレス表示 */}
      <div className="progress-bar">
        Scene {currentSceneIndex + 1} / {scenes.length}
        <span className="dialogue-progress">
          {' '}({currentDialogueIndex + 1} / {currentScene.dialogues.length})
        </span>
      </div>

      {/* 履歴トグル / 履歴パネル */}
      <div style={{position: 'fixed', left: 12, top: 12, zIndex: 60}} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => { e.stopPropagation(); setShowTranscript(s => !s); }}
          style={{padding: '6px 8px', borderRadius: 4, cursor: 'pointer'}}
        >
          ログ
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowChapterSelect(true);
          }}
          style={{padding: '6px 8px', borderRadius: 4, cursor: 'pointer', marginLeft: 8}}
        >
          章選択
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!pendingEndroll && !showEndroll) {
              setPendingEndroll(true);
              setTimeout(() => setShowEndroll(true), ENDROLL_FADE_MS);
            }
          }}
          style={{padding: '6px 8px', borderRadius: 4, cursor: 'pointer', marginLeft: 8}}
        >
          エンドロールへ
        </button>
        {showTranscript && (
          (() => {
            // 表示済み台詞を計算: 先頭シーンから現在のシーン/台詞まで
            const entries: {speaker?: any; text: any; sceneIndex: number; dialogueIndex: number}[] = [];
            for (let si = 0; si <= currentSceneIndex; si++) {
              const s = scenes[si];
              if (!s || !s.dialogues) continue;
              const end = si === currentSceneIndex ? currentDialogueIndex : s.dialogues.length - 1;
              for (let di = 0; di <= end; di++) {
                const d = s.dialogues[di];
                entries.push({speaker: d?.speaker, text: d?.text, sceneIndex: si, dialogueIndex: di});
              }
            }

            return (
              <div className="history-panel" style={{width: 420, maxHeight: 360, overflowY: 'auto', background: 'rgba(0,0,0,0.9)', color: '#fff', fontSize: 13, padding: 10, marginTop: 8, borderRadius: 6}} onClick={(e) => e.stopPropagation()}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                  <div style={{fontWeight: 600}}>ログ</div>
                  <div>
                    <button onClick={(e) => { e.stopPropagation(); setShowTranscript(false); }} style={{marginLeft: 8}}>閉じる</button>
                  </div>
                </div>
                <div style={{whiteSpace: 'pre-wrap'}}>
                  {entries.length === 0 ? (
                    <div style={{opacity: 0.7}}>まだ表示された台詞はありません</div>
                  ) : (
                    entries.map((en, idx) => {
                      const sp = en.speaker;
                      let spLabel = '';
                      if (!sp) spLabel = '';
                      else if (Array.isArray(sp)) spLabel = sp.join(' / ');
                      else spLabel = String(sp);

                      const text = en.text ?? '';
                      return (
                        <div key={`${en.sceneIndex}-${en.dialogueIndex}-${idx}`} style={{marginBottom: 8}}>
                          {spLabel ? (<span style={{color: '#ffd'}}>{spLabel} : </span>) : null}
                          <span style={{color: '#fff'}}>{String(text)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()
        )}
      </div>
      {quizOpen && quizTargetScene !== null && chapterQuizzes[quizTargetScene] ? (
        <Quiz
          open={quizOpen}
          correctAnswer={chapterQuizzes[quizTargetScene].correctAnswer}
          imageUrl={chapterQuizzes[quizTargetScene].imageUrl}
          isAlreadyCleared={clearedQuizzes.has(quizTargetScene)}
          onClose={() => { setQuizOpen(false); setQuizTargetScene(null); }}
          onResult={handleQuizResult}
        />
      ) : null}

      {quizOpen && quizTargetScene !== null && !chapterQuizzes[quizTargetScene] && (
        <div style={{position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200}}>
          <div style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)'}} onClick={() => { setQuizOpen(false); setQuizTargetScene(null); }} />
          <div style={{zIndex:210, width: 'min(640px, 92%)', background: '#111', color: '#fff', padding: 20, borderRadius: 10, boxShadow: '0 6px 30px rgba(0,0,0,0.6)'}} onClick={(e)=>e.stopPropagation()}>
            <div style={{fontSize: 18, marginBottom: 12, fontWeight: 700}}>クイズ - 未設定</div>
            <div style={{marginBottom: 12}}>この章に設定されたクイズはありません。画像がまだアップロードされていない可能性があります。</div>
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: 8}}>
              <button onClick={() => { setQuizOpen(false); setQuizTargetScene(null); }} style={{padding: '8px 12px', borderRadius: 6}}>閉じる</button>
            </div>
          </div>
        </div>
      )}

      <div className={`end-fade-overlay ${pendingEndroll ? 'active' : ''}`} />
    </div>
  );
}
