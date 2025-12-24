type Props = {
  onStart: () => void;
};

export default function TitleScreen({ onStart }: Props) {
  return (
    <div style={{position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg,#ffffff,#f5f7fb)', color: '#0f1720', zIndex: 150, padding: 24}}>
      <div style={{textAlign: 'center', background: '#fff', padding: '36px 48px', borderRadius: 16, boxShadow: '0 8px 30px rgba(15,23,32,0.08)', maxWidth: 720, width: '100%'}}>
        <h1 style={{fontSize: 48, margin: 0, color: '#0b2545'}}>漢字ストーリー</h1>
        <p style={{opacity: 0.85, marginTop: 8, color: '#475569'}}>読んで学ぶ、ちょっとだけゲーム</p>
        <div style={{marginTop: 24}}>
          <button onClick={onStart} style={{padding: '12px 24px', fontSize: 16, borderRadius: 10, cursor: 'pointer', background: '#0b6cff', color: '#fff', border: 'none', boxShadow: '0 6px 18px rgba(11,108,255,0.16)'}}>はじめる</button>
        </div>
      </div>
    </div>
  );
}
