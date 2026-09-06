// ============================================================
// SPEND FORM
// ============================================================
function SpendForm({ available, spending, onSpend }) {
  const [confirm, setConfirm] = useState(null); // null | {amount, label}

  const options = SPEND_PRIZES;

  const getUsedCount = (label) => (spending || []).filter(e => e.memo === label).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {options.map((opt, i) => {
        const usedCount = getUsedCount(opt.label);
        const atLimit = usedCount >= opt.maxUses;
        const canAfford = available >= opt.amount && !atLimit;
        return (
          <button key={i} disabled={!canAfford}
            onClick={() => setConfirm(opt)}
            style={{
              position: 'relative', overflow: 'hidden',
              padding: '16px', borderRadius: 14, textAlign: 'left', cursor: canAfford ? 'pointer' : 'default',
              background: canAfford ? 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(245,158,11,0.08))' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${canAfford ? 'rgba(236,72,153,0.3)' : 'rgba(255,255,255,0.06)'}`,
              opacity: canAfford ? 1 : 0.4, color: '#fff', transition: 'all 0.2s',
            }}>
            {/* 景品画像(A7 2026-08-25): 文字の下に背景として敷く。404時はonErrorで消え、現行のグラデーション背景がそのまま床(現行動作) */}
            <img src={opt.img} alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35, zIndex: 0 }}
              onError={e => { e.currentTarget.style.display = 'none'; }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 4 }}>{opt.label}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 11, opacity: 0.5 }}>{opt.desc}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: atLimit ? '#ef4444' : 'rgba(255,255,255,0.4)' }}>
                  {usedCount}/{opt.maxUses}回
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {confirm && (
        <div style={{ textAlign: 'center', padding: 16, borderRadius: 14, background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.25)' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#ec4899', marginBottom: 4 }}>
            {confirm.label}
          </div>
          <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 12 }}>
            資産から {formatYen(confirm.amount)} を使用します
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn" onClick={() => { onSpend(confirm.amount, confirm.label); setConfirm(null); }}
              style={{ fontSize: 13, padding: '10px 24px', background: 'rgba(236,72,153,0.25)', border: '1px solid rgba(236,72,153,0.5)', color: '#ec4899', fontWeight: 700 }}>
              使用する
            </button>
            <button className="btn bs" style={{ fontSize: 13, padding: '10px 24px' }}
              onClick={() => setConfirm(null)}>
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// COLLECTION VIEW
// ============================================================
function CollectionView({ collection, onSelect, requestMode, onRequest, onCancelRequest, uraUnlocked, uraObtained, showUraMuseum, setShowUraMuseum, setBonuses }) {
  const [filter, setFilter] = useState("all");
  const [uraDetail, setUraDetail] = useState(null);
  const ownedTiers = CONGRATS_TIERS.filter(t => !!collection[t.key]);
  // 神域(第7種族)は cg2_12 所持セーブでのみ展示に出す。「N / 69 COLLECTED」の分母は従来6種で固定し、
  // 神域は別カウント(m/11)として併記する。
  const vTypes = typesFor(collection);
  const shrineUnlocked = shrineOn(collection);
  const shrineOwn = !shrineUnlocked ? 0
    : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter(r => collection[`${SHRINE_ID}_${r}`] || (r === 11 && collection[SHRINE_ID + PRISM_SUFFIX])).length;
  const all = useMemo(() => {
    const list = [];
    RARITIES.slice().reverse().forEach(r => {
      if (r.rank === 12) return; // ★12 is shown separately
      BASE_TYPES.forEach(type => {   // 「N / 69 COLLECTED」の分母は従来6種で固定(神域は別カウント)
        const key = `${type.id}_${r.rank}`;
        const d = MONSTERS[type.id][r.rank - 1];
        if (!d) return;
        const ow = collection[key];
        // ★MAXを煌(_11k)に進化させても「69種COLLECTED」の所持は落とさない
        const pw = r.rank === 11 ? collection[`${type.id}${PRISM_SUFFIX}`] : null;
        list.push({ key, typeId: type.id, typeName: type.name, typeEmoji: type.emoji, typeColor: type.color, rank: r.rank, rarity: r, ...d, owned: !!ow || !!pw, count: ow?.count || 0 });
      });
    });
    return list;
  }, [collection]);
  const shown = filter === "all" ? all : all.filter(m => m.typeId === filter);
  const ownCount = all.filter(m => m.owned).length + ownedTiers.length;
  const totalPwr = Object.entries(collection).reduce((s, [k, m]) => s + entryPower(k, m.count || 0, m.rank), 0);

  return (
    <div>
      {/* Exhibition Hall Header */}
      {/* 見出し: ミニゲーム帯と同形式(金タイポ+飾り罫)。divider.webp 404時は罫が消えるだけ */}
      <div className="scrh">
        <div className="scrh-k">TREASURE EXHIBITION</div>
        <div className="scrh-t">展示室</div>
        <div className="scrh-r">
          <div className="scrh-d f" />
          <div className="scrh-s">{ownCount}<span style={{ opacity: 0.6 }}> / 69 COLLECTED</span>{shrineUnlocked
            ? <span style={{ color: '#2dd4bf', marginLeft: 10 }}>⛩️ 神域 {shrineOwn} / 11</span>
            : <span style={{ color: 'rgba(45,212,191,0.30)', marginLeft: 10, fontSize: '0.85em' }}>⛩️ ??? Tier2で解放</span>}</div>
          <div className="scrh-d" />
        </div>
      </div>
      {requestMode && (
        <div style={{ margin: '0 0 14px', padding: '10px 16px', borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(244,114,182,0.05))',
          border: '1px solid rgba(244,114,182,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#f472b6', marginBottom: 4 }}>
            💌 リクエストモード
          </div>
          <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 8 }}>保有アイテムからリクエストしたいものをタップ（★1〜★10）</div>
          <button onClick={onCancelRequest} style={{ fontSize: 10, padding: '4px 16px', borderRadius: 8,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>キャンセル</button>
        </div>
      )}
      {/* アセット: 9スライスの青銅パネル(panel.webp)。border-image未ロード時は下のborderColorがそのまま床 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={{ flex: 1, textAlign: 'center', padding: '6px 10px', borderRadius: 6,
          background: 'linear-gradient(180deg, rgba(28,21,12,0.75), rgba(13,10,7,0.85))',
          border: '2px solid rgba(201,168,76,0.28)',
          borderImage: 'url(assets/god-another/panel.webp) 60 fill / 9px stretch', borderWidth: 9, borderStyle: 'solid' }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: 'rgba(232,213,163,0.55)', fontWeight: 700 }}>総資産</div>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 900, color: '#f2e0aa',
            textShadow: '0 0 8px rgba(201,168,76,0.4), 0 1px 2px rgba(0,0,0,0.8)' }}>{totalPwr.toLocaleString()}</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center', padding: '6px 10px', borderRadius: 6,
          background: 'linear-gradient(180deg, rgba(28,21,12,0.75), rgba(13,10,7,0.85))',
          border: '2px solid rgba(201,168,76,0.28)',
          borderImage: 'url(assets/god-another/panel.webp) 60 fill / 9px stretch', borderWidth: 9, borderStyle: 'solid' }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: 'rgba(232,213,163,0.55)', fontWeight: 700 }}>総保有数</div>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 900, color: '#f2e0aa',
            textShadow: '0 0 8px rgba(201,168,76,0.4), 0 1px 2px rgba(0,0,0,0.8)' }}>{Object.values(collection).reduce((s, m) => s + m.count, 0)}</div>
        </div>
      </div>
      {/* 種族セット効果: ★1〜★10コンプで常時発動。発動判定・効果値はSET_BONUS_EFFECTS/computeSetBonusesが正 */}
      <div style={{ marginBottom: 14, padding: '8px 10px 10px', borderRadius: 6,
        background: 'linear-gradient(180deg, rgba(28,21,12,0.75), rgba(13,10,7,0.85))',
        border: '2px solid rgba(201,168,76,0.28)',
        borderImage: 'url(assets/god-another/panel.webp) 60 fill / 9px stretch', borderWidth: 9, borderStyle: 'solid' }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: 'rgba(232,213,163,0.55)', fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>SET BONUS ─ 種族コンプ特典</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px' }}>
          {vTypes.map(t => {
            const on = !!(setBonuses && setBonuses[t.id]);
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9.5,
                color: on ? '#f2e0aa' : 'rgba(255,255,255,0.32)', fontWeight: on ? 800 : 500,
                textShadow: on ? '0 0 6px rgba(201,168,76,0.4)' : 'none' }}>
                <span style={{ fontSize: 11, filter: on ? 'none' : 'grayscale(1) opacity(0.5)' }}>{t.emoji}</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{SET_BONUS_EFFECTS[t.id].label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 8, letterSpacing: 1 }}>{on ? 'ON' : `★1-10`}</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* ★12 Congratulations - 3 treasure display cases */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 12, position: 'relative', padding: '8px 0' }}>
          <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)' }} />
          <div style={{ fontSize: 8, letterSpacing: 3, opacity: 0.35, fontFamily: "'Rajdhani',sans-serif", color: '#ffd700' }}>— HALL OF GLORY —</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div className="rank-diamond" style={{ fontSize: 13, fontWeight: 900, letterSpacing: 4, fontFamily: "'Orbitron',sans-serif" }}>CONGRATULATIONS</div>
            {uraUnlocked && !showUraMuseum && (
              <span onClick={() => setShowUraMuseum(true)}
                style={{ fontSize: 6, color: 'rgba(100,80,150,0.12)', cursor: 'pointer', letterSpacing: 1, fontFamily: "'Rajdhani',sans-serif" }}>
                隠し通路
              </span>
            )}
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CONGRATS_TIERS.map(ct => {
            const owned = !!collection[ct.key];
            return (
              <div key={ct.key} style={{
                position: 'relative', overflow: 'hidden', borderRadius: 16,
                background: owned
                  ? 'linear-gradient(180deg, rgba(20,15,30,0.95), rgba(10,8,18,0.98))'
                  : 'linear-gradient(180deg, rgba(15,12,22,0.6), rgba(8,6,14,0.7))',
                border: owned
                  ? `2px solid ${ct.tierColor}50`
                  : '1px solid rgba(255,255,255,0.06)',
                opacity: owned ? 1 : 0.4,
                ...(owned ? { boxShadow: `0 0 20px ${ct.tierColor}20, inset 0 0 30px ${ct.tierColor}08` } : {}),
              }}>
                {/* Animated border for owned */}
                {owned && <div style={{ position: 'absolute', inset: -2, borderRadius: 18,
                  background: ct.tier === 1
                    ? 'linear-gradient(135deg, #ffd700, #ffed4a, #ffd700, #b8860b, #ffd700) border-box'
                    : ct.tier === 2
                      ? 'conic-gradient(from 0deg, #ff6b6b, #ffd93d, #6bff6b, #6bc5ff, #d06bff, #ff6b6b) border-box'
                      : 'conic-gradient(from 0deg, #00ffcc, #ffd700, #ff69b4, #7b68ee, #00ffcc) border-box',
                  backgroundSize: ct.tier === 1 ? '300% 100%' : undefined,
                  animation: ct.tier === 1 ? 'gradShift 3s ease infinite' : 'synthMaxRotate 5s linear infinite',
                  WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor', maskComposite: 'exclude', pointerEvents: 'none' }} />}
                {/* Inner display case */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 14 }}>
                  {/* Pedestal with icon */}
                  <div style={{
                    width: 64, height: 64, borderRadius: 14, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: owned
                      ? `radial-gradient(circle, ${ct.tierColor}18, transparent 70%)`
                      : 'rgba(255,255,255,0.02)',
                    border: owned ? `1px solid ${ct.tierColor}30` : '1px dashed rgba(255,255,255,0.08)',
                  }}>
                    <div style={{
                      fontSize: owned ? 40 : 28,
                      filter: owned ? `drop-shadow(0 0 12px ${ct.tierColor}) drop-shadow(0 0 24px ${ct.tierColor}80)` : 'none',
                      animation: owned ? `heroIconFloat ${2.5 - ct.tier * 0.2}s ease-in-out infinite` : 'none',
                    }}>
                      {owned ? ct.icon : renderLockIcon(28)}
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span className={owned ? (ct.tier >= 3 ? 'rank-ultimate' : ct.tier === 2 ? 'rank-congrats' : 'rank-diamond') : ''}
                        style={{ fontSize: 12, fontWeight: 900, color: owned ? undefined : 'rgba(255,255,255,0.25)', letterSpacing: 1 }}>
                        {owned ? ct.name : '???'}
                      </span>
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: ct.tierColor, opacity: owned ? 0.8 : 0.3, letterSpacing: 2, marginBottom: 2 }}>
                      {ct.tierLabel}
                    </div>
                    <div style={{ fontSize: 8, opacity: owned ? 0.5 : 0.3 }}>
                      {owned ? ct.desc : '???'}
                    </div>
                  </div>
                  {/* Value */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {owned ? (
                      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 900, color: '#fbbf24' }}>
                        💰{formatYen(POWER_VALUES[11])}
                      </div>
                    ) : (
                      <div style={{ fontSize: 9, opacity: 0.2 }}>未取得</div>
                    )}
                  </div>
                </div>
                {/* Bottom decorative line */}
                {owned && <div style={{ height: 2,
                  background: ct.tier === 1
                    ? 'linear-gradient(90deg, transparent, rgba(255,215,0,0.4), transparent)'
                    : ct.tier === 2
                      ? 'linear-gradient(90deg, transparent, rgba(255,105,180,0.4), rgba(255,215,0,0.3), transparent)'
                      : 'linear-gradient(90deg, transparent, rgba(0,255,204,0.4), rgba(123,104,238,0.3), transparent)',
                }} />}
              </div>
            );
          })}
        </div>
      </div>
      {/* ★11 ★MAX Collection - 6 items exhibition */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 10, position: 'relative', padding: '6px 0' }}>
          <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.25), transparent)' }} />
          <div style={{ fontSize: 8, letterSpacing: 3, opacity: 0.3, fontFamily: "'Rajdhani',sans-serif", color: '#a78bfa' }}>— LEGEND WING —</div>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <span className="rank-diamond" style={{ fontSize: 12, fontWeight: 900, letterSpacing: 3, fontFamily: "'Orbitron',sans-serif" }}>★MAX COLLECTION</span>
            <span style={{ position: 'absolute', top: -6, right: -48, fontSize: 8, color: '#ffd700', opacity: 0.35, fontWeight: 700, whiteSpace: 'nowrap' }}>×1 <span style={{ opacity: 0.5 }}>and</span> ×3</span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.25), transparent)' }} />
        </div>
        <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(180deg, rgba(20,15,35,0.9), rgba(10,8,20,0.95))',
          border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Top decorative line */}
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), rgba(139,92,246,0.3), rgba(255,255,255,0.15), transparent)' }} />
          <div style={{ padding: '14px 12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {vTypes.map((type, i) => {
                const k = `${type.id}_11`;
                const ow = collection[k];
                // 煌(進化済み)は同じ★MAX枠のバッジで見せる(66種グリッドの分母は変えない)
                const prismCount = collection[`${type.id}${PRISM_SUFFIX}`]?.count || 0;
                const owned = !!ow || prismCount > 0;
                const monster = MONSTERS[type.id][10];
                const count = ow?.count || 0;
                const sel = count > 0
                  ? { key: k, ...monster, typeId: type.id, typeName: type.name, typeEmoji: type.emoji, typeColor: type.color, rank: 11, rarity: RARITIES[10], count }
                  : { key: `${type.id}${PRISM_SUFFIX}`, ...monster, name: monster.name + PRISM_NAME_SUFFIX, typeId: type.id, typeName: type.name, typeEmoji: type.emoji, typeColor: type.color, rank: 11, rarity: RARITIES[10], prism: true, count: prismCount };
                return (
                  <div key={type.id} onClick={() => owned && onSelect(sel)}
                    style={{
                    borderRadius: 12, padding: '10px 6px', textAlign: 'center',
                    position: 'relative', overflow: 'hidden', cursor: owned ? 'pointer' : 'default',
                    background: owned
                      ? `radial-gradient(ellipse at 50% 30%, ${type.color}15, transparent 70%)`
                      : 'rgba(255,255,255,0.02)',
                    border: owned
                      ? `1px solid ${type.color}40`
                      : '1px dashed rgba(255,255,255,0.06)',
                    ...(owned ? { boxShadow: `0 0 15px ${type.color}15, inset 0 1px 0 rgba(255,255,255,0.05)` } : {}),
                  }}>
                    {/* Shimmer overlay for owned */}
                    {owned && <div style={{ position: 'absolute', inset: 0,
                      background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)',
                      backgroundSize: '200% 200%', animation: 'gradShift 4s ease infinite', pointerEvents: 'none' }} />}
                    <div style={{
                      marginBottom: 4,
                      filter: owned ? `drop-shadow(0 0 8px ${type.color}) drop-shadow(0 0 16px ${type.color}60)` : 'none',
                      animation: owned ? `heroIconFloat ${2.5 + i * 0.2}s ease-in-out infinite` : 'none',
                      opacity: owned ? 1 : 0.2,
                    }}>
                      {owned ? (
                        renderItemIcon({ ...monster, rank: 11 }, 40)
                      ) : (
                        renderLockIcon(24)
                      )}
                    </div>
                    {owned && count > 1 && <div style={{ position: 'absolute', top: 4, right: 6,
                      fontSize: 8, fontWeight: 900, color: '#fbbf24', background: 'rgba(0,0,0,0.5)',
                      borderRadius: 6, padding: '0 4px' }}>×{count}</div>}
                    {/* 煌バッジ: rank-rainbowはbackground-clip:textのため背景を重ねると文字が透明化する(2026-08-25実バグ)。金文字+黒ピルで明示 */}
                    {prismCount > 0 && <div style={{ position: 'absolute', top: 4, left: 6,
                      fontSize: 9, fontWeight: 900, color: '#ffd700', background: 'rgba(0,0,0,0.6)',
                      border: '1px solid rgba(255,215,0,0.55)', textShadow: '0 0 6px rgba(255,215,0,0.8)',
                      borderRadius: 6, padding: '0 5px' }}>煌{prismCount > 1 ? '×' + prismCount : ''}</div>}
                    <div className={owned ? 'rank-diamond' : ''} style={{
                      fontSize: 8, fontWeight: 900,
                      color: owned ? undefined : 'rgba(255,255,255,0.15)',
                    }}>
                      {owned ? (count > 0 ? monster.name : monster.name + PRISM_NAME_SUFFIX) : '???'}
                    </div>
                    <div style={{ fontSize: 7, color: type.color, opacity: owned ? 0.5 : 0.15, marginTop: 1 }}>
                      {type.emoji} {type.name}
                    </div>
                    {owned && <div style={{ fontSize: 7, color: '#a78bfa', opacity: 0.6, marginTop: 1 }}>
                      💰{formatYen(POWER_VALUES[10])}
                    </div>}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Bottom decorative line */}
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.2), rgba(255,215,0,0.15), rgba(139,92,246,0.2), transparent)' }} />
        </div>
      </div>
      {/* Legendary Collection - ★10 and ★9 in structured grid */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 10, position: 'relative', padding: '6px 0' }}>
          <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.15), transparent)' }} />
          <div style={{ fontSize: 8, letterSpacing: 3, opacity: 0.3, fontFamily: "'Rajdhani',sans-serif", color: '#fbbf24' }}>— RARE WING —</div>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, fontFamily: "'Orbitron',sans-serif", opacity: 0.6 }}>LEGENDARY COLLECTION</div>
          <div style={{ position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.15), transparent)' }} />
        </div>
        <div style={{ borderRadius: 16, overflow: 'hidden',
          background: 'linear-gradient(180deg, rgba(20,15,35,0.9), rgba(10,8,20,0.95))',
          border: '1px solid rgba(139,92,246,0.15)' }}>
          {/* ★10 GOD section */}
          <div style={{ padding: '12px 12px 8px' }}>
            <div style={{ fontSize: 8, textAlign: 'center', opacity: 0.35, marginBottom: 8, fontFamily: "'Rajdhani',sans-serif", letterSpacing: 2 }}>★10 GOD</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {vTypes.map((type, i) => {
                const k = `${type.id}_10`;
                const ow = collection[k];
                const owned = !!ow;
                const monster = MONSTERS[type.id][9];
                const count = ow?.count || 0;
                return (
                  <div key={k} onClick={() => {
                      if (!owned) return;
                      const item = { key: k, ...monster, typeId: type.id, typeName: type.name, typeEmoji: type.emoji, typeColor: type.color, rank: 10, rarity: RARITIES[9], count };
                      if (requestMode) { onRequest(item); return; }
                      onSelect(item);
                    }}
                    style={{ borderRadius: 10, padding: '8px 4px', textAlign: 'center', cursor: owned ? 'pointer' : 'default',
                    background: owned ? `radial-gradient(ellipse at 50% 30%, ${RARITIES[9].color}12, transparent 70%)` : 'rgba(255,255,255,0.02)',
                    border: owned ? `1px solid ${RARITIES[9].color}30` : '1px dashed rgba(255,255,255,0.05)',
                  }}>
                    <div style={{ fontSize: owned ? 32 : 22, opacity: owned ? 1 : 0.15,
                      filter: owned ? `drop-shadow(0 0 6px ${RARITIES[9].color})` : 'none',
                      animation: owned ? `heroIconFloat ${2.5 + i * 0.2}s ease-in-out infinite` : 'none' }}>
                      {owned ? renderItemIcon({ ...monster, rank: 10 }, 32) : renderLockIcon(22)}
                    </div>
                    {owned && count > 1 && <div style={{ fontSize: 7, color: '#fbbf24', fontWeight: 900 }}>×{count}</div>}
                    <div className={owned ? 'rank-rainbow' : ''} style={{ fontSize: 7, fontWeight: 900, color: owned ? undefined : 'rgba(255,255,255,0.12)' }}>
                      {owned ? monster.name : '???'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Divider */}
          <div style={{ height: 1, margin: '0 12px', background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.15), transparent)' }} />
          {/* ★9 MYTHIC section */}
          <div style={{ padding: '8px 12px 12px' }}>
            <div style={{ fontSize: 8, textAlign: 'center', opacity: 0.35, marginBottom: 8, fontFamily: "'Rajdhani',sans-serif", letterSpacing: 2 }}>★9 MYTHIC</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {vTypes.map((type, i) => {
                const k = `${type.id}_9`;
                const ow = collection[k];
                const owned = !!ow;
                const monster = MONSTERS[type.id][8];
                const count = ow?.count || 0;
                return (
                  <div key={k} onClick={() => {
                      if (!owned) return;
                      const item = { key: k, ...monster, typeId: type.id, typeName: type.name, typeEmoji: type.emoji, typeColor: type.color, rank: 9, rarity: RARITIES[8], count };
                      if (requestMode) { onRequest(item); return; }
                      onSelect(item);
                    }}
                    style={{ borderRadius: 10, padding: '8px 4px', textAlign: 'center', cursor: owned ? 'pointer' : 'default',
                    background: owned ? `radial-gradient(ellipse at 50% 30%, ${RARITIES[8].color}12, transparent 70%)` : 'rgba(255,255,255,0.02)',
                    border: owned ? `1px solid ${RARITIES[8].color}30` : '1px dashed rgba(255,255,255,0.05)',
                  }}>
                    <div style={{ fontSize: owned ? 32 : 22, opacity: owned ? 1 : 0.15,
                      filter: owned ? `drop-shadow(0 0 6px ${RARITIES[8].color})` : 'none',
                      animation: owned ? `heroIconFloat ${2.5 + i * 0.2}s ease-in-out infinite` : 'none' }}>
                      {owned ? renderItemIcon({ ...monster, rank: 9 }, 32) : renderLockIcon(22)}
                    </div>
                    {owned && count > 1 && <div style={{ fontSize: 7, color: '#fbbf24', fontWeight: 900 }}>×{count}</div>}
                    <div className={owned ? 'rank-gold' : ''} style={{ fontSize: 7, fontWeight: 900, color: owned ? undefined : 'rgba(255,255,255,0.12)' }}>
                      {owned ? monster.name : '???'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {/* Main Gallery - ★8 down, each rank in 3×2 grid */}
      <div style={{ textAlign: 'center', marginBottom: 10, marginTop: 20, position: 'relative' }}>
        <div style={{ position: 'absolute', top: -10, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,180,140,0.2), transparent)' }} />
        <div style={{ fontSize: 7, letterSpacing: 2, opacity: 0.25, fontFamily: "'Rajdhani',sans-serif" }}>— TREASURE VAULT —</div>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, fontFamily: "'Rajdhani',sans-serif", opacity: 0.5 }}>COLLECTION ARCHIVE</div>
        <div style={{ fontSize: 8, opacity: 0.2, marginTop: 2 }}>★1 ~ ★8</div>
      </div>
      <div style={{ borderRadius: 16, overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(18,14,30,0.95), rgba(8,6,16,0.98))',
        border: '1px solid rgba(139,92,246,0.1)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.3)' }}>
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.15), rgba(200,180,140,0.1), rgba(139,92,246,0.15), transparent)' }} />
        {RARITIES.slice(0, 8).reverse().map((r, ri) => {
          const rkCls = r.rank === 8 ? 'rank-silver' : r.rank === 7 ? 'rank-epic' : r.rank === 6 ? 'rank-ultra' : '';
          return (
            <div key={r.rank}>
              {ri > 0 && <div style={{ height: 1, margin: '0 12px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />}
              <div style={{ padding: ri === 0 ? '12px 12px 8px' : '8px 12px' }}>
                <div style={{ fontSize: 8, textAlign: 'center', opacity: 0.3, marginBottom: 6, fontFamily: "'Rajdhani',sans-serif", letterSpacing: 2 }}>
                  ★{r.rank} {r.label.toUpperCase()}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {vTypes.map((type, i) => {
                    const k = `${type.id}_${r.rank}`;
                    const ow = collection[k];
                    const owned = !!ow;
                    const monster = MONSTERS[type.id][r.rank - 1];
                    const count = ow?.count || 0;
                    return (
                      <div key={k} onClick={() => {
                          if (!owned) return;
                          const item = { key: k, ...monster, typeId: type.id, typeName: type.name, typeEmoji: type.emoji, typeColor: type.color, rank: r.rank, rarity: r, count };
                          if (requestMode && r.rank < 11) { onRequest(item); return; }
                          onSelect(item);
                        }}
                        style={{ borderRadius: 10, padding: '6px 4px', textAlign: 'center', cursor: owned ? 'pointer' : 'default',
                        background: owned ? `radial-gradient(ellipse at 50% 30%, ${r.color}10, transparent 70%)` : 'rgba(255,255,255,0.01)',
                        border: owned ? `1px solid ${r.color}25` : '1px dashed rgba(255,255,255,0.04)',
                      }}>
                        <div style={{ fontSize: owned ? 28 : 20, opacity: owned ? 1 : 0.12,
                          filter: owned ? `drop-shadow(0 0 4px ${r.color}80)` : 'none' }}>
                          {owned ? renderItemIcon({ ...monster, rank: r.rank }, 28) : renderLockIcon(20)}
                        </div>
                        {owned && count > 1 && <div style={{ fontSize: 7, color: '#fbbf24', fontWeight: 900 }}>×{count}</div>}
                        <div className={owned ? rkCls : ''} style={{ fontSize: 7, fontWeight: 700, color: owned ? (rkCls ? undefined : r.color) : 'rgba(255,255,255,0.1)' }}>
                          {owned ? monster.name : '???'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.15), rgba(200,180,140,0.1), rgba(139,92,246,0.15), transparent)' }} />
      </div>

      {/* Hidden Passage to Ura Museum */}
      {/* Ura Museum */}
      {showUraMuseum && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: '#050505', overflowY: 'auto', padding: '16px', paddingTop: 50, paddingBottom: 90 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 16, padding: '14px 0', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(80,60,40,0.3), transparent)' }} />
            <div style={{ fontSize: 8, letterSpacing: 5, color: 'rgba(80,60,40,0.5)', fontFamily: "'Rajdhani',sans-serif", marginBottom: 4 }}>SHADOW COLLECTION</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'rgba(120,100,70,0.6)', fontFamily: "'Orbitron',sans-serif", letterSpacing: 4 }}>
              裏展示室
            </div>
            <div style={{ fontSize: 10, color: 'rgba(90,70,50,0.5)', marginTop: 4 }}>
              {uraObtained.length}<span style={{ opacity: 0.4 }}> / {URA_ITEMS.length}</span>
            </div>
            <div style={{ fontSize: 9, color: 'rgba(100,80,50,0.35)', marginTop: 2 }}>
              総価値: {(URA_ITEMS.filter(u => uraObtained.includes(u.id)).reduce((s, u) => s + u.value, 0) / 100000000).toLocaleString()}億円
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(80,60,40,0.3), transparent)' }} />
          </div>
          <div style={{ textAlign: 'right', marginBottom: 10 }}>
            <button onClick={() => setShowUraMuseum(false)}
              style={{ background: 'rgba(30,25,15,0.5)', border: '1px solid rgba(60,45,30,0.2)',
                borderRadius: 6, padding: '4px 12px', fontSize: 9, color: 'rgba(100,80,50,0.5)',
                cursor: 'pointer' }}>
              ← 展示室に戻る
            </button>
          </div>
          {/* Items by rank */}
          <div style={{ borderRadius: 14, overflow: 'hidden', background: 'rgba(8,6,4,0.95)', border: '1px solid rgba(60,45,30,0.15)' }}>
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(80,60,40,0.2), transparent)' }} />
            {[11,10,9,8,7,6,5,4,3,2,1].map((rank, ri) => (
              <div key={rank}>
                {ri > 0 && <div style={{ height: 1, margin: '0 12px', background: 'linear-gradient(90deg, transparent, rgba(60,45,30,0.1), transparent)' }} />}
                <div style={{ padding: ri === 0 ? '10px 12px 8px' : '8px 12px' }}>
                  <div style={{ fontSize: 7, textAlign: 'center', marginBottom: 5, fontFamily: "'Rajdhani',sans-serif", letterSpacing: 2, color: 'rgba(90,70,50,0.35)' }}>
                    ★{rank} {rank === 11 ? 'MAX' : RARITIES[rank - 1]?.label.toUpperCase()}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                    {BASE_TYPES.map(type => {   // 裏展示室は従来6種66件で固定
                      const uraId = `ura_${type.id}_${rank}`;
                      const owned = uraObtained.includes(uraId);
                      const uraItem = URA_ITEMS.find(u => u.id === uraId);
                      if (!uraItem) return null;
                      return (
                        <div key={uraId} onClick={() => owned && setUraDetail(uraItem)}
                          style={{ borderRadius: 8, padding: '5px 3px', textAlign: 'center',
                          cursor: owned ? 'pointer' : 'default',
                          background: owned ? 'rgba(15,12,8,0.9)' : 'rgba(8,6,4,0.6)',
                          border: owned ? '1px solid rgba(80,60,40,0.2)' : '1px solid rgba(30,25,15,0.15)',
                        }}>
                          <div style={{ fontSize: owned ? 26 : 18, opacity: owned ? 0.8 : 0.08,
                            filter: owned ? 'brightness(0.7) sepia(0.3) drop-shadow(0 0 4px rgba(80,60,40,0.3))' : 'brightness(0.2) grayscale(1)' }}>
                            {owned ? renderItemIcon(uraItem, 26, { filter: 'none' }) : '❓'}
                          </div>
                          <div style={{ fontSize: 6, fontWeight: 700, color: owned ? 'rgba(140,110,70,0.6)' : 'rgba(50,40,25,0.2)', marginTop: 1 }}>
                            {owned ? uraItem.name : '???'}
                          </div>
                          {owned && <div style={{ fontSize: 5, color: 'rgba(100,80,50,0.3)' }}>{(uraItem.value / 100000000)}億円</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(80,60,40,0.2), transparent)' }} />
          </div>
          <div style={{ textAlign: 'center', marginTop: 20, marginBottom: 20 }}>
            <button onClick={() => setShowUraMuseum(false)}
              style={{ background: 'rgba(30,25,15,0.5)', border: '1px solid rgba(60,45,30,0.2)',
                borderRadius: 8, padding: '8px 24px', fontSize: 10, color: 'rgba(100,80,50,0.4)',
                cursor: 'pointer', letterSpacing: 1 }}>
              展示室に戻る
            </button>
          </div>
          {/* Ura item detail modal */}
          {uraDetail && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9500, background: 'rgba(0,0,0,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setUraDetail(null)}>
              <div style={{ background: 'rgba(10,8,5,0.98)', border: '1px solid rgba(80,60,40,0.3)',
                borderRadius: 16, padding: '28px 24px', maxWidth: 300, width: '90%', textAlign: 'center',
                position: 'relative' }}
                onClick={e => e.stopPropagation()}>
                {/* Value badge top-right */}
                <div style={{ position: 'absolute', top: 12, right: 14, fontSize: 10, fontWeight: 700,
                  color: 'rgba(140,110,70,0.7)', fontFamily: "'Orbitron',sans-serif" }}>
                  {(uraDetail.value / 100000000).toLocaleString()}億円
                </div>
                {/* Icon */}
                <div style={{ fontSize: 64, marginBottom: 12,
                  filter: 'brightness(0.7) sepia(0.3) drop-shadow(0 0 8px rgba(80,60,40,0.4))' }}>
                  {renderItemIcon(uraDetail, 64, { filter: 'none' })}
                </div>
                {/* Name */}
                <div style={{ fontSize: 18, fontWeight: 900, color: 'rgba(140,110,70,0.7)', marginBottom: 4,
                  fontFamily: "'Orbitron',sans-serif" }}>
                  {uraDetail.name}
                </div>
                {/* Stars */}
                <div style={{ fontSize: 12, color: 'rgba(80,60,40,0.4)', letterSpacing: 2, marginBottom: 8 }}>
                  {'★'.repeat(uraDetail.rank)}
                </div>
                {/* Type */}
                <div style={{ fontSize: 11, color: 'rgba(100,80,50,0.4)' }}>
                  {uraDetail.typeEmoji} {uraDetail.typeName}
                </div>
                {/* Close */}
                <button onClick={() => setUraDetail(null)}
                  style={{ marginTop: 16, background: 'rgba(30,25,15,0.5)', border: '1px solid rgba(60,45,30,0.2)',
                    borderRadius: 8, padding: '6px 20px', fontSize: 10, color: 'rgba(100,80,50,0.5)',
                    cursor: 'pointer' }}>
                  閉じる
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// SYNTHESIS VIEW
// ============================================================
function SynthView({ collection, synthResult, onFindCandidates, onFindPrism, onSynthSingle, onSynthAll }) {
  const [filter, setFilter] = useState("all");
  const [confirmAll, setConfirmAll] = useState(false);

  const candidates = useMemo(() => onFindCandidates(), [collection, onFindCandidates]);
  // ★MAX進化(煌)。一撃合成の件数(totalSynthable / cascadeTotal)には意図的に含めない。
  const prismCandidates = useMemo(() => onFindPrism ? onFindPrism() : [], [collection, onFindPrism]);
  const totalSynthable = candidates.reduce((sum, c) => sum + c.synthCount, 0);
  // 一撃合成: 連鎖分まで含めた合成予定件数(乱択は種族のみで件数は決定的)
  const cascadeTotal = useMemo(() => runSynthCascade(collection).totalSynths, [collection]);
  const chainExtra = Math.max(0, cascadeTotal - totalSynthable);

  // All owned monsters sorted by type then rank
  const owned = useMemo(() => {
    return Object.entries(collection).map(([k, v]) => ({ key: k, ...v }))
      .sort((a, b) => {
        if (a.rank !== b.rank) return b.rank - a.rank; // レアリティ高い順
        return TYPES.findIndex(t => t.id === a.typeId) - TYPES.findIndex(t => t.id === b.typeId); // 同ランク内は獣→竜→精霊→魔族→神獣
      });
  }, [collection]);

  const shown = filter === "all" ? owned : owned.filter(m => m.typeId === filter);

  return (
    <div>
      {/* Header with gradient */}
      {/* 見出し: 展示室と同形式(金タイポ+飾り罫)。divider.webp 404時は罫が消えるだけ */}
      <div className="scrh">
        <div className="scrh-k">TREASURE SYNTHESIS</div>
        <div className="scrh-t">合成</div>
        <div className="scrh-r">
          <div className="scrh-d f" />
          <div className="scrh-s" style={{ letterSpacing: 0, opacity: 0.7 }}>✦</div>
          <div className="scrh-d" />
        </div>
        <div style={{ fontSize: 10, lineHeight: 2, color: '#9a8f7a', marginTop: 8, letterSpacing: 0.3 }}>
          同種族・同ランク: ★1-2=2体, ★3-9=3体 → ランクUP<br/>★10を3体(異種OK) → ★MAXランダム<br/>同じ★MAXを3体 → 「・煌」に進化(資産価値そのまま)<br/>※各アイテム1個はコレクション用に保持
        </div>
      </div>

      {/* Synth result animation */}
      {synthResult && (
        synthResult.rank >= 9 && !synthResult.batch ? (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9990, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: synthResult.rank >= 10
              ? 'radial-gradient(circle, rgba(80,40,0,0.92), rgba(0,0,0,0.97))'
              : synthResult.rank === 9
                ? 'radial-gradient(circle, rgba(60,40,0,0.92), rgba(0,0,0,0.97))'
                : 'radial-gradient(circle, rgba(40,45,60,0.92), rgba(0,0,0,0.97))',
            pointerEvents: 'auto', animation: 'ri 0.4s ease-out' }}>
            <div style={{ marginBottom: 12, animation: 'heroIconFloat 2s ease-in-out infinite',
              filter: `drop-shadow(0 0 20px ${synthResult.rarity.color}) drop-shadow(0 0 40px ${synthResult.rarity.color}80)` }}>
              {synthResult.img ? renderItemIcon(synthResult, 80) : <span style={{ fontSize: 80 }}>{synthResult.icon}</span>}
            </div>
            <div className={synthResult.rank >= 10 ? 'rank-rainbow' : synthResult.rank === 9 ? 'rank-gold' : 'rank-silver'}
              style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, fontFamily: "'Rajdhani',sans-serif", marginBottom: 6 }}>
              {renderStars(synthResult.rank)}
            </div>
            <div className="rare-god-text" style={{ fontSize: 22, fontWeight: 900,
              background: synthResult.rank >= 10
                ? 'linear-gradient(90deg, #ff6b6b, #ffd93d, #6bff6b, #6bc5ff, #d06bff, #ff6b6b)'
                : synthResult.rank === 9
                  ? 'linear-gradient(180deg, #ffd700, #fff8dc, #ffd700)'
                  : 'linear-gradient(180deg, #e8edf3, #c8d6e5, #e8edf3)',
              backgroundSize: synthResult.rank >= 10 ? '200% 100%' : '100% 300%',
              animation: synthResult.rank >= 10 ? 'rainbowText 1.5s linear infinite' : 'gradShift 2s ease infinite',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              filter: `drop-shadow(0 0 10px ${synthResult.rarity.color}80)`,
              fontFamily: "'Orbitron',sans-serif" }}>
              {synthResult.name}
            </div>
            <div style={{ fontSize: 13, color: synthResult.rarity.color, marginTop: 8, fontWeight: 700, opacity: 0.8 }}>
              {synthResult.prism ? '★MAX進化 完了！' : `${synthResult.rarity.label} 獲得！`}
            </div>
          </div>
        ) : synthResult.batch && synthResult.rareItems && synthResult.rareItems.length > 0 ? (
          synthResult.rareIndex >= 0 ? (() => {
            const item = synthResult.rareItems[synthResult.rareIndex];
            const isMax = item.rank >= 11;
            const isGod = item.rank === 10;
            return (
              <React.Fragment key={synthResult.rareIndex}>
                {/* ★MAX: triple burst flash */}
                {isMax && <>
                  <div className="rare-flash" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.6), rgba(255,107,255,0.5), rgba(107,197,255,0.5), rgba(107,255,107,0.4))', animationDuration: '0.6s' }} />
                  <div className="rare-flash" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.5), transparent 50%)', animationDuration: '0.8s', animationDelay: '0.2s' }} />
                  <div className="rare-shake" style={{ position: 'fixed', inset: 0, zIndex: 9997, pointerEvents: 'none' }} />
                </>}
                {/* ★10: GOD flash + shake (same as gacha) */}
                {isGod && <>
                  <div className="rare-flash" style={{ background: 'linear-gradient(135deg, rgba(255,107,107,0.4), rgba(255,209,61,0.4), rgba(107,255,107,0.4), rgba(107,197,255,0.4), rgba(208,107,255,0.4))' }} />
                  <div className="rare-shake" style={{ position: 'fixed', inset: 0, zIndex: 9997, pointerEvents: 'none' }} />
                </>}
                <div style={{ position: 'fixed', inset: 0, zIndex: 9990, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: isMax
                    ? 'radial-gradient(circle, rgba(50,20,0,0.95), rgba(0,0,0,0.98))'
                    : isGod
                      ? 'radial-gradient(circle, rgba(80,40,0,0.92), rgba(0,0,0,0.97))'
                      : item.rank === 9
                        ? 'radial-gradient(circle, rgba(60,40,0,0.92), rgba(0,0,0,0.97))'
                        : 'radial-gradient(circle, rgba(40,45,60,0.92), rgba(0,0,0,0.97))',
                  pointerEvents: 'auto' }}>
                  {/* ★MAX: rotating rainbow ring */}
                  {isMax && <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%',
                    border: '3px solid transparent',
                    background: 'conic-gradient(from 0deg, #ff6b6b, #ffd93d, #6bff6b, #6bc5ff, #d06bff, #ff6b6b) border-box',
                    WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor', maskComposite: 'exclude',
                    animation: 'synthMaxRotate 3s linear infinite',
                    opacity: 0.6 }} />}
                  {/* ★MAX: pulsing glow */}
                  {isMax && <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%',
                    animation: 'synthMaxPulse 2s ease-in-out infinite' }} />}
                  {/* ★MAX: burst particles */}
                  {isMax && <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,215,0,0.4), transparent 70%)',
                    animation: 'synthMaxBurst 1.5s ease-out forwards' }} />}
                  {/* Counter */}
                  <div style={{ position: 'absolute', top: 24, right: 20, fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: "'Rajdhani',sans-serif" }}>
                    {synthResult.rareIndex + 1} / {synthResult.rareItems.length}
                  </div>
                  {/* Icon */}
                  <div className={isMax ? '' : isGod ? 'rare-rainbow' : ''} style={{
                    fontSize: isMax ? 100 : isGod ? 80 : 80, lineHeight: 0, marginBottom: isMax ? 16 : 12,
                    animation: isMax ? 'synthMaxIcon 1s cubic-bezier(0.34,1.56,0.64,1) forwards, heroIconFloat 2s ease-in-out 1s infinite' : 'synthGodIcon 0.6s ease-out forwards, heroIconFloat 2s ease-in-out 0.6s infinite',
                    filter: isMax
                      ? 'drop-shadow(0 0 30px rgba(255,215,0,0.9)) drop-shadow(0 0 60px rgba(255,107,255,0.5)) drop-shadow(0 0 90px rgba(255,255,255,0.3))'
                      : isGod
                        ? 'drop-shadow(0 0 20px rgba(255,107,129,0.8)) drop-shadow(0 0 40px rgba(255,215,0,0.5))'
                        : `drop-shadow(0 0 20px ${item.rarity.color}) drop-shadow(0 0 40px ${item.rarity.color}80)` }}>
                    {item.img ? renderItemIcon(item, isMax ? 90 : isGod ? 70 : 70) : item.icon}
                  </div>
                  {/* Title text for ★MAX */}
                  {isMax && <div className="rare-god-text" style={{ fontSize: 14, fontWeight: 900, letterSpacing: 6,
                    color: '#ffd700', textShadow: '0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,215,0,0.4)',
                    fontFamily: "'Rajdhani',sans-serif", marginBottom: 10 }}>
                    ★ M A X
                  </div>}
                  {/* Title text for ★10 GOD */}
                  {isGod && <div className="rare-god-text" style={{ fontSize: 28, fontWeight: 900,
                    background: 'linear-gradient(90deg, #ff6b6b, #ffd93d, #6bff6b, #6bc5ff, #d06bff, #ff6b6b)',
                    backgroundSize: '200% 100%', animation: 'rareGodText 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards, rainbowText 1.5s linear 0.8s infinite',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 15px rgba(255,215,0,0.6))',
                    fontFamily: "'Orbitron',sans-serif", letterSpacing: 8 }}>
                    G O D 合 成
                  </div>}
                  {/* Stars for ★8-9 */}
                  {!isMax && !isGod && <div className={item.rank === 9 ? 'rank-gold' : 'rank-silver'}
                    style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, fontFamily: "'Rajdhani',sans-serif", marginBottom: 6 }}>
                    {renderStars(item.rank)}
                  </div>}
                  {/* Name */}
                  <div className="rare-god-text" style={{
                    fontSize: isMax ? 26 : isGod ? 22 : 22, fontWeight: 900, marginTop: isGod ? 12 : 0,
                    background: isMax
                      ? 'linear-gradient(135deg, #ffd700, #fff, #ff69b4, #ffd700)'
                      : isGod
                        ? 'linear-gradient(90deg, #ff6b6b, #ffd93d, #6bff6b, #6bc5ff, #d06bff, #ff6b6b)'
                        : item.rank === 9
                          ? 'linear-gradient(180deg, #ffd700, #fff8dc, #ffd700)'
                          : 'linear-gradient(180deg, #e8edf3, #c8d6e5, #e8edf3)',
                    backgroundSize: isMax ? '300% 300%' : (isGod ? '200% 100%' : '100% 300%'),
                    animation: isMax ? 'rareGodText 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards, gradShift 2s ease 0.8s infinite' : (isGod ? 'rareGodText 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards, rainbowText 1.5s linear 0.8s infinite' : 'rareGodText 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards, gradShift 2s ease 0.8s infinite'),
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    filter: isMax ? 'drop-shadow(0 0 15px rgba(255,255,255,0.6))' : `drop-shadow(0 0 10px ${item.rarity.color}80)`,
                    fontFamily: "'Orbitron',sans-serif" }}>
                    {isMax ? `伝説の${item.name}！` : item.name}
                  </div>
                  {/* Subtitle */}
                  <div style={{ fontSize: isMax ? 15 : 13, color: isMax ? '#ffd700' : item.rarity.color, marginTop: 8, fontWeight: 700, opacity: 0.8,
                    textShadow: isMax ? '0 0 10px rgba(255,215,0,0.5)' : 'none' }}>
                    {isMax ? '至高の合成' : isGod ? 'GOD 獲得！' : `${item.rarity.label} 獲得！`}
                  </div>
                  {/* ★10 stars */}
                  {isGod && <div style={{ fontSize: 12, color: 'rgba(255,215,0,0.5)', marginTop: 6, fontFamily: "'Rajdhani',sans-serif", letterSpacing: 4 }}>
                    ★ ★ ★ ★ ★ ★ ★ ★ ★ ★
                  </div>}
                  {item.count > 1 && <div style={{ fontSize: 14, color: '#fbbf24', fontWeight: 900, marginTop: 6 }}>×{item.count}</div>}
                </div>
              </React.Fragment>
            );
          })() : (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9990, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'radial-gradient(circle, rgba(30,20,50,0.94), rgba(0,0,0,0.97))',
              pointerEvents: 'auto', animation: 'ri 0.4s ease-out' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24', marginBottom: 16, fontFamily: "'Orbitron',sans-serif" }}>
                ✨ {synthResult.count}件の合成完了！
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', maxWidth: 320 }}>
                {synthResult.rareItems.map((item, i) => (
                  <div key={i} style={{ textAlign: 'center', animation: `ri 0.3s ease-out ${i * 0.1}s both` }}>
                    <div style={{ filter: `drop-shadow(0 0 8px ${item.rarity.color})` }}>{item.img ? renderItemIcon(item, 36) : <span style={{ fontSize: 36 }}>{item.icon}</span>}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: item.rarity.color }}>{item.name}{item.count > 1 ? ` ×${item.count}` : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          <div style={{ textAlign: 'center', margin: '16px 0', animation: 'ri 0.4s ease-out',
            background: 'rgba(139,92,246,0.08)', borderRadius: 14, padding: 16 }}>
            {synthResult.batch ? (
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fbbf24' }}>
                ✨ {synthResult.count}件の合成完了！
              </div>
            ) : (
              <div>
                <div>{synthResult.img ? renderItemIcon(synthResult, 48) : <span style={{ fontSize: 48 }}>{synthResult.icon}</span>}</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: synthResult.rarity.color }}>
                  {synthResult.name} 獲得！
                </div>
                <div style={{ fontSize: 12, color: synthResult.rarity.color }}>
                  {renderStars(synthResult.rank)}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Batch synth button */}
      {totalSynthable > 0 && (
        <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(236,72,153,0.06))',
          border: '1px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: 16, marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', marginBottom: 10 }}>
            🔥 合成可能: {totalSynthable}件{chainExtra > 0 && <span style={{ color: '#f472b6' }}>（連鎖で+{chainExtra}件）</span>}
          </div>
          <button className="btn bp" style={{ fontSize: 14 }} onClick={() => setConfirmAll(true)}>
            ⚡ 一撃合成（{cascadeTotal}件）
          </button>
        </div>
      )}

      {/* Confirmation dialog */}
      {confirmAll && (
        <div className="mo" onClick={() => setConfirmAll(false)}>
          <div className="mc" style={{ borderColor: '#f1c40f' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>⚗️</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#f1c40f', marginBottom: 12 }}>
              一撃合成の確認
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>以下の該当トレジャーを全て合成します：</div>
            {chainExtra > 0 && <div style={{ fontSize: 11, color: '#f472b6', marginBottom: 8 }}>↳ 合成で生まれたトレジャーも連鎖して自動合成（さらに+{chainExtra}件）</div>}
            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 16, textAlign: 'left' }}>
              {candidates.map((c, ci) => {
                if (c.special === 'star10') {
                  return (
                    <div key="star10" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 12 }}>
                      <span>💎</span>
                      <span style={{ color: '#ff6b81', fontWeight: 700 }}>★10 全種 ×{c.synthCount * 3}</span>
                      <span style={{ color: '#fbbf24' }}>→</span>
                      <span>🌟</span>
                      <span className="rank-diamond" style={{ fontWeight: 700 }}>★MAX ×{c.synthCount}(ランダム)</span>
                    </div>
                  );
                }
                const item = collection[c.key];
                if (!item) return null;
                const target = MONSTERS[c.typeId][c.targetRank - 1];
                const tRarity = RARITIES[c.targetRank - 1];
                return (
                  <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11 }}>
                    <span style={{ flexShrink: 0 }}>{item.img ? renderItemIcon(item, 14) : item.icon}</span>
                    <span style={{ color: item.rarity.color, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                      {item.name} ×{c.synthCount * c.req}
                    </span>
                    <span style={{ color: '#fbbf24', flexShrink: 0 }}>→</span>
                    <span style={{ flexShrink: 0 }}>{target.icon}</span>
                    <span style={{ color: tRarity.color, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                      {target.name} ×{c.synthCount}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn bp" style={{ fontSize: 13, padding: '10px 20px' }}
                onClick={() => { setConfirmAll(false); onSynthAll(); }}>
                ⚡ 合成する！
              </button>
              <button className="btn bs" style={{ fontSize: 13, padding: '10px 20px' }}
                onClick={() => setConfirmAll(false)}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ★MAX進化(煌) — 一撃合成には含めない。1件ずつ手動で行う特別な操作 */}
      {prismCandidates.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>★MAX進化</div>
          <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 8 }}>
            同じ★MAXを3体 →「・煌」1体に進化。資産価値は3体分のまま／一撃合成の対象外
          </div>
          {prismCandidates.map(c => {
            const monster = MONSTERS[c.typeId][10];
            const tp = TYPES.find(t => t.id === c.typeId);
            return (
              <div key={'prism_' + c.typeId} style={{
                background: 'linear-gradient(135deg, rgba(208,107,255,0.1), rgba(107,197,255,0.06))',
                border: '1px solid rgba(208,107,255,0.25)',
                borderRadius: 12, padding: 12, marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ textAlign: 'center', minWidth: 56 }}>
                  <div>{renderItemIcon({ ...monster, rank: 11 }, 28)}</div>
                  <div className="rank-diamond" style={{ fontSize: 8, fontWeight: 700 }}>{monster.name}</div>
                  <div style={{ fontSize: 8, color: tp.color }}>★MAX ×{c.count}（3体で進化）</div>
                </div>
                <div style={{ fontSize: 18, color: '#fbbf24' }}>→</div>
                <div style={{ textAlign: 'center', minWidth: 56 }}>
                  <div>{renderItemIcon({ ...monster, rank: 11 }, 28)}</div>
                  <div className="rank-rainbow" style={{ fontSize: 8, fontWeight: 700 }}>{monster.name}{PRISM_NAME_SUFFIX}</div>
                  <div className="rank-rainbow" style={{ fontSize: 8, fontWeight: 700 }}>煌</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <button className="btn bp" style={{ fontSize: 11, padding: '6px 12px' }}
                    onClick={() => onSynthSingle('prism', c.typeId, 11, 11)}>
                    進化{c.synthCount > 1 ? `(${c.synthCount}回可)` : ''}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Individual candidates */}
      {candidates.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>合成可能なトレジャー</div>
          {candidates.map((c, ci) => {
            if (c.special === 'star10') {
              return (
                <div key="star10" style={{
                  background: 'linear-gradient(135deg, rgba(255,107,129,0.1), rgba(255,215,0,0.06))',
                  border: '1px solid rgba(255,107,129,0.2)',
                  borderRadius: 12, padding: 12, marginBottom: 8,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{ textAlign: 'center', minWidth: 56 }}>
                    <div style={{ fontSize: 28 }}>💎</div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: '#ff6b81' }}>★10 全種</div>
                    <div style={{ fontSize: 8, color: '#ff6b81' }}>計{c.total10}体</div>
                  </div>
                  <div style={{ fontSize: 18, color: '#fbbf24' }}>→</div>
                  <div style={{ textAlign: 'center', minWidth: 56 }}>
                    <div style={{ fontSize: 28 }}>🌟</div>
                    <div className="rank-diamond" style={{ fontSize: 8, fontWeight: 700 }}>★MAX</div>
                    <div style={{ fontSize: 8, color: '#fff', opacity: 0.6 }}>ランダム</div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <button className="btn bp" style={{ fontSize: 11, padding: '6px 12px' }}
                      onClick={() => onSynthSingle('star10', null, 10, 11)}>
                      合成{c.synthCount > 1 ? `(${c.synthCount}回可)` : ''}
                    </button>
                  </div>
                </div>
              );
            }
            const item = collection[c.key];
            if (!item) return null;
            const targetMonster = MONSTERS[c.typeId][c.targetRank - 1];
            const targetRarity = RARITIES[c.targetRank - 1];
            return (
              <div key={c.key} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: 12, marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ textAlign: 'center', minWidth: 56 }}>
                  <div>{item.img ? renderItemIcon(item, 28) : <span style={{ fontSize: 28 }}>{item.icon}</span>}</div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: item.rarity.color }}>{item.name}</div>
                  <div style={{ fontSize: 8, color: item.rarity.color }}>
                    ★{item.rank} ×{item.count}（{c.req}体で合成）
                  </div>
                </div>
                <div style={{ fontSize: 18, color: '#fbbf24' }}>→</div>
                <div style={{ textAlign: 'center', minWidth: 56 }}>
                  <div style={{ fontSize: 28 }}>{targetMonster.icon}</div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: targetRarity.color }}>{targetMonster.name}</div>
                  <div style={{ fontSize: 8, color: targetRarity.color }}>★{c.targetRank}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <button className="btn bp" style={{ fontSize: 11, padding: '6px 12px' }}
                    onClick={() => onSynthSingle(c.key, c.typeId, c.rank, c.targetRank)}>
                    合成{c.synthCount > 1 ? `(${c.synthCount}回可)` : ''}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full inventory */}
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>保有トレジャー一覧</div>
      <div className="tf2">
        <button className={`tfb ${filter === "all" ? 'act' : ''}`} onClick={() => setFilter("all")}>全て</button>
        {typesFor(collection).map(t => (
          <button key={t.id} className={`tfb ${filter === t.id ? 'act' : ''}`} onClick={() => setFilter(t.id)}>
            <span className="tfe">{t.emoji}</span>{t.name}
          </button>
        ))}
      </div>
      <div className="sgl">
        {shown.map(item => {
          const synthable = candidates.find(c => c.key === item.key) || prismCandidates.find(c => c.key === item.key);
          const rkCls = item.prism ? 'rank-rainbow' : item.rank >= 11 ? 'rank-diamond' : item.rank === 10 ? 'rank-rainbow' : item.rank === 9 ? 'rank-gold' : item.rank === 8 ? 'rank-silver' : item.rank === 7 ? 'rank-epic' : item.rank === 6 ? 'rank-ultra' : '';
          return (
            <div key={item.key} className={`ci ${item.rank >= 10 ? 'god' : ''}`}
              style={{
                borderColor: item.rarity.color + '60',
                background: synthable ? 'rgba(241,196,15,0.1)' : 'rgba(255,255,255,0.03)',
              }}>
              <div>{item.img ? renderItemIcon(item, 22) : <span style={{ fontSize: 22 }}>{item.icon}</span>}</div>
              {item.count > 0 && <div className="ic">×{item.count}</div>}
              <div className={rkCls} style={{ fontSize: 7, fontWeight: 700, color: rkCls ? undefined : item.rarity.color }}>{item.name}</div>
              <div className={rkCls} style={{ fontSize: 6, color: rkCls ? undefined : item.rarity.color }}>
                {item.prism ? "煌" : item.rank === 11 ? "MAX" : "★" + item.rank}
              </div>
              {synthable && <div style={{ fontSize: 6, color: '#fbbf24', fontWeight: 700 }}>合成可</div>}
            </div>
          );
        })}
        {shown.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', opacity: 0.4, padding: 30, fontSize: 13 }}>
            まだトレジャーがありません。ガチャを引こう！
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// GAME HISTORY SCREEN (Play counts from Firebase rankings)
// ============================================================
function GameHistoryScreen() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameTab, setGameTab] = useState("tap");

  const HISTORY_GAMES = {
    tap: '👊 連打バトル', shooting: '🎯 シューティング', gem: '💎 ジュエルキャッチ', timing: '⏱️ ルパンタイマー',
    tower: '🪙 コインタワー', memory: '🃏 神経衰弱', quickdraw: '🔫 早撃ちガンマン',
    coinRunner: '🏃 コインランナー', juggler: '🎰 ジャグラー', godAnother: '⚡ ゴッドアナザー', batting: '⚾ バッティングヒーロー', pinball: '🎱 ピンボール', chainBurst: '💥 チェインバースト',
    mathEasy: '➕ 計算初級', kuku: '🔢 九九', mathMid: '📐 計算中級', mathHardAdd: '🧮 上級±', mathHardMult: '✖️ 上級×÷'
  };

  const GAME_TABS = [
    { id: "tap", icon: "👊", name: "連打" },
    { id: "shooting", icon: "🎯", name: "射的" },
    { id: "gem", icon: "💎", name: "キャッチ" },
    { id: "timing", icon: "⏱️", name: "タイマー" },
    { id: "tower", icon: "🪙", name: "タワー" },
    { id: "memory", icon: "🃏", name: "神経衰弱" },
    { id: "quickdraw", icon: "🔫", name: "早撃ち" },
    { id: "coinRunner", icon: "🏃", name: "ランナー" },
    { id: "juggler", icon: "🎰", name: "ジャグラー" },
    { id: "godAnother", icon: "⚡", name: "ゴッド" },
    { id: "batting", icon: "⚾", name: "バッティング" },
    { id: "pinball", icon: "🎱", name: "ピンボール" },
    { id: "chainBurst", icon: "💥", name: "チェイン" },
    { id: "mathEasy", icon: "➕", name: "初級+" },
    { id: "kuku", icon: "🔢", name: "九九" },
    { id: "mathMid", icon: "📐", name: "中級+" },
    { id: "mathHardAdd", icon: "🧮", name: "上級±" },
    { id: "mathHardMult", icon: "✖️", name: "上級×÷" },
  ];

  useEffect(() => {
    setLoading(true);
    if (!window.fbDb) { setLoading(false); return; }
    // 画面を開きっぱなしでも最新化されるようリアルタイム購読(アンマウントでoff)
    const ref = window.fbDb.ref('rankings');
    const handler = ref.on('value', snapshot => {
      const entries = [];
      snapshot.forEach(child => {
        const d = child.val();
        if (d && d.name) entries.push(d);
      });
      setRankings(entries);
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off('value', handler);
  }, []);

  const sorted = useMemo(() => {
    return rankings
      .filter(r => (r.playCounts?.[gameTab] || 0) > 0)
      .sort((a, b) => (b.playCounts?.[gameTab] || 0) - (a.playCounts?.[gameTab] || 0));
  }, [rankings, gameTab]);

  const medal = (i) => `${i + 1}`;

  return (
    <div>
      <div style={{ margin: '0 -16px', padding: '20px 16px 16px',
        background: 'linear-gradient(160deg, rgba(96,165,250,0.1) 0%, rgba(139,92,246,0.08) 100%)',
        borderBottom: '1px solid rgba(96,165,250,0.15)', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>📋 ゲーム履歴</div>
        <div style={{ fontSize: 11, opacity: 0.4 }}>みんなのプレイ回数</div>
      </div>

      {/* Game tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {GAME_TABS.map(g => (
          <button key={g.id} className={`tfb ${gameTab === g.id ? 'act' : ''}`}
            style={{ padding: '4px 8px', fontSize: 10 }}
            onClick={() => setGameTab(g.id)}>
            <span className="tfe">{g.icon}</span>{g.name}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#93c5fd' }}>
        {HISTORY_GAMES[gameTab]}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, opacity: 0.4 }}>読み込み中...</div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, opacity: 0.4 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 13 }}>まだプレイデータがありません</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>ミニゲームをプレイしてセーブすると記録されます</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14,
              background: i === 0 ? 'linear-gradient(135deg, rgba(96,165,250,0.12), rgba(96,165,250,0.06))'
                : i === 1 ? 'linear-gradient(135deg, rgba(200,214,229,0.08), rgba(200,214,229,0.03))'
                : i === 2 ? 'linear-gradient(135deg, rgba(205,127,50,0.08), rgba(205,127,50,0.03))'
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${i === 0 ? 'rgba(96,165,250,0.25)' : i < 3 ? 'rgba(200,214,229,0.15)' : 'rgba(255,255,255,0.06)'}`,
            }}>
              <div style={{ fontSize: 14, width: 28, textAlign: 'center', fontWeight: 900,
                fontFamily: "'Orbitron',sans-serif", color: 'rgba(255,255,255,0.6)' }}>
                {medal(i)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: i === 0 ? '#93c5fd' : '#e0e0e0' }}>{s.name}</div>
              </div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 900, color: '#93c5fd' }}>
                {(s.playCounts?.[gameTab] || 0).toLocaleString()}回
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// RANKING SCREEN
// ============================================================
function RankingScreen() {
  const [tab, setTab] = useState(0);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState([]);
  const [dailyGameData, setDailyGameData] = useState([]);
  const [assetMode, setAssetMode] = useState('cumulative'); // 'daily' | 'weekly' | 'cumulative'
  const [assetGrowth, setAssetGrowth] = useState([]); // [{name, growth}]

  useEffect(() => {
    setLoading(true);
    if (!window.fbDb) { setLoading(false); return; }
    // 画面を開きっぱなしでも最新化されるようリアルタイム購読(アンマウントでoff)
    const ref = window.fbDb.ref('rankings');
    const handler = ref.on('value', snapshot => {
      const entries = [];
      snapshot.forEach(child => {
        const d = child.val();
        if (d && d.name) entries.push(d);
      });
      setRankings(entries);
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off('value', handler);
  }, []);

  // Load weekly/daily minigame ranking data
  useEffect(() => {
    if (tab !== 4 || assetMode === 'cumulative' || !window.fbDb) return;
    // Load daily data
    if (assetMode === 'daily') {
      const today = getLocalDate();
      window.fbDb.ref('dailyRankings/' + today).once('value').then(snapshot => {
        const entries = [];
        snapshot.forEach(child => {
          const scores = child.val();
          if (scores) entries.push({ name: child.key, bestScores: scores });
        });
        setDailyGameData(entries);
      });
    }
    const weekId = getWeekId();
    window.fbDb.ref('weeklyRankings/' + weekId).once('value').then(snapshot => {
      const entries = [];
      snapshot.forEach(child => {
        const scores = child.val();
        if (scores) entries.push({ name: child.key, bestScores: scores });
      });
      setWeeklyData(entries);
    });
  }, [assetMode, tab]);

  // Load growth data for daily/weekly (assets, pulls, gifts)
  useEffect(() => {
    if (![0, 2, 3].includes(tab) || assetMode === 'cumulative' || !window.fbDb || rankings.length === 0) return;
    const today = getLocalDate();
    const yesterday = getLocalDate(new Date(Date.now() - 86400000));
    const weekId = getWeekId();
    const prevWeek = (() => { const d = new Date(); d.setDate(d.getDate() - 7); d.setHours(0,0,0,0); const day = d.getDay(); d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); return getLocalDate(d); })();
    const trackingType = tab === 0 ? 'assetTracking' : tab === 2 ? 'pullTracking' : 'giftTracking';
    const currentField = tab === 0 ? 'totalAssets' : tab === 2 ? 'totalPulls' : 'totalGiftValue';
    const basePath = assetMode === 'daily'
      ? trackingType + '/daily/' + yesterday
      : trackingType + '/weekly/' + prevWeek;
    window.fbDb.ref(basePath).once('value').then(snap => {
      const base = snap.val() || {};
      setAssetGrowth(rankings.map(r => ({
        ...r, growth: (r[currentField] || 0) - (base[r.name] || 0)
      })).sort((a, b) => b.growth - a.growth));
    });
  }, [tab, assetMode, rankings]);

  const [gameTab, setGameTab] = useState("tap");

  const tabs = [
    { icon: "💰", label: "総資産" },
    { icon: "🏛️", label: "展示室" },
    { icon: "🎰", label: "ガチャ回数" },
    { icon: "🎁", label: "ギフト" },
    { icon: "🎮", label: "ゲーム" },
    { icon: "★", label: "裏" },
  ];

  const GAME_TABS = [
    { id: "tap", icon: "👊", name: "連打" },
    { id: "shooting", icon: "🎯", name: "射的" },
    { id: "gem", icon: "💎", name: "キャッチ" },
    { id: "timing", icon: "⏱️", name: "タイマー" },
    { id: "tower", icon: "🪙", name: "タワー" },
    { id: "memory", icon: "🃏", name: "神経衰弱" },
    { id: "quickdraw", icon: "🔫", name: "早撃ち" },
    { id: "coinRunner", icon: "🏃", name: "ランナー" },
    { id: "juggler", icon: "🎰", name: "ジャグラー" },
    { id: "godAnother", icon: "⚡", name: "ゴッド" },
    { id: "batting", icon: "⚾", name: "バッティング" },
    { id: "pinball", icon: "🎱", name: "ピンボール" },
    { id: "chainBurst", icon: "💥", name: "チェイン" },
    { id: "mathEasy", icon: "➕", name: "初級+" },
    { id: "kuku", icon: "🔢", name: "九九" },
    { id: "mathMid", icon: "📐", name: "中級+" },
    { id: "mathHardAdd", icon: "🧮", name: "上級±" },
    { id: "mathHardMult", icon: "✖️", name: "上級×÷" },
  ];

  const sorted = useMemo(() => {
    const gk = scoreKeyOf(gameTab);   // スコアの世代キー(godAnother=第8次で世代交代済み)
    // Minigame tab: weekly uses weeklyRankings data
    if (tab === 4 && assetMode === 'weekly') {
      const list = [...weeklyData];
      list.sort((a, b) => ((b.bestScores?.[gk]) || 0) - ((a.bestScores?.[gk]) || 0));
      return list.filter(r => (r.bestScores?.[gk] || 0) > 0);
    }
    // Minigame tab: daily uses dailyRankings data
    if (tab === 4 && assetMode === 'daily') {
      const list = [...dailyGameData];
      list.sort((a, b) => ((b.bestScores?.[gk]) || 0) - ((a.bestScores?.[gk]) || 0));
      return list.filter(r => (r.bestScores?.[gk] || 0) > 0);
    }
    // Daily/weekly growth for assets, pulls, gifts
    if ([0, 2, 3].includes(tab) && assetMode !== 'cumulative' && assetGrowth.length > 0) {
      return assetGrowth;
    }
    const list = [...rankings];
    if (tab === 0) list.sort((a, b) => (b.totalAssets || 0) - (a.totalAssets || 0));
    else if (tab === 1) list.sort((a, b) => (b.colCount || 0) - (a.colCount || 0));
    else if (tab === 2) list.sort((a, b) => (b.totalPulls || 0) - (a.totalPulls || 0));
    else if (tab === 3) list.sort((a, b) => (b.totalGiftValue || 0) - (a.totalGiftValue || 0));
    else if (tab === 5) { list.sort((a, b) => (b.uraCount || 0) - (a.uraCount || 0)); return list; }
    else {
      list.sort((a, b) => ((b.bestScores?.[gk]) || 0) - ((a.bestScores?.[gk]) || 0));
      return list.filter(r => (r.bestScores?.[gk] || 0) > 0);
    }
    return list;
  }, [rankings, weeklyData, dailyGameData, tab, gameTab, assetMode, assetGrowth]);

  const medal = (i) => `${i + 1}`;

  return (
    <div>
      <div style={{ margin: '0 -16px', padding: '20px 16px 16px',
        background: 'linear-gradient(160deg, rgba(255,215,0,0.1) 0%, rgba(139,92,246,0.08) 100%)',
        borderBottom: '1px solid rgba(255,215,0,0.15)', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>🏆 ランキング</div>
        <div style={{ fontSize: 11, opacity: 0.4 }}>セーブ時にランキングが更新されます</div>
      </div>


      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {tabs.map((t, i) => (
          <button key={i} className={`tfb ${tab === i ? 'act' : ''}`}
            style={{ flex: i === 5 ? 0.3 : 1, textAlign: 'center', padding: i === 5 ? '6px 1px' : '6px 2px', fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden',
              ...(i === 5 ? { opacity: tab === 5 ? 0.4 : 0.1, minWidth: 0 } : {}) }}
            onClick={() => setTab(i)}>
            <span style={{ fontSize: i === 5 ? 8 : 14 }}>{t.icon}</span><br/><span style={{ fontSize: i === 5 ? 5 : 8 }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Period sub-tabs for assets, pulls, gifts, minigames */}
      {[0, 2, 3, 4].includes(tab) && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
          {[
            { id: 'daily', label: '今日' },
            { id: 'weekly', label: '今週' },
            { id: 'cumulative', label: '累計' },
          ].map(m => (
            <button key={m.id} className={`tfb ${assetMode === m.id ? 'act' : ''}`}
              style={{ flex: 1, textAlign: 'center', padding: '6px 4px', fontSize: 11 }}
              onClick={() => setAssetMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Game sub-tabs for minigame ranking */}
      {tab === 4 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
          {GAME_TABS.map(g => (
            <button key={g.id} className={`tfb ${gameTab === g.id ? 'act' : ''}`}
              style={{ padding: '4px 8px', fontSize: 10 }}
              onClick={() => setGameTab(g.id)}>
              <span className="tfe">{g.icon}</span>{g.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, opacity: 0.4 }}>読み込み中...</div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, opacity: 0.4 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
          <div style={{ fontSize: 13 }}>まだランキングデータがありません</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>ニックネームを設定してセーブすると登録されます</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map((r, i) => (
            <div key={r.name + i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14,
              background: i === 0 ? 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(245,158,11,0.06))'
                : i === 1 ? 'linear-gradient(135deg, rgba(200,214,229,0.08), rgba(200,214,229,0.03))'
                : i === 2 ? 'linear-gradient(135deg, rgba(205,127,50,0.08), rgba(205,127,50,0.03))'
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${i === 0 ? 'rgba(255,215,0,0.25)' : i < 3 ? 'rgba(200,214,229,0.15)' : 'rgba(255,255,255,0.06)'}`,
            }}>
              <div style={{ fontSize: 14, width: 28, height: 28, textAlign: 'center', fontWeight: 900,
                fontFamily: "'Orbitron',sans-serif", color: 'rgba(255,255,255,0.6)', position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* 順位エンブレム(A7 2026-08-25): 1-3位のみ。404時はonErrorで消え、現行の数字表示がそのまま床(現行動作) */}
                {i < 3 && (
                  <img src={`assets/ui/medal-${i + 1}.webp`} alt=""
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={e => { e.currentTarget.style.display = 'none'; }} />
                )}
                <span style={{ position: 'relative', zIndex: 1, textShadow: i < 3 ? '0 1px 3px rgba(0,0,0,0.9)' : 'none' }}>{medal(i)}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={r.congratsTier >= 3 ? 'rank-ultimate' : r.congratsTier === 2 ? 'rank-congrats' : r.congratsTier === 1 ? 'rank-diamond' : ''}
                    style={{ fontSize: 13, fontWeight: 900, color: r.congratsTier ? undefined : '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>{r.name}</span>
                  {r.congratsTier >= 3 && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8,
                    background: 'linear-gradient(135deg, rgba(0,255,204,0.25), rgba(123,104,238,0.2))',
                    border: '1px solid rgba(0,255,204,0.5)', fontWeight: 900, letterSpacing: 1,
                    boxShadow: '0 0 8px rgba(0,255,204,0.3)' }}>
                    <span className="rank-ultimate" style={{ fontSize: 9 }}>💠T3</span></span>}
                  {r.congratsTier === 2 && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8,
                    background: 'linear-gradient(135deg, rgba(255,105,180,0.15), rgba(255,215,0,0.1))',
                    border: '1px solid rgba(255,105,180,0.3)', fontWeight: 900, letterSpacing: 1 }}>
                    <span className="rank-congrats" style={{ fontSize: 9 }}>🌈T2</span></span>}
                  {r.congratsTier === 1 && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8,
                    background: 'rgba(255,215,0,0.1)',
                    border: '1px solid rgba(255,215,0,0.3)', fontWeight: 900 }}>
                    <span style={{ fontSize: 9, color: '#ffd700' }}>👑T1</span></span>}
                </div>
                <div style={{ fontSize: 11, opacity: 0.5, display: 'flex', gap: 8 }}>
                  <span>💰{formatYen(r.totalAssets || 0)}</span>
                  <span>📖{r.colCount || 0}/69</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {tab === 0 && (
                  <div style={{ textAlign: 'right' }}>
                    {assetMode !== 'cumulative' ? (
                      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 900,
                        color: (r.growth || 0) > 0 ? '#4ade80' : '#fbbf24' }}>
                        {(r.growth || 0) > 0 ? '+' : ''}{formatYen(r.growth || 0)}
                      </div>
                    ) : (
                      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 900, color: '#fbbf24' }}>
                        {formatYen(r.totalAssets || 0)}
                      </div>
                    )}
                  </div>
                )}
                {tab === 1 && (
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, fontWeight: 900, color: '#c084fc' }}>
                    {r.colCount || 0}<span style={{ fontSize: 10, opacity: 0.5 }}>/69</span>
                  </div>
                )}
                {tab === 2 && (
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 900,
                    color: assetMode !== 'cumulative' && (r.growth || 0) > 0 ? '#4ade80' : '#ec4899' }}>
                    {assetMode !== 'cumulative'
                      ? ((r.growth || 0) > 0 ? '+' : '') + (r.growth || 0).toLocaleString() + '回'
                      : '🎰' + (r.totalPulls || 0).toLocaleString() + '回'}
                  </div>
                )}
                {tab === 3 && (
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 900,
                    color: assetMode !== 'cumulative' && (r.growth || 0) > 0 ? '#4ade80' : '#c084fc' }}>
                    {assetMode !== 'cumulative'
                      ? ((r.growth || 0) > 0 ? '+' : '') + formatYen(r.growth || 0)
                      : '🎁' + formatYen(r.totalGiftValue || 0)}
                  </div>
                )}
                {tab === 4 && (
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, fontWeight: 900, color: '#fbbf24' }}>
                    🪙{r.bestScores?.[scoreKeyOf(gameTab)] || 0}
                  </div>
                )}
                {tab === 5 && (
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 900, color: 'rgba(200,180,255,0.7)' }}>
                    ★{r.uraCount || 0}<span style={{ fontSize: 9, opacity: 0.4 }}>/66</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(MonsterGacha));