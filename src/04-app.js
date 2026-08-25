// ============================================================
// MAIN APP
// ============================================================
function MonsterGacha() {
  const [slotId, setSlotId] = useState(null); // null = slot select screen
  const [slotPreviews, setSlotPreviews] = useState([null, null, null]);
  const [screen, setScreen] = useState("home");
  const [coins, setCoins] = useState(50);
  const [collection, setCollection] = useState({});
  const [totalPulls, setTotalPulls] = useState(0);
  const [modal, setModal] = useState(null);
  const [gachaPhase, setGachaPhase] = useState("idle");
  const [gachaResults, setGachaResults] = useState([]);
  const [gachaChests, setGachaChests] = useState([]);
  const [opened, setOpened] = useState(new Set());
  const [miniGame, setMiniGame] = useState(null);
  const [synthResult, setSynthResult] = useState(null);
  const [synthRetry, setSynthRetry] = useState(null); // 表示中の★MAXリロール確認 {resultTypeId, resultName, resultIcon, pendingNotif}。待機列は synthRetryQueueRef
  const [loginDay, setLoginDay] = useState(1);
  const [spending, setSpending] = useState([]); // [{amount, memo, date}]
  const [loaded, setLoaded] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [newRecord, setNewRecord] = useState(null);
  const [nickname, setNickname] = useState("");
  const [bestScores, setBestScores] = useState({});
  const [playCounts, setPlayCounts] = useState({});
  const [rareEffect, setRareEffect] = useState(null);
  const [lastLoginDate, setLastLoginDate] = useState(null);
  const [loginStreak, setLoginStreak] = useState(0);
  const [showLoginBonus, setShowLoginBonus] = useState(false);
  const [loginBonusInfo, setLoginBonusInfo] = useState(null);
  const [rareNotifs, setRareNotifs] = useState([]);
  const [congratsHistory, setCongratsHistory] = useState([]);
  const [weeklyScores, setWeeklyScores] = useState({});
  const [dailyMissions, setDailyMissions] = useState([]);
  // Shared date state - updates at midnight, used by login bonus, missions, crowns
  const [missionDate, setMissionDate] = useState(() => getLocalDate());
  useEffect(() => {
    const checker = setInterval(() => {
      const now = getLocalDate();
      if (now !== missionDate) setMissionDate(now);
    }, 30000);
    return () => clearInterval(checker);
  }, [missionDate]);
  const [dailyProgress, setDailyProgress] = useState({});
  const [dailyCompleted, setDailyCompleted] = useState({});
  const [giftsSentToday, setGiftsSentToday] = useState(0);
  const [itemRequests, setItemRequests] = useState([]);
  const [showRequestConfirm, setShowRequestConfirm] = useState(null);
  const [requestMode, setRequestMode] = useState(false);
  const [giftHistory, setGiftHistory] = useState([]);
  const [showGiftHistory, setShowGiftHistory] = useState(false);
  // Ura (hidden) museum state
  const [uraObtained, setUraObtained] = useState([]);
  const [uraUnlocked, setUraUnlocked] = useState(false);
  const [showUraMuseum, setShowUraMuseum] = useState(false);
  const uraPool = useMemo(() => URA_ITEMS.filter(u => !uraObtained.includes(u.id)), [uraObtained]);
  const [lastGiftDate, setLastGiftDate] = useState(null);
  const [totalGiftValue, setTotalGiftValue] = useState(0);
  const [pendingGifts, setPendingGifts] = useState([]);
  const [showGiftModal, setShowGiftModal] = useState(null);
  const [giftRecipient, setGiftRecipient] = useState('');
  const [showGiftReceived, setShowGiftReceived] = useState(null);
  const saveTimer = useRef(null);

  const slotKey = (id) => `tgacha-s${id}`;

  // ============ STORAGE with diagnostics ============
  const [storageLog, setStorageLog] = useState([]);
  const addLog = (msg) => setStorageLog(prev => [...prev.slice(-10), { t: Date.now(), m: msg }]);

  const stSet = async (key, str) => {
    if (!window.storage) { addLog("SET失敗: window.storage不在"); return false; }
    if (!window.storage.set) { addLog("SET失敗: set関数不在"); return false; }
    try {
      const r = await window.storage.set(key, str);
      if (r) { addLog("SET成功: " + key + " (" + str.length + "B)"); return true; }
      addLog("SET失敗: 応答null " + key);
      return false;
    } catch(e) {
      addLog("SET例外: " + (e.message || String(e)).slice(0, 80));
      return false;
    }
  };

  const stGet = async (key) => {
    if (!window.storage) return null;
    try {
      const r = await window.storage.get(key);
      if (r && r.value) {
        const d = JSON.parse(r.value);
        if (d && typeof d === 'object' && d.lastSave) { addLog("GET成功: " + key); return d; }
      }
      return null;
    } catch(e) {
      // Key not found is normal, don't log as error
      return null;
    }
  };

  const stDel = async (key) => {
    try { if (window.storage) await window.storage.delete(key); } catch(e) {}
  };

  // Compress/decompress collection
  const compressCol = (col) => {
    const c = {};
    for (const k in col) { if (col[k] && col[k].count > 0) c[k] = col[k].count; }
    return c;
  };
  const decompressCol = (c) => {
    if (!c) return {};
    const col = {};
    for (const k in c) {
      const count = typeof c[k] === 'number' ? c[k] : c[k]?.count;
      if (!count || count <= 0) continue;
      // ★12 Congratulations items (cg1_12, cg2_12, cg3_12)
      const ct = CONGRATS_TIERS.find(t => t.key === k);
      if (ct) {
        const nr = RARITIES[11];
        col[k] = { name: ct.name, icon: ct.icon, desc: ct.desc, typeId: 'congrats', typeName: '展示室報酬', typeEmoji: ct.icon, typeColor: ct.tierColor, rank: 12, rarity: nr, count };
        continue;
      }
      const [typeId, rankStr] = k.split('_');
      // ★MAX進化(煌): キーは <typeId>_11k。rank自体は11のまま・名前に「・煌」・prismフラグを付ける
      const prism = rankStr === '11k';
      const rank = prism ? 11 : parseInt(rankStr);
      const type = TYPES.find(t => t.id === typeId);
      if (!type || !MONSTERS[typeId] || !MONSTERS[typeId][rank-1]) continue;
      const m = MONSTERS[typeId][rank - 1];
      const rarity = RARITIES[rank - 1];
      col[k] = { ...m, typeId, typeName: type.name, typeEmoji: type.emoji, typeColor: type.color, rank, rarity, count };
      if (prism) { col[k].name = m.name + PRISM_NAME_SUFFIX; col[k].prism = true; }
    }
    return col;
  };

  // ---- Load slot previews on mount (with storage test) ----
  const [storageOk, setStorageOk] = useState(true);
  useEffect(() => {
    (async () => {
      let canSave = false;
      try {
        if (window.storage) {
          addLog("テスト: storage検出 type=" + typeof window.storage.set);
          const testVal = "test_" + Date.now();
          const wr = await window.storage.set('tgacha-test', testVal);
          addLog("テスト書込: result=" + JSON.stringify(wr).slice(0, 50));
          const rd = await window.storage.get('tgacha-test');
          addLog("テスト読込: value=" + (rd?.value || "null"));
          if (rd && rd.value === testVal) {
            canSave = true;
            addLog("テスト: ✅ 書込→読込一致");
          } else {
            addLog("テスト: ❌ 不一致 wrote=" + testVal + " read=" + (rd?.value));
          }
          await window.storage.delete('tgacha-test');
        } else {
          addLog("テスト: window.storage = " + typeof window.storage);
        }
      } catch(e) {
        addLog("テスト例外: " + (e.message || String(e)).slice(0, 60));
      }
      setStorageOk(canSave);

      // Load nickname
      try {
        const nk = await window.storage.get('tgacha-nickname');
        if (nk && nk.value) setNickname(nk.value);
      } catch(e) {}

      // Load slot previews
      const previews = [null, null, null];
      for (let i = 0; i < 3; i++) {
        try {
          const d = await stGet(slotKey(i + 1));
          if (d) { previews[i] = d; addLog("スロット" + (i+1) + "読込OK"); }
        } catch(e) {}
      }
      setSlotPreviews(previews);
      setLoaded(true);
    })();
  }, []);

  // ---- Load selected slot ----
  const loadSlot = useCallback(async (id) => {
    setSlotId(id);
    const d = await stGet(slotKey(id));
    if (d) {
      setCoins(d.coins ?? 50);
      const loadedCol = decompressCol(d.collection);
      // Ensure mati always has Congratulations T1 in collection
      if (d.nickname === 'mati' && !loadedCol['cg1_12']) {
        const nr = RARITIES[11];
        const ci = CONGRATS_TIERS[0];
        loadedCol['cg1_12'] = { name: ci.name, icon: ci.icon, desc: ci.desc, typeId: 'congrats', typeName: '展示室報酬', typeEmoji: ci.icon, typeColor: ci.tierColor, rank: 12, rarity: nr, count: 1 };
      }
      setCollection(loadedCol);
      setTotalPulls(d.totalPulls ?? 0);
      setLoginDay(d.loginDay ?? 1);
      setSpending(d.spending || []);
      if (d.nickname) setNickname(d.nickname);   // スロットに名前が無くても既存のニックネームを空文字で潰さない(記録系の無言停止バグ根治)
      let bs = d.bestScores || {}; let pc = d.playCounts || {};
      let ws = d.weeklyScores || {};
      // (2026-08-24) 一度きりのjuggler/あいこリセット移行はコードごと撤去(localStorageフラグ管理は新端末のたび再発火する事故構造のため)
      setBestScores(bs);
      setPlayCounts(pc);
      setLastLoginDate(d.lastLoginDate || null);
      setLoginStreak(d.loginStreak || 0);
      setWeeklyScores(ws);
      setTotalGiftValue(d.totalGiftValue || 0);
      setGiftsSentToday(d.giftsSentToday || 0);
      setLastGiftDate(d.lastGiftDate || null);
      setUraObtained(d.uraObtained || []);
      setUraUnlocked(d.uraUnlocked || false);
      if (d.lastSave) {
        const away = Math.floor((Date.now() - d.lastSave) / 2000);
        if (away > 0) setCoins(c => c + Math.min(away, 5000));
      }
    } else {
      setCoins(50); setCollection({}); setTotalPulls(0); setLoginDay(1); setSpending([]); setBestScores({}); setPlayCounts({});
      setLastLoginDate(null); setLoginStreak(0); setWeeklyScores({});
      setTotalGiftValue(0); setGiftsSentToday(0); setLastGiftDate(null); setUraObtained([]); setUraUnlocked(false);
      // Preserve global nickname for new slots
      try {
        const nk = await window.storage.get('tgacha-nickname');
        if (nk && nk.value) setNickname(nk.value);
        else setNickname("");
      } catch(e) { setNickname(""); }
    }
    setScreen("home");
  }, []);

  // ---- Delete slot ----
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const deleteSlot = useCallback(async (id) => {
    await stDel(slotKey(id));
    setSlotPreviews(prev => { const n = [...prev]; n[id - 1] = null; return n; });
    setConfirmDeleteId(null);
    if (id === slotId) {
      setSlotId(null); setCoins(50); setCollection({}); setTotalPulls(0); setLoginDay(1); setSpending([]); setNickname(""); setBestScores({}); setPlayCounts({}); setLastLoginDate(null); setLoginStreak(0); setWeeklyScores({}); setTotalGiftValue(0); setGiftsSentToday(0); setLastGiftDate(null); setUraObtained([]); setUraUnlocked(false); setScreen("home");
    }
    setSaveMsg("🗑 スロット" + id + "を削除しました");
    setTimeout(() => setSaveMsg(""), 2000);
    setShowSaveModal(false);
  }, [slotId]);

  // ---- SAVE: minimal, no lock, no retry ----
  const [showSaveModal, setShowSaveModal] = useState(false);
  const saveDataRef = useRef(null);
  saveDataRef.current = { coins, collection, totalPulls, loginDay, spending, nickname, bestScores, playCounts, lastLoginDate, loginStreak, weeklyScores, totalGiftValue, giftsSentToday, lastGiftDate, uraObtained, uraUnlocked };

  const saveToSlot = useCallback(async (targetId, silent) => {
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    const s = saveDataRef.current;
    if (!s) return;
    const compressed = {};
    const col = s.collection || {};
    for (const k of Object.keys(col)) {
      if (col[k] && col[k].count > 0) compressed[k] = col[k].count;
    }
    const data = { coins: s.coins, collection: compressed, totalPulls: s.totalPulls, loginDay: s.loginDay, spending: s.spending || [], nickname: s.nickname, bestScores: s.bestScores, playCounts: s.playCounts || {}, lastLoginDate: s.lastLoginDate, loginStreak: s.loginStreak, weeklyScores: s.weeklyScores || {}, totalGiftValue: s.totalGiftValue || 0, giftsSentToday: s.giftsSentToday || 0, lastGiftDate: s.lastGiftDate || null, uraObtained: s.uraObtained || [], uraUnlocked: s.uraUnlocked || false, lastSave: Date.now() };
    const key = slotKey(targetId);
    try {
      const str = JSON.stringify(data);
      addLog("SAVE書込: key=" + key + " " + str.length + "B");
      if (!window.storage) { if (!silent) setSaveMsg("⚠️ storage未接続"); addLog("FAIL: window.storage不在"); return; }

      // Step 1: Write
      const writeResult = await window.storage.set(key, str);
      addLog("SAVE応答: " + JSON.stringify(writeResult).slice(0, 80));

      // Step 2: Read back immediately to verify
      let verified = false;
      let readErr = "";
      try {
        const readBack = await window.storage.get(key);
        if (readBack && readBack.value) {
          const parsed = JSON.parse(readBack.value);
          if (parsed && parsed.lastSave === data.lastSave) {
            verified = true;
            addLog("VERIFY成功: lastSave一致");
          } else {
            addLog("VERIFY失敗: lastSave不一致 saved=" + data.lastSave + " read=" + (parsed?.lastSave));
          }
        } else {
          addLog("VERIFY失敗: 読み返しvalue空 readBack=" + JSON.stringify(readBack).slice(0, 80));
        }
      } catch(e) {
        readErr = (e.message || String(e)).slice(0, 60);
        addLog("VERIFY例外: " + readErr);
      }

      if (verified) {
        setSlotPreviews(prev => { const n = [...prev]; n[targetId - 1] = data; return n; });
        if (!silent) { setSaveMsg("✅ セーブ完了＆検証OK！"); setShowSaveModal(false); }
      } else if (writeResult) {
        // Write appeared to succeed but verify failed
        setSlotPreviews(prev => { const n = [...prev]; n[targetId - 1] = data; return n; });
        if (!silent) setSaveMsg("⚠️ 書込OK但し検証NG: " + readErr);
      } else {
        if (!silent) setSaveMsg("⚠️ セーブ失敗");
        addLog("SAVE失敗: writeResult falsy");
      }
    } catch(e) {
      addLog("SAVE例外: " + (e.message || "").slice(0, 60));
      if (!silent) setSaveMsg("⚠️ " + (e.message || "エラー"));
    }
    // Write ranking data on save
    if (s.nickname) {
      try {
        const bs = s.bestScores || {};
        // 旧世代キー(SCORE_KEY_MAPの左辺=godAnother旧配点)はベスト集計から除外する
        const bestMiniGame = Object.entries(bs).filter(([k]) => !(k in SCORE_KEY_MAP)).reduce((best, [k, v]) => (v > (best.score || 0)) ? { id: k, score: v } : best, { id: '', score: 0 });
        const colCount = Object.keys(compressed).length;
        const colPower = Object.entries(compressed).reduce((sum, [k, cnt]) => {
          // 煌(_11k)は★MAX3個分として数える(進化でランキング資産が減らない)
          return sum + entryPower(k, typeof cnt === 'number' ? cnt : 0);
        }, 0) + URA_ITEMS.filter(u => (s.uraObtained || []).includes(u.id)).reduce((sum, u) => sum + u.value, 0);
        const cTier = (() => {
          const mc = BASE_TYPES.map(t => maxEffCount(compressed, t.id));   // Tier判定は従来6種のみ(minMaxCountと同一規則)
          const mn = Math.min(...mc);
          const uraComplete = (s.uraObtained || []).length >= URA_ITEMS.length;
          return uraComplete ? 3 : mn >= 3 ? 2 : mn >= 1 ? 1 : 0;
        })();
        const rankBase = { name: s.nickname, totalAssets: colPower, colCount: colCount, totalPulls: s.totalPulls, bestMiniGame: bestMiniGame, totalGiftValue: s.totalGiftValue || 0, congratsTier: cTier, uraCount: (s.uraObtained || []).length, updated: Date.now() };
        if (window.fbDb) {
          // restoreDataが存在する間はランキング上書きをスキップ（復旧データ保護）
          window.fbDb.ref('rankings/' + s.nickname + '/restoreData').once('value').then(snap => {
            if (snap.val()) {
              addLog("復旧待ち: ランキング上書きスキップ");
              // スキップ中でもnameだけは書く(未登録だとランキング一覧に一切出ないため)
              window.fbDb.ref('rankings/' + s.nickname + '/name').set(s.nickname).catch(() => {});
              return;
            }
            window.fbDb.ref('rankings/' + s.nickname).update(rankBase).catch(() => {});
            if (Object.keys(bs).length > 0) {
              Object.entries(bs).forEach(([gid, score]) => {
                window.fbDb.ref('rankings/' + s.nickname + '/bestScores/' + gid).transaction(current => Math.max(current || 0, score)).catch(() => {});
              });
            }
            if (s.playCounts && Object.keys(s.playCounts).length > 0) {
              // bestScoresと同様にMath.maxのtransactionで保護(絶対値updateはFirebase側の大きい値を潰す)
              Object.entries(s.playCounts).forEach(([gid, c]) => {
                window.fbDb.ref('rankings/' + s.nickname + '/playCounts/' + gid).transaction(cur => Math.max(cur || 0, c)).catch(() => {});
              });
            }
            const today = getLocalDate();
            const weekId = getWeekId();
            window.fbDb.ref('assetTracking/daily/' + today + '/' + s.nickname).set(colPower).catch(() => {});
            window.fbDb.ref('assetTracking/weekly/' + weekId + '/' + s.nickname).set(colPower).catch(() => {});
            window.fbDb.ref('pullTracking/daily/' + today + '/' + s.nickname).set(s.totalPulls || 0).catch(() => {});
            window.fbDb.ref('pullTracking/weekly/' + weekId + '/' + s.nickname).set(s.totalPulls || 0).catch(() => {});
            window.fbDb.ref('giftTracking/daily/' + today + '/' + s.nickname).set(s.totalGiftValue || 0).catch(() => {});
            window.fbDb.ref('giftTracking/weekly/' + weekId + '/' + s.nickname).set(s.totalGiftValue || 0).catch(() => {});
          }).catch(() => {});
        }
      } catch(e) { addLog("RANK書込エラー: " + (e.message || "").slice(0, 40)); }
    }
    if (!silent) setTimeout(() => setSaveMsg(""), 5000);
  }, []);

  // ---- AUTO-SAVE: 30秒に1回（定期実行、タイマーリセットなし） ----
  const lastAutoSave = useRef(Date.now());
  useEffect(() => {
    if (!loaded || slotId === null) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastAutoSave.current >= 30000) {
        lastAutoSave.current = now;
        addLog("自動セーブ実行");
        saveToSlot(slotId, true);
      }
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [loaded, slotId, saveToSlot]);

  // ---- GIFT SYSTEM: Check for pending gifts ----
  useEffect(() => {
    if (!nickname || !window.fbDb || slotId === null) return;
    const ref = window.fbDb.ref('gifts/' + nickname);
    ref.once('value').then(snapshot => {
      const gifts = [];
      snapshot.forEach(child => {
        gifts.push({ fbKey: child.key, ...child.val() });
      });
      if (gifts.length > 0) {
        setPendingGifts(gifts);
      }
    });
  }, [nickname, slotId, loaded]);

  const [volMain, setVolMain] = useState(volMainBgm);
  const [volGame, setVolGame] = useState(volGameBgm);
  const [volSfxState, setVolSfxState] = useState(volSfx);
  const [showVolPanel, setShowVolPanel] = useState(false);
  const receivingRef = useRef(false);
  const receiveGifts = useCallback(() => {
    if (pendingGifts.length === 0 || receivingRef.current) return;
    receivingRef.current = true;
    const accepted = [];
    setCollection(prev => {
      const n = { ...prev };
      pendingGifts.forEach(gift => {
        // ★11/★12 gifts are blocked
        if (gift.rank >= 11) {
          window.fbDb.ref('gifts/' + nickname + '/' + gift.fbKey).remove().catch(() => {});
          return;
        }
        // Validate gift data
        const type = TYPES.find(t => t.id === gift.typeId);
        if (!type || !MONSTERS[gift.typeId] || !MONSTERS[gift.typeId][gift.rank - 1] || !RARITIES[gift.rank - 1]) {
          window.fbDb.ref('gifts/' + nickname + '/' + gift.fbKey).remove().catch(() => {});
          return;
        }
        const key = `${gift.typeId}_${gift.rank}`;
        if (n[key]) {
          n[key] = { ...n[key], count: n[key].count + (gift.count || 1) };
        } else {
          const m = MONSTERS[gift.typeId][gift.rank - 1];
          const rarity = RARITIES[gift.rank - 1];
          n[key] = { ...m, typeId: gift.typeId, typeName: type.name, typeEmoji: type.emoji, typeColor: type.color, rank: gift.rank, rarity, count: gift.count || 1 };
        }
        accepted.push(gift);
        window.fbDb.ref('gifts/' + nickname + '/' + gift.fbKey).remove().catch(() => {});
      });
      return n;
    });
    if (accepted.length > 0) {
      setShowGiftReceived(accepted);
      setTimeout(() => setShowGiftReceived(null), 4000);
    }
    setPendingGifts([]);
    receivingRef.current = false;
  }, [pendingGifts, nickname]);

  // 種族セット効果(コレクションボーナス): ★1〜★10の10種を揃えた種族の効果が常時発動する。
  // contributeMission/pull/回復タイマーより前に宣言する(依存配列は即時評価されるためTDZ回避)。
  const setBonuses = useMemo(() => computeSetBonuses(collection), [collection]);
  // コールバック・タイマーからはref経由で読む(既存の依存配列を一切変えないため。
  // 描画のたびに最新値へ更新されるので、クリック時・タイマー発火時は常に現在値)
  const setBonusesRef = useRef(setBonuses);
  setBonusesRef.current = setBonuses;
  // ガチャ費用: 表示・コイン不足判定・支払いが必ず同じ値を見るよう1箇所に集約
  const gachaCost10 = gachaCostFor(10, setBonuses);
  const gachaCost40 = gachaCostFor(40, setBonuses);

  // デイリーミッションへの加算。呼び出し側(sendGift/pull/doSynthSingle/handleMiniGameScore)より
  // 先に宣言する必要がある(依存配列は即時評価されるためTDZ回避)
  const contributeMission = useCallback((missionType, amount) => {
    if (!nickname || !window.fbDb) return;
    const today = missionDate;   // 表示側(ミッション読込)と同じ日付stateを使う: 深夜0時直後の書込先ズレ防止
    const missions = generateDailyMissions(today);
    const mission = missions.find(m => m.type === missionType);
    if (!mission) return;
    const ref = window.fbDb.ref('dailyMissions/' + today + '/' + mission.id + '/contributions/' + nickname);
    // 王国セット効果: 貢献量+10%(共有DBに入る唯一のセット効果。+10%は許容済み)
    const contributed = setBonusesRef.current.kingdom
      ? Math.round(amount * (1 + SET_BONUS_EFFECTS.kingdom.rate)) : amount;
    // 1人あたりの上限は撤廃(加算はtransactionでサーバ側集計のまま)
    ref.transaction(current => (current || 0) + contributed).catch(() => {});
  }, [nickname, missionDate]);

  const sendGift = useCallback((itemKey, recipientName) => {
    const trimmedName = (recipientName || '').trim();
    if (!nickname || !trimmedName || !window.fbDb) return;
    if (trimmedName === nickname) return;
    if (trimmedName.length > 20) return;
    const today = getLocalDate();
    const todayCount = lastGiftDate === today ? giftsSentToday : 0;
    if (todayCount >= 3) return;
    const item = collection[itemKey];
    if (!item || item.count <= 1 || item.rank >= 11) return;
    const giftValue = POWER_VALUES[item.rank - 1] || 0;
    setCollection(prev => {
      const n = { ...prev };
      n[itemKey] = { ...n[itemKey], count: n[itemKey].count - 1 };
      if (n[itemKey].count <= 0) delete n[itemKey];
      return n;
    });
    window.fbDb.ref('gifts/' + trimmedName).push({
      typeId: item.typeId, rank: item.rank, name: item.name, icon: item.icon,
      count: 1, from: nickname, value: giftValue, timestamp: Date.now()
    }).catch(() => { setSaveMsg('⚠️ 送信に失敗しました'); setTimeout(() => setSaveMsg(''), 3000); });
    setGiftsSentToday(todayCount + 1);
    setLastGiftDate(today);
    setTotalGiftValue(prev => prev + giftValue);
    window.fbDb.ref('rankings/' + nickname + '/totalGiftValue').transaction(current => (current || 0) + giftValue).catch(() => {});
    window.fbDb.ref('dailyGiftTotal/' + today + '/' + nickname).transaction(current => (current || 0) + giftValue).catch(() => {});
    contributeMission('gift', giftValue);
    // Record gift history for ★7+ items
    if (item.rank >= 7) {
      const histRef = window.fbDb.ref('notifications/giftHistory');
      histRef.push({
        sender: nickname, receiver: trimmedName, item: item.name, icon: item.icon,
        rank: item.rank, timestamp: Date.now()
      }).catch(() => {});
      histRef.orderByChild('timestamp').once('value').then(snap => {
        const keys = []; snap.forEach(child => keys.push(child.key));
        if (keys.length > 20) keys.slice(0, keys.length - 20).forEach(k => histRef.child(k).remove().catch(() => {}));
      }).catch(() => {});
    }
    sfx('sell');
    setShowGiftModal(null);
    setSaveMsg('🎁 ' + trimmedName + 'に' + item.name + 'を送りました！');
    setTimeout(() => setSaveMsg(''), 3000);
  }, [nickname, collection, giftsSentToday, lastGiftDate, contributeMission]);

  // Daily login bonus check - re-checks when missionDate changes (midnight)
  const loginCheckedDateRef = useRef(null);
  useEffect(() => {
    if (!loaded || slotId === null) return;
    const today = missionDate;
    // Already checked for today
    if (loginCheckedDateRef.current === today) return;
    const timer = setTimeout(() => {
      loginCheckedDateRef.current = today;
      if (lastLoginDate === today) return;

      const yesterday = getLocalDate(new Date(Date.now() - 86400000));
      const newStreak = lastLoginDate === yesterday ? loginStreak + 1 : 1;
      const baseBonus = Math.min(newStreak, 10) * 400;
      // 古代秘宝セット効果: ログインボーナス+20%
      const bonusCoins = setBonusesRef.current.relic
        ? Math.round(baseBonus * (1 + SET_BONUS_EFFECTS.relic.rate)) : baseBonus;

      setLoginStreak(newStreak);
      setLastLoginDate(today);
      setCoins(c => c + bonusCoins);
      setLoginBonusInfo({ streak: newStreak, coins: bonusCoins });
      setShowLoginBonus(true);
      setTimeout(() => setShowLoginBonus(false), 4000);
    }, 500);
    return () => clearTimeout(timer);
  }, [loaded, slotId, lastLoginDate, loginStreak, missionDate]);

  // Auto coin recovery: +1 every 2s (+1% per login streak day)
  // 黄金遺産セット効果: 回復量+25%。1tickの回復量が小さい整数なので端数は確率で+1し、
  // 期待値をちょうど+25%に合わせる(base=1なら25%の確率で+1)。
  const loginStreakRef = useRef(0);
  loginStreakRef.current = loginStreak;
  useEffect(() => {
    const t = setInterval(() => setCoins(c => {
      const base = 1 + Math.floor(loginStreakRef.current * 0.01);
      if (!setBonusesRef.current.gold) return c + base;
      const extra = base * SET_BONUS_EFFECTS.gold.rate;
      return c + base + Math.floor(extra) + (Math.random() < (extra % 1) ? 1 : 0);
    }), 2000);
    return () => clearInterval(t);
  }, []);

  const addToCollection = useCallback((m) => {
    const key = `${m.typeId}_${m.rank}`;
    setCollection(prev => ({
      ...prev,
      [key]: { ...m, count: ((prev[key]?.count) || 0) + 1 }
    }));
  }, []);

  const colCount = useMemo(() => Object.keys(collection).length, [collection]);

  // ★MAX ownership tracking - 3 tiers
  // Tier1: ★11全6種×1, Tier2: ★11全6種×2, Tier3: 裏アイテム全66種コンプリート
  // 実効数 = _11.count + 3 × _11k.count(煌に進化してもTier判定・展示の所持が落ちない)
  // 表示用(ホームのMAX TREASURE列など)。★12 Tier判定には使わない(下のminMaxCountはBASE_TYPES固定)
  const maxCounts = useMemo(() => typesFor(collection).map(t => maxEffCount(collection, t.id)), [collection]);
  const hasAnyMax = maxCounts.some(c => c > 0);
  const maxTypesOwned = maxCounts.filter(c => c > 0).length;
  // ★12 Congratulations の Tier判定は従来6種のみで行う(神域を算入しない=既存プレイヤーのTierが落ちない)
  const minMaxCount = Math.min(...BASE_TYPES.map(t => maxEffCount(collection, t.id)));
  const uraComplete = uraObtained.length >= URA_ITEMS.length;
  const congratsTier = uraComplete ? 3 : minMaxCount >= 3 ? 2 : minMaxCount >= 1 ? 1 : 0;
  const isComplete = congratsTier >= 1;

  // データ復旧: Firebaseの restoreData/{nickname} があれば読み取ってゲームに適用
  // Firebaseが権威データ。適用後にFirebase側のrestoreDataを削除する。
  const restoreAppliedRef = useRef(false);
  useEffect(() => {
    if (!nickname || slotId === null || !window.fbDb || restoreAppliedRef.current) return;
    window.fbDb.ref('rankings/' + nickname + '/restoreData').once('value').then(snap => {
      const rd = snap.val();
      if (!rd) return;
      restoreAppliedRef.current = true;
      if (rd.collection) {
        // コレクション適用
        setCollection(decompressCol(rd.collection));
        // ガチャ回数
        if (rd.totalPulls) setTotalPulls(prev => Math.max(prev, rd.totalPulls));
        // ベストスコア（大きい方を採用）
        if (rd.bestScores) setBestScores(prev => {
          const m = {...prev}; for (const g of Object.keys(rd.bestScores)) m[g] = Math.max(m[g] || 0, rd.bestScores[g]); return m;
        });
        // プレイ回数（大きい方を採用）
        if (rd.playCounts) setPlayCounts(prev => {
          const m = {...prev}; for (const g of Object.keys(rd.playCounts)) m[g] = Math.max(m[g] || 0, rd.playCounts[g]); return m;
        });
        if (rd.totalGiftValue) setTotalGiftValue(prev => Math.max(prev, rd.totalGiftValue));
        if (rd.coins) setCoins(prev => Math.max(prev, rd.coins));
      }
      // 適用可否によらず必ず削除: 残存するとランキング書込が恒久停止するため
      window.fbDb.ref('rankings/' + nickname + '/restoreData').remove().catch(() => {});
    }).catch(() => {});
  }, [nickname, slotId]);

  // Unlock ura museum when any ★11 is obtained
  useEffect(() => {
    if (maxTypesOwned >= 2 && !uraUnlocked) setUraUnlocked(true);
  }, [maxTypesOwned, uraUnlocked]);

  const totalSpent = useMemo(() => spending.reduce((s, e) => s + e.amount, 0), [spending]);

  const totalPower = useMemo(() => {
    const colAssets = Object.entries(collection).reduce((sum, [k, m]) => sum + entryPower(k, m.count || 0, m.rank), 0);
    const uraAssets = URA_ITEMS.filter(u => uraObtained.includes(u.id)).reduce((sum, u) => sum + u.value, 0);
    return colAssets + uraAssets;
  }, [collection, uraObtained]);

  // Game clear detection - grant ★12 Congratulations items (3 tiers)
  const [showClear, setShowClear] = useState(false);
  const [showClearTier, setShowClearTier] = useState(null);
  const [clearReady, setClearReady] = useState(false);
  // Track which tiers have already been granted (check collection for existing ★12 items)
  const grantedTier = useMemo(() => {
    let gt = 0;
    CONGRATS_TIERS.forEach(ct => { if (collection[ct.key]) gt = Math.max(gt, ct.tier); });
    return gt;
  }, [collection]);
  const prevGrantedTier = useRef(-1);
  const congratsShownRef = useRef(false);
  useEffect(() => {
    // Wait for collection to be loaded (grantedTier will reflect existing items)
    if (prevGrantedTier.current === -1) {
      prevGrantedTier.current = grantedTier;
      return;
    }
    // Only fire when congratsTier exceeds what has ALREADY been granted in collection
    if (congratsTier > grantedTier && !congratsShownRef.current) {
      congratsShownRef.current = true;
      // Grant new tier items
      const nr = RARITIES[11];
      setCollection(prev => {
        const n = { ...prev };
        for (let t = grantedTier + 1; t <= congratsTier; t++) {
          const ci = CONGRATS_TIERS[t - 1];
          if (!n[ci.key]) n[ci.key] = { name: ci.name, icon: ci.icon, desc: ci.desc, typeId: 'congrats', typeName: '展示室報酬', typeEmoji: ci.icon, typeColor: ci.tierColor, rank: 12, rarity: nr, count: 1 };
        }
        return n;
      });
      setShowClearTier(CONGRATS_TIERS[congratsTier - 1]);
      setClearReady(false);
      setShowClear(true);
      bgm.stop(); stopMainBgm();
      sfx('congrats' + congratsTier);
      setTimeout(() => setClearReady(true), 5000);
      // Record Congratulations to persistent history (check for duplicates first)
      if (nickname && window.fbDb) {
        window.fbDb.ref('notifications/congrats').once('value').then(snap => {
          const existing = new Set();
          snap.forEach(child => { const d = child.val(); if (d) existing.add((d.name || '') + '_' + (d.tier || 0)); });
          for (let t = grantedTier + 1; t <= congratsTier; t++) {
            const ci = CONGRATS_TIERS[t - 1];
            if (!existing.has(nickname + '_' + t)) {
              window.fbDb.ref('notifications/congrats').push({
                name: nickname, tier: t, tierLabel: ci.tierLabel, icon: ci.icon, item: ci.name, timestamp: Date.now()
              }).catch(() => {});
            }
          }
        });
      }
    }
    prevGrantedTier.current = grantedTier;
  }, [congratsTier, grantedTier]);

  // Gacha
  const autoOpenRef = useRef([]);
  // まだ走っていない「コレクションへの追加」。演出タイマーを取り消す時も獲得だけは捨てずに確定させる
  const pendingRevealRef = useRef([]);
  const [cueEffect, setCueEffect] = useState(null);
  // 保存トリガー: 最終グループの addToCollection 完了直後に true になる
  // (箱が開いた瞬間=allOpened で保存すると、コイン消費済み・アイテム未追加のスナップショットが保存され得る)
  const [gachaSaveReady, setGachaSaveReady] = useState(false);

  const startChestOpen = useCallback((res) => {
    // 取り消しの前に、前回pullの未確定の獲得を先に確定させる(捨てるのは演出だけ)
    const pending = pendingRevealRef.current;
    pendingRevealRef.current = [];
    pending.forEach(fn => { try { fn(); } catch (e) {} });
    // 前回pullの残タイマー(ura遅延/グループ/宝箱音/reveal/rareEffect解除)を全て取り消してから開始する
    autoOpenRef.current.forEach(t => clearTimeout(t));
    autoOpenRef.current = [];
    setGachaSaveReady(false);
    setGachaResults(res);
    setGachaChests(res.map(r => getChestType(r.rank)));
    setOpened(new Set());
    setGachaPhase("chests");
    // 解除タイマーごと取り消したので、前回の演出はここで確実に消す
    // (メインBGMが一瞬鳴り出さないよう、必ず gachaPhase="chests" の後に置く)
    setRareEffect(null);

    // Ura item lottery FIRST (before chest animation)
    let uraDelay = 0;
    if (uraUnlocked && uraPool.length > 0) {
      const localPool = [...uraPool];
      const uraWins = [];   // 複数当選を全て演出する(従来は最後の1個しか演出されず無言付与だった)
      for (let ui = 0; ui < res.length; ui++) {
        if (localPool.length === 0) break;
        // 宇宙の秘宝セット効果: 裏アイテム抽選確率+10%
        const uraResult = rollUraItem(localPool, setBonusesRef.current.space ? 1 + SET_BONUS_EFFECTS.space.rate : 1);
        if (uraResult) {
          uraWins.push(uraResult);
          const idx2 = localPool.findIndex(u => u.id === uraResult.id);
          if (idx2 >= 0) localPool.splice(idx2, 1);
          setUraObtained(prev => prev.includes(uraResult.id) ? prev : [...prev, uraResult.id]);
          if (uraResult.rank >= 7 && nickname && window.fbDb) {
            window.fbDb.ref('notifications').push({
              name: nickname, rank: uraResult.rank, item: uraResult.name, icon: uraResult.icon,
              rarity: '裏', timestamp: Date.now(), isUra: true
            }).catch(() => {});
          }
        }
      }
      if (uraWins.length > 0) {
        // 当選した裏アイテムを1個ずつ順番に披露(各3.5秒)
        uraWins.forEach((w, wi) => {
          autoOpenRef.current.push(setTimeout(() => { setRareEffect({ type: 'uraItem', uraItem: w }); sfx('reveal10'); }, wi * 3800));
          autoOpenRef.current.push(setTimeout(() => setRareEffect(null), wi * 3800 + 3500));
        });
        uraDelay = uraWins.length * 3800; // chest animation starts after all ura effects clear
      }
    }

    // Start chest animation (delayed if ura item was shown)
    autoOpenRef.current.push(setTimeout(() => {
    const openOrder = res.map((r, i) => ({ i, rank: r.rank }));
    openOrder.sort((a, b) => {
      // ★1 first, then ★2, then ★3+ by rank ascending, ★10 last
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.i - b.i;
    });
    // Build cumulative timing
    // ★1-4(木箱/シルバー): 1回目に全部一括(250ms) / ★5-7(ゴールド): 2回目に全部一括(700ms)
    // ★8+(レインボー): 金銀の開封タイミングの1.5倍の間隔(700ms×1.5=1050ms)で1個ずつ(2026-08-25 竹森氏指示)
    const RAINBOW_INTERVAL = Math.round(700 * 1.5);
    let cumTime = 250;
    let oneByOneStarted = false;
    const timings = openOrder.map((o) => {
      if (o.rank <= 4) return { ...o, time: 250 };            // 木・銀: 1回目一括
      if (o.rank <= 7) { cumTime = 700; return { ...o, time: 700 }; }  // 金: 2回目一括
      // ★8+: 1個目=1050ms、2個目以降も1050ms間隔で順に開封
      cumTime = oneByOneStarted ? cumTime + RAINBOW_INTERVAL : RAINBOW_INTERVAL;
      oneByOneStarted = true;
      return { ...o, time: cumTime };
    });
    // Group timings by same time for batch opening
    const timeGroups = {};
    timings.forEach(o => {
      const t = o.time;
      if (!timeGroups[t]) timeGroups[t] = [];
      timeGroups[t].push(o);
    });
    // reveal(=addToCollection)が最後に走るグループを先に確定し、そこで保存トリガーを立てる
    const getRevealDelay = (rank) => rank >= 10 ? 1000 : rank === 9 ? 720 : rank === 8 ? 540 : rank === 7 ? 360 : rank === 6 ? 240 : rank === 5 ? 160 : 150;
    const groupEntries = Object.entries(timeGroups).map(([time, group]) => {
      const maxGroupRank = Math.max(...group.map(o => o.rank));
      return { time: Number(time), group, maxGroupRank, revealDelay: getRevealDelay(maxGroupRank) };
    });
    let lastEnd = -1, lastIdx = 0;
    groupEntries.forEach((g, gi) => { const end = g.time + g.revealDelay; if (end >= lastEnd) { lastEnd = end; lastIdx = gi; } });
    groupEntries.forEach(({ time, group, maxGroupRank, revealDelay }, gIdx) => autoOpenRef.current.push(setTimeout(() => {
      const isLastGroup = gIdx === lastIdx;
      // Open all cards in this time group at once
      const indices = group.map(o => o.i);
      setOpened(prev => {
        const next = new Set(prev);
        indices.forEach(idx => next.add(idx));
        return next;
      });
      // Use the highest rank in this group for effects
      const rank = maxGroupRank;
      const i = group.find(o => o.rank === maxGroupRank).i;
      // Pre-open tension sound for rare items
      if (rank >= 10) {
        // Deep rumble + rising sweep before GOD
        playNote(50, 0.6, 'sawtooth', 0.12);
        playNote(70, 0.5, 'triangle', 0.1, 0.08);
        playNoise(0.2, 0.08);
        playSweep(80, 400, 0.8, 'sine', 0.06, 0.3);
        playNote(200, 0.4, 'triangle', 0.05, 0.5);
      } else if (rank === 9) {
        // Ethereal sweep + deep tone before Mythic
        playSweep(100, 900, 0.5, 'sine', 0.1);
        playNote(150, 0.4, 'triangle', 0.08);
        playNote(300, 0.3, 'sine', 0.06, 0.2);
        playNoise(0.1, 0.04);
      } else if (rank === 8) {
        // Metallic shimmer + ascending before Legend
        playNote(500, 0.12, 'square', 0.05);
        playNote(750, 0.15, 'sine', 0.07, 0.04);
        playNote(1000, 0.12, 'sine', 0.05, 0.1);
        playSweep(300, 800, 0.3, 'sine', 0.04);
      } else if (rank === 7) {
        // Sparkle cascade before Epic
        playNote(700, 0.08, 'sine', 0.06);
        playNote(900, 0.1, 'sine', 0.06, 0.04);
        playNote(1100, 0.08, 'sine', 0.05, 0.08);
      } else if (rank === 6) {
        // Bright chime before Ultra
        playNote(600, 0.08, 'sine', 0.05);
        playNote(800, 0.1, 'sine', 0.05, 0.04);
      } else if (rank === 5) {
        // Soft sparkle before SSRare
        playNote(900, 0.06, 'sine', 0.04);
        playNote(1100, 0.06, 'sine', 0.03, 0.03);
      }
      // Chest open sound (delayed for rank 5+)
      const chestSoundDelay = rank >= 10 ? 600 : rank === 9 ? 420 : rank === 8 ? 300 : rank === 7 ? 180 : rank === 6 ? 100 : rank === 5 ? 50 : 0;
      autoOpenRef.current.push(setTimeout(() => {
        const ct = getChestType(rank);
        sfx(ct === "rainbow" ? 'chestRainbow' : ct === "gold" ? 'chestGold' : ct === "silver" ? 'chestSilver' : 'chestWood');
      }, chestSoundDelay));
      // Reveal sound + collection add + rare effects
      // 獲得の確定(コレクション追加＋最終グループなら保存トリガー)は取り消し時にも必ず走らせる
      const commit = () => {
        indices.forEach(idx => addToCollection(res[idx]));
        // 全アイテムがコレクションに入り切った直後にだけ保存を許可する
        if (isLastGroup) setGachaSaveReady(true);
      };
      pendingRevealRef.current.push(commit);
      autoOpenRef.current.push(setTimeout(() => {
        const ci = pendingRevealRef.current.indexOf(commit);
        if (ci < 0) return;                       // 新pullの割り込みで確定済み → 二重加算しない
        pendingRevealRef.current.splice(ci, 1);
        commit();
        const r = res[i];
        const revealSound = r.rank >= 10 ? 'reveal10' : r.rank === 9 ? 'reveal9' : r.rank === 8 ? 'reveal8'
          : r.rank === 7 ? 'reveal7' : r.rank >= 5 ? 'reveal5' : r.rank >= 3 ? 'reveal3' : 'reveal1';
        sfx(revealSound);
        // Rare visual effects + gorgeous reveal sounds
        if (r.rank >= 10) {
          setRareEffect({ type: 'god', rank: r.rank, item: r }); // itemは降臨演出で当該アイテムの絵を出すため
          // 壮大なGODファンファーレ: 低音衝撃 → 8音アルペジオ → 4和音ブルーム → 天上のきらめき
          playNote(55, 0.5, 'sawtooth', 0.12);
          playSweep(100, 2500, 0.8, 'sine', 0.1);
          [392, 494, 587, 698, 831, 1047, 1319, 1568].forEach((f, i) => playNote(f, 0.35, 'sine', 0.12, 0.1 + i * 0.06));
          playChord([1047, 1319, 1568, 2093], 1.2, 'sine', 0.07, 0.6);
          playChord([1319, 1568, 2093], 0.8, 'triangle', 0.04, 0.8);
          [2093, 2349, 2637, 3136].forEach((f, i) => playNote(f, 0.2, 'sine', 0.03, 1.0 + i * 0.1));
          autoOpenRef.current.push(setTimeout(() => setRareEffect(null), 3500));
        } else if (r.rank === 9) {
          setRareEffect({ type: 'mythic', rank: 9 });
          // 神秘的ミシカルファンファーレ: スウィープ → 6音アルペジオ → 和音ブルーム → きらめき
          playNote(100, 0.3, 'triangle', 0.08);
          playSweep(150, 1500, 0.5, 'sine', 0.09);
          [370, 440, 554, 659, 831, 1047].forEach((f, i) => playNote(f, 0.3, 'sine', 0.11, 0.08 + i * 0.06));
          playChord([831, 1047, 1319], 0.7, 'sine', 0.07, 0.5);
          playChord([1047, 1319, 1568], 0.5, 'triangle', 0.04, 0.65);
          [1568, 1760, 2093].forEach((f, i) => playNote(f, 0.15, 'sine', 0.03, 0.8 + i * 0.07));
          autoOpenRef.current.push(setTimeout(() => setRareEffect(null), 2500));
        } else if (r.rank === 8) {
          setRareEffect({ type: 'legend', rank: 8 });
          // レジェンド: メタルクリック → 5音上昇 → 輝く和音
          playNote(400, 0.08, 'square', 0.05);
          playSweep(350, 1000, 0.3, 'sine', 0.06);
          [494, 587, 698, 880, 1047].forEach((f, i) => playNote(f, 0.25, 'sine', 0.1, 0.06 + i * 0.06));
          playChord([880, 1047, 1319], 0.5, 'sine', 0.06, 0.4);
          playNote(1319, 0.3, 'triangle', 0.04, 0.5);
          autoOpenRef.current.push(setTimeout(() => setRareEffect(null), 1500));
        } else if (r.rank === 7) {
          setRareEffect({ type: 'epic', rank: 7 });
          // エピック: スパーク → 4音上昇 → シマー和音
          playNote(350, 0.06, 'square', 0.04);
          [523, 659, 831, 1047].forEach((f, i) => playNote(f, 0.2, 'sine', 0.1, 0.04 + i * 0.06));
          playChord([831, 1047, 1319], 0.35, 'sine', 0.05, 0.3);
          playNote(1319, 0.2, 'triangle', 0.03, 0.38);
          autoOpenRef.current.push(setTimeout(() => setRareEffect(null), 1000));
        } else if (r.rank === 6) {
          setRareEffect({ type: 'ultra', rank: 6 });
          // ウルトラ: 明るい3音チャイム + 余韻
          playSweep(400, 700, 0.1, 'sine', 0.04);
          [523, 659, 831].forEach((f, i) => playNote(f, 0.15, 'sine', 0.09, i * 0.05));
          playNote(1047, 0.2, 'sine', 0.04, 0.2);
          autoOpenRef.current.push(setTimeout(() => setRareEffect(null), 700));
        } else if (r.rank === 5) {
          setRareEffect({ type: 'ssrare', rank: 5 });
          // SSレア: きらめく3音
          [523, 659, 784].forEach((f, i) => playNote(f, 0.12, 'sine', 0.07, i * 0.04));
          autoOpenRef.current.push(setTimeout(() => setRareEffect(null), 400));
        }
        // Notify family of rare pull + history for ALL ★8+ in this group
        indices.forEach(idx => {
          const gi = res[idx];
          if (gi.rank >= 8 && nickname && window.fbDb) {
            window.fbDb.ref('notifications').push({
              name: nickname, rank: gi.rank, item: gi.name, icon: gi.icon,
              rarity: gi.rarity.label, timestamp: Date.now()
            }).catch(() => {});
          }
        });
      }, revealDelay));
    }, time)));
    }, uraDelay)); // Delay chest animation if ura item was shown
  }, [addToCollection, nickname, uraUnlocked, uraPool, uraObtained]);

  const pull = useCallback((n) => {
    // 表示・disabled判定と同じ算出口を通す(setBonusesRefは描画のたびに更新済み=クリック時点の現在値)
    const cost = gachaCostFor(n, setBonusesRef.current);
    if (coins < cost) return;
    if (window.__gPullBusy) return;   // 多重実行ガード(連打による二重課金+開封タイマー消失の防止)
    window.__gPullBusy = true;
    setTimeout(() => { window.__gPullBusy = false; }, 1500);
    bgm.stop(); stopMainBgm();
    setCoins(c => c - cost);
    setTotalPulls(t => t + n);
    contributeMission('gacha', n);
    // 神域の解放判定に現在のcollectionが要る。pullの依存配列にcollectionが無いためrefで渡す(常に最新)
    const res = Array.from({ length: n }, () => rollMonster(crownBonus, collectionRef.current));
    const maxRank = Math.max(...res.map(r => r.rank));

    // Cue effect (foreshadowing) - 8 patterns, 1.5x probability
    let cueDelay = 0;
    const cueRoll = Math.random();
    if (maxRank >= 9 && Math.random() < 0.75) {
      if (cueRoll < 0.5) {
        // パターンA: 荘厳和音
        playNote(262, 0.4, 'sine', 0.1);
        playNote(330, 0.4, 'sine', 0.08, 0.05);
        playNote(392, 0.5, 'sine', 0.1, 0.1);
        setCueEffect('mythic');
        cueDelay = 600;
      } else {
        // パターンB: 深淵の鼓動
        playNote(65, 0.5, 'sawtooth', 0.1);
        playNote(130, 0.4, 'triangle', 0.08, 0.15);
        playSweep(100, 500, 0.6, 'sine', 0.06);
        setCueEffect('mythic2');
        cueDelay = 700;
      }
    } else if (maxRank >= 8 && Math.random() < 0.6) {
      if (cueRoll < 0.5) {
        // パターンA: 重低音ドゴーン
        playNote(80, 0.3, 'triangle', 0.15);
        playNote(100, 0.4, 'triangle', 0.1, 0.1);
        setCueEffect('heavy');
        cueDelay = 400;
      } else {
        // パターンB: 地鳴り
        playNote(60, 0.4, 'sawtooth', 0.1);
        playNoise(0.15, 0.06);
        playNote(120, 0.3, 'triangle', 0.08, 0.1);
        setCueEffect('heavy2');
        cueDelay = 450;
      }
    } else if (maxRank >= 7 && Math.random() < 0.45) {
      if (cueRoll < 0.5) {
        // パターンA: 金属音シャキーン
        playNote(1200, 0.08, 'square', 0.06);
        playNote(800, 0.15, 'sine', 0.08, 0.03);
        setCueEffect('metal');
        cueDelay = 300;
      } else {
        // パターンB: 剣が鳴る音
        playNote(1500, 0.06, 'square', 0.05);
        playNote(1000, 0.1, 'sine', 0.07, 0.02);
        playNote(600, 0.12, 'triangle', 0.05, 0.06);
        setCueEffect('metal2');
        cueDelay = 350;
      }
    } else if (maxRank >= 5 && Math.random() < 0.3) {
      if (cueRoll < 0.5) {
        // パターンA: キラッ
        playNote(1400, 0.06, 'sine', 0.05);
        playNote(1800, 0.08, 'sine', 0.04, 0.03);
        setCueEffect('sparkle');
        cueDelay = 200;
      } else {
        // パターンB: 風のささやき
        playSweep(800, 1600, 0.15, 'sine', 0.04);
        playNote(1200, 0.1, 'sine', 0.04, 0.05);
        setCueEffect('sparkle2');
        cueDelay = 250;
      }
    } else {
      sfx('gachaPull');
    }

    if (cueDelay > 0) setGachaPhase("cue");
    setTimeout(() => {
      setCueEffect(null);
      startChestOpen(res);
    }, cueDelay);
  }, [coins, startChestOpen, crownBonus, contributeMission]);

  useEffect(() => () => autoOpenRef.current.forEach(t => clearTimeout(t)), []);



  // Synthesis: same type + same rank × 3 → rank+1. ★10 × 3 → ★MAX
  // Synthesis: ★1-2=2体, ★3-9=3体(同種同ランク), ★10=異種含む3体→★MAXランダム
  const getReq = getSynthReq;

  const findSynthCandidates = useCallback(() => computeSynthCandidates(collection), [collection]);
  // ★MAX進化(煌)の候補。一撃合成には混ぜないため findSynthCandidates とは別経路で渡す。
  const findPrismCandidates = useCallback(() => computePrismCandidates(collection), [collection]);

  const playSynthSound = (targetRank) => {
    if (targetRank >= 11) {
      // ★MAX: 壮大なファンファーレ
      playNote(65, 0.5, 'sawtooth', 0.1);
      playSweep(200, 2000, 0.6, 'sine', 0.1);
      [440, 554, 659, 831, 1047, 1319, 1568].forEach((f, i) => playNote(f, 0.3, 'sine', 0.1, 0.15 + i * 0.07));
      playChord([1319, 1568, 2093], 0.8, 'sine', 0.08, 0.7);
    } else if (targetRank === 10) {
      // ★10 GOD: ガチャGOD降臨レベルの壮大な演出
      playNote(55, 0.6, 'sawtooth', 0.12);
      playSweep(100, 2500, 0.8, 'sine', 0.1);
      playNoise(0.2, 0.06);
      [392, 494, 587, 698, 831, 1047, 1319, 1568].forEach((f, i) => playNote(f, 0.35, 'sine', 0.12, 0.1 + i * 0.06));
      playChord([1047, 1319, 1568, 2093], 1.0, 'sine', 0.07, 0.6);
      playChord([1319, 1568, 2093], 0.7, 'triangle', 0.04, 0.8);
      [2093, 2349, 2637].forEach((f, i) => playNote(f, 0.2, 'sine', 0.03, 1.0 + i * 0.08));
    } else if (targetRank === 9) {
      // ★9 Mythic: 深い導入 → 壮大な上昇アルペジオ → 荘厳和音ブルーム
      playNote(110, 0.3, 'sawtooth', 0.08);
      playSweep(130, 1200, 0.6, 'sine', 0.1);
      playNoise(0.08, 0.04);
      [392, 494, 587, 698, 831, 1047].forEach((f, i) => playNote(f, 0.28, 'sine', 0.1, 0.1 + i * 0.06));
      playChord([831, 1047, 1319], 0.7, 'sine', 0.07, 0.5);
      playChord([1047, 1319, 1568], 0.5, 'triangle', 0.04, 0.65);
      [1568, 1760, 2093].forEach((f, i) => playNote(f, 0.15, 'sine', 0.03, 0.75 + i * 0.08));
    } else if (targetRank === 8) {
      // ★8 Legend: メタリック導入 → 5音アルペジオ → 輝く和音
      playNote(400, 0.1, 'square', 0.06);
      playSweep(300, 900, 0.35, 'sine', 0.07);
      [494, 587, 698, 831, 1047].forEach((f, i) => playNote(f, 0.25, 'sine', 0.1, 0.08 + i * 0.06));
      playChord([831, 1047, 1319], 0.5, 'sine', 0.07, 0.4);
      playNote(1319, 0.3, 'triangle', 0.04, 0.5);
      playNoise(0.04, 0.03);
    } else if (targetRank === 7) {
      // ★7 Epic: スパーク導入 → 4音上昇 → シマー和音
      playNote(350, 0.08, 'square', 0.04);
      [494, 622, 784, 988].forEach((f, i) => playNote(f, 0.22, 'sine', 0.1, 0.04 + i * 0.06));
      playChord([784, 988, 1175], 0.4, 'sine', 0.06, 0.3);
      playNote(1175, 0.25, 'triangle', 0.04, 0.4);
      playNoise(0.03, 0.03);
    } else if (targetRank === 6) {
      // ★6 Ultra: 明るい導入 → 4音チャイム → 余韻
      playSweep(400, 700, 0.15, 'sine', 0.05);
      [440, 554, 659, 831].forEach((f, i) => playNote(f, 0.18, 'sine', 0.09, 0.05 + i * 0.06));
      playChord([659, 831, 1047], 0.35, 'sine', 0.05, 0.3);
      playNote(1047, 0.2, 'triangle', 0.03, 0.38);
    } else if (targetRank === 5) {
      // ★5 SSRare: きらめく3音 + 余韻
      playSweep(500, 800, 0.12, 'sine', 0.04);
      [523, 659, 784].forEach((f, i) => playNote(f, 0.15, 'sine', 0.08, i * 0.05));
      playNote(1047, 0.2, 'sine', 0.04, 0.2);
    } else {
      sfx('synth');
    }
  };

  const synthQueueRef = useRef(null);

  // ★MAXリロールの直列化(2026-08-25 修正): 一撃合成で★MAXが複数生まれた時、最後の1個にしか
  // ダイアログが出ていなかった。表示中の1個は synthRetry、待機列は synthRetryQueueRef で持つ。
  const synthRetryQueueRef = useRef([]);
  const collectionRef = useRef(collection);
  collectionRef.current = collection;

  const sendMaxNotif = useCallback((name, icon) => {
    if (nickname && window.fbDb) {
      window.fbDb.ref('notifications').push({ name: nickname, rank: 11, item: name, icon, rarity: '★MAX', timestamp: Date.now(), isSynth: true }).catch(() => {});
    }
  }, [nickname]);

  // 次の★MAXをダイアログに出す。適格(★MAXを4種類以上所持)でない分はダイアログを出さず通知だけ送る。
  const advanceSynthRetry = useCallback(() => {
    const cur = collectionRef.current || {};
    const eligible = TYPES.filter(t => maxEffCount(cur, t.id) > 0).length >= 4;
    while (synthRetryQueueRef.current.length > 0) {
      const next = synthRetryQueueRef.current.shift();
      if (eligible && next.resultTypeId) { setSynthRetry(next); return; }
      if (next.pendingNotif) sendMaxNotif(next.resultName, next.resultIcon);
    }
    setSynthRetry(null);
  }, [sendMaxNotif]);

  // 「このままでOK」/ 背景タップ = 確定 → 通知を送り、次の★MAXへ進む
  const acceptSynthRetry = useCallback(() => {
    if (synthRetry && synthRetry.pendingNotif) sendMaxNotif(synthRetry.resultName, synthRetry.resultIcon);
    advanceSynthRetry();
  }, [synthRetry, sendMaxNotif, advanceSynthRetry]);

  // 未処理のキューを捨てる時は、確定済みアイテムの通知だけ送っておく(通知の無言欠落防止)
  const flushSynthRetryQueue = useCallback(() => {
    const rest = synthRetryQueueRef.current;
    synthRetryQueueRef.current = [];
    rest.forEach(it => { if (it.pendingNotif) sendMaxNotif(it.resultName, it.resultIcon); });
  }, [sendMaxNotif]);

  const doSynthSingle = useCallback((keyOrSpecial, typeId, rank, targetRank) => {
    // ★MAX進化(煌): 消費元が足りない時は演出も鳴らさず何もしない(先に弾く)
    if (keyOrSpecial === 'prism' && ((collection[`${typeId}_11`]?.count) || 0) < PRISM_MERGE) return;
    // Clear any pending synth timers from previous synthesis
    if (synthQueueRef.current) { synthQueueRef.current.forEach(t => clearTimeout(t)); synthQueueRef.current = null; }
    flushSynthRetryQueue();
    bgm.stop(); stopMainBgm();
    setTimeout(() => playSynthSound(targetRank), 200);
    contributeMission('synth', 1);
    if (keyOrSpecial === 'prism') {
      // ★MAX×3 → 「・煌」1個。リロール対象外(意思を持ってやる特別な操作)・通知も送らない。
      setCollection(prev => {
        const n = { ...prev };
        const bk = `${typeId}_11`;
        const left = ((n[bk]?.count) || 0) - PRISM_MERGE;
        if (left > 0) n[bk] = { ...n[bk], count: left }; else delete n[bk];
        const tp = TYPES.find(t => t.id === typeId);
        const nm = MONSTERS[typeId][10]; const nr = RARITIES[10];
        const pk = typeId + PRISM_SUFFIX;
        if (n[pk]) n[pk] = { ...n[pk], count: n[pk].count + 1 };
        else n[pk] = { ...nm, name: nm.name + PRISM_NAME_SUFFIX, typeId, typeName: tp.name, typeEmoji: tp.emoji, typeColor: tp.color, rank: 11, rarity: nr, prism: true, count: 1 };
        setSynthResult({ icon: nm.icon, name: nm.name + PRISM_NAME_SUFFIX, rank: 11, rarity: nr, img: nm.img, prism: true });
        return n;
      });
    } else if (rank === 10 && targetRank === 11) {
      // ★10 special: consume 3 from any ★10 (keep 1 per type), produce random ★MAX
      setCollection(prev => {
        const n = { ...prev };
        let rem = 3;
        for (const tp of TYPES) {
          if (rem <= 0) break;
          const k = `${tp.id}_10`;
          if (n[k] && n[k].count > 1) {
            const take = Math.min(n[k].count - 1, rem);
            n[k] = { ...n[k], count: n[k].count - take };
            rem -= take;
          }
        }
        const rt = rollMaxType(n);
        const nm = MONSTERS[rt.id][10]; const nr = RARITIES[10];
        const nk = `${rt.id}_11`;
        if (n[nk]) n[nk] = { ...n[nk], count: n[nk].count + 1 };
        else n[nk] = { ...nm, typeId: rt.id, typeName: rt.name, typeEmoji: rt.emoji, typeColor: rt.color, rank: 11, rarity: nr, count: 1 };
        setSynthResult({ icon: nm.icon, name: nm.name, rank: 11, rarity: nr, img: nm.img });
        // Check if player owns 4+ unique ★MAX types → offer retry
        const maxPatternsOwned = TYPES.filter(t => maxEffCount(n, t.id) > 0).length;
        if (maxPatternsOwned >= 4) {
          // Don't send notification yet - wait for retry decision
          setSynthRetry({ resultTypeId: rt.id, resultName: nm.name, resultIcon: nm.icon, pendingNotif: true });
        } else {
          // No retry available, send notification immediately
          if (nickname && window.fbDb) {
            window.fbDb.ref('notifications').push({ name: nickname, rank: 11, item: nm.name, icon: nm.icon, rarity: '★MAX', timestamp: Date.now(), isSynth: true }).catch(() => {});
          }
        }
        playNote(50, 0.8, 'sawtooth', 0.12);
        playSweep(80, 3000, 1.0, 'sine', 0.1);
        playNoise(0.3, 0.08);
        [262, 330, 392, 494, 587, 698, 831, 1047, 1319, 1568].forEach((f, i) => playNote(f, 0.35, 'sine', 0.1, 0.3 + i * 0.08));
        playChord([1047, 1319, 1568, 2093], 1.5, 'sine', 0.08, 1.2);
        playChord([1319, 1568, 2093], 1.0, 'triangle', 0.05, 1.5);
        [2093, 2349, 2637, 3136, 3520].forEach((f, i) => playNote(f, 0.25, 'sine', 0.04, 1.8 + i * 0.1));
        return n;
      });
    } else {
      const req = getReq(rank);
      const item = collection[keyOrSpecial];
      if (!item || item.count < req + 1) return;
      setCollection(prev => {
        const n = { ...prev };
        n[keyOrSpecial] = { ...n[keyOrSpecial], count: n[keyOrSpecial].count - req };
        const tp = TYPES.find(t => t.id === typeId);
        const nm = MONSTERS[typeId][targetRank - 1]; const nr = RARITIES[targetRank - 1];
        const nk = `${typeId}_${targetRank}`;
        if (n[nk]) n[nk] = { ...n[nk], count: n[nk].count + 1 };
        else n[nk] = { ...nm, typeId, typeName: tp.name, typeEmoji: tp.emoji, typeColor: tp.color, rank: targetRank, rarity: nr, count: 1 };
        return n;
      });
      setSynthResult({ icon: MONSTERS[typeId][targetRank - 1].icon, name: MONSTERS[typeId][targetRank - 1].name, rank: targetRank, rarity: RARITIES[targetRank - 1] });
    }
    const synthDuration = targetRank >= 11 ? 4100 : targetRank === 10 ? 3100 : targetRank === 9 ? 2600 : targetRank === 8 ? 2100 : 1600;
    synthQueueRef.current = [setTimeout(() => { setSynthResult(null); resumeMainBgm(); }, synthDuration)];
  }, [collection, contributeMission, flushSynthRetryQueue]);

  const doSynthMaxRetry = useCallback(() => {
    if (!synthRetry) return;
    // Remove the old result
    setCollection(prev => {
      const n = { ...prev };
      const oldKey = `${synthRetry.resultTypeId}_11`;
      if (n[oldKey] && n[oldKey].count > 1) n[oldKey] = { ...n[oldKey], count: n[oldKey].count - 1 };
      else if (n[oldKey]) delete n[oldKey];
      // Roll new random ★MAX
      const rt = rollMaxType(n);
      const nm = MONSTERS[rt.id][10]; const nr = RARITIES[10];
      const nk = `${rt.id}_11`;
      if (n[nk]) n[nk] = { ...n[nk], count: n[nk].count + 1 };
      else n[nk] = { ...nm, typeId: rt.id, typeName: rt.name, typeEmoji: rt.emoji, typeColor: rt.color, rank: 11, rarity: nr, count: 1 };
      setSynthResult({ icon: nm.icon, name: nm.name, rank: 11, rarity: nr, img: nm.img });
      if (nickname && window.fbDb) {
        window.fbDb.ref('notifications').push({ name: nickname, rank: 11, item: nm.name, icon: nm.icon, rarity: '★MAX', timestamp: Date.now(), isSynth: true }).catch(() => {});
      }
      playSynthSound(11);
      // 再抽選の演出が終わってから次の★MAXのダイアログへ進む(直列化)
      synthQueueRef.current = [setTimeout(() => { setSynthResult(null); advanceSynthRetry(); }, 3600)];
      return n;
    });
    setSynthRetry(null);
  }, [synthRetry, advanceSynthRetry]);

  const doSynthAll = useCallback(() => {
    // Clear any pending synth timers from previous synthesis
    if (synthQueueRef.current) { synthQueueRef.current.forEach(t => clearTimeout(t)); synthQueueRef.current = null; }
    if (computeSynthCandidates(collection).length === 0) return;
    flushSynthRetryQueue();
    bgm.stop(); stopMainBgm();

    // 一撃合成: 合成で生まれたアイテムも連鎖して合成し尽くす(2026-08-25 竹森氏指示)
    // 通知(notifications)は生成時ではなく、リロール確定後の最終アイテムに対して送る(2026-08-25 修正)
    const { coll: n, rareItems, totalSynths } = runSynthCascade(collection);
    setCollection(n);
    // 一撃合成(連鎖)分もデイリーミッションに加算(2026-08-25: 単発合成しか加算されていなかった取りこぼしを修正)
    contributeMission('synth', totalSynths);

    if (rareItems.length > 0) {
      // Sort by rank ascending: ★8 first → ★MAX last (climactic reveal)
      rareItems.sort((a, b) => a.rank - b.rank);
      // Play sound for 1st item
      setTimeout(() => playSynthSound(rareItems[0].rank), 200);
      // Show items one by one with sequential timers (duration varies by rank)
      setSynthResult({ batch: true, count: totalSynths, rareItems, rareIndex: 0 });
      if (synthQueueRef.current) synthQueueRef.current.forEach(t => clearTimeout(t));
      const timers = [];
      const getDuration = (r) => r >= 11 ? 3800 : r === 10 ? 2700 : r === 9 ? 2200 : 1800;   // ★9・★10の披露時間を各-100ms
      let elapsed = getDuration(rareItems[0].rank);
      for (let i = 1; i < rareItems.length; i++) {
        const ms = elapsed;
        const itemRank = rareItems[i].rank;
        timers.push(setTimeout(() => {
          playSynthSound(itemRank);
          setSynthResult(prev => prev ? { ...prev, rareIndex: i } : null);
        }, ms));
        elapsed += getDuration(rareItems[i].rank);
      }
      // After last item, show summary briefly then clear
      timers.push(setTimeout(() => {
        setSynthResult(prev => prev ? { ...prev, rareIndex: -1 } : null);
      }, elapsed));
      timers.push(setTimeout(() => {
        setSynthResult(null);
        resumeMainBgm();
        // ★MAXが複数生まれた時は1個ずつ直列に確認する(2026-08-25 修正: 最後の1個にしか出ていなかった)
        synthRetryQueueRef.current = rareItems.filter(r => r.rank === 11).map(it => {
          const rt = TYPES.find(t => MONSTERS[t.id][10].name === it.name);
          return { resultTypeId: rt ? rt.id : null, resultName: it.name, resultIcon: it.icon, pendingNotif: true };
        });
        advanceSynthRetry();
      }, elapsed + 1300));
      synthQueueRef.current = timers;
    } else {
      sfx('synth');
      setSynthResult({ batch: true, count: totalSynths });
      synthQueueRef.current = [setTimeout(() => { setSynthResult(null); resumeMainBgm(); }, 2100)];
    }
  }, [collection, findSynthCandidates, contributeMission, advanceSynthRetry, flushSynthRetryQueue]);

  const nav = (s) => { sfx('click'); setScreen(s); setMiniGame(null); setGachaPhase("idle"); if (s !== 'collection') setRequestMode(false); setShowUraMuseum(false); };

  // Main BGM: play on idle screens, stop during gacha/minigame/synth
  const mainBgmRef = useRef(false);
  const stopMainBgm = () => { mainBgmControl.pause(); mainBgmRef.current = false; };
  const resumeMainBgm = () => { if (volMain > 0 && loaded && slotId !== null) { mainBgmControl.play(); mainBgmRef.current = true; } };
  useEffect(() => {
    if (!loaded || slotId === null || volMain === 0) {
      if (mainBgmRef.current) { mainBgmControl.stop(); mainBgmRef.current = false; }
      return;
    }
    const isMinigamePlaying = screen === 'minigame' && miniGame;
    const isGachaActive = screen === 'gacha' && (gachaPhase === 'chests' || gachaPhase === 'cue');
    const isSynthActive = !!synthResult;
    const isClearActive = showClear;
    const isRareActive = !!rareEffect;
    const shouldPlay = !isMinigamePlaying && !isGachaActive && !isSynthActive && !isClearActive && !isRareActive;

    if (shouldPlay && !mainBgmRef.current) {
      mainBgmControl.play();
      mainBgmRef.current = true;
    } else if (!shouldPlay && mainBgmRef.current) {
      mainBgmControl.pause();
      mainBgmRef.current = false;
    }
  }, [screen, miniGame, gachaPhase, synthResult, showClear, rareEffect, loaded, slotId, volMain]);
  const allOpened = gachaResults.length > 0 && opened.size === gachaResults.length;

  // Auto-save when the gacha results are fully in the collection (prevent reload exploit)
  // トリガーは「箱が開いた瞬間(allOpened)」ではなく「最終グループの addToCollection 完了後」。
  // 箱が開いた時点ではコインだけ減ってアイテムが未追加のため、その瞬間の保存はコインを失うだけになる
  const gachaSavedRef = useRef(false);
  useEffect(() => {
    if (gachaSaveReady && !gachaSavedRef.current && slotId !== null) {
      gachaSavedRef.current = true;
      lastAutoSave.current = Date.now();
      addLog("ガチャ結果セーブ");
      saveToSlot(slotId, true);
    }
    if (!gachaSaveReady) gachaSavedRef.current = false;
  }, [gachaSaveReady, slotId, saveToSlot]);

  const GAME_NAMES = { tap: '連打バトル', shooting: 'シューティング', gem: 'ジュエルキャッチ', timing: 'ルパンタイマー', tower: 'コインタワー', memory: '神経衰弱', quickdraw: '早撃ちガンマン', coinRunner: 'コインランナー', juggler: 'ジャグラー', godAnother: 'ゴッドアナザー', batting: 'バッティングヒーロー', pinball: 'ピンボール', chainBurst: 'チェインバースト', mathEasy: '計算初級', kuku: '九九', mathMid: '計算中級', mathHardAdd: '上級±', mathHardMult: '上級×÷' };
  const GAME_IDS = Object.keys(GAME_NAMES);

  // Load ranking crowns from Firebase (weekly + cumulative)
  const [crowns, setCrowns] = useState({ gold: 0, silver: 0, bronze: 0, goldGames: [], silverGames: [], bronzeGames: [] });
  const [crownsAll, setCrownsAll] = useState({ gold: 0, silver: 0, bronze: 0, goldGames: [], silverGames: [], bronzeGames: [] });

  const countCrowns = (entries, nick, includeGift) => {
    let gold = 0, silver = 0, bronze = 0, goldGames = [], silverGames = [], bronzeGames = [];
    GAME_IDS.forEach(gid => {
      const scores = entries.filter(e => (e.bestScores?.[scoreKeyOf(gid)] || 0) > 0).sort((a, b) => (b.bestScores?.[scoreKeyOf(gid)] || 0) - (a.bestScores?.[scoreKeyOf(gid)] || 0));
      if (scores.length > 0 && scores[0].name === nick) { gold++; goldGames.push(GAME_NAMES[gid]); }
      else if (scores.length > 1 && scores[1].name === nick) { silver++; silverGames.push(GAME_NAMES[gid]); }
      else if (scores.length > 2 && scores[2].name === nick) { bronze++; bronzeGames.push(GAME_NAMES[gid]); }
    });
    // Gift count ranking
    if (includeGift) {
      const giftRank = entries.filter(e => (e.totalGiftValue || 0) > 0).sort((a, b) => (b.totalGiftValue || 0) - (a.totalGiftValue || 0));
      if (giftRank.length > 0 && giftRank[0].name === nick) { gold++; goldGames.push('ギフト'); }
      else if (giftRank.length > 1 && giftRank[1].name === nick) { silver++; silverGames.push('ギフト'); }
      else if (giftRank.length > 2 && giftRank[2].name === nick) { bronze++; bronzeGames.push('ギフト'); }
    }
    return { gold, silver, bronze, goldGames, silverGames, bronzeGames };
  };

  useEffect(() => {
    if (!nickname || !window.fbDb) return;
    const weekId = getWeekId();
    // Ensure this week's weeklyScores are written (only scores earned THIS week, not all-time bestScores)
    const ws = weeklyScores || {};
    if (ws._weekId === weekId) {
      const updates = {};
      Object.entries(ws).forEach(([gid, score]) => {
        if (gid !== '_weekId' && score > 0) updates[gid] = score;
      });
      if (Object.keys(updates).length > 0) {
        window.fbDb.ref('weeklyRankings/' + weekId + '/' + nickname).update(updates).catch(() => {});
      }
    }
    // Weekly crowns (for gacha bonus)
    setTimeout(() => {
      window.fbDb.ref('weeklyRankings/' + weekId).once('value').then(snapshot => {
        const entries = [];
        snapshot.forEach(child => {
          const scores = child.val();
          if (scores) entries.push({ name: child.key, bestScores: scores });
        });
        setCrowns(countCrowns(entries, nickname, false));
      }).catch(() => {});
    }, 300);
    // Cumulative crowns (includes gift ranking)
    window.fbDb.ref('rankings').once('value').then(snapshot => {
      const entries = [];
      snapshot.forEach(child => { const d = child.val(); if (d && d.name) entries.push(d); });
      setCrownsAll(countCrowns(entries, nickname, true));
    }).catch(() => {});
  }, [nickname, bestScores, weeklyScores, missionDate]);
  const crownBonus = 1 + (crowns.gold * 0.06) + (crowns.silver * 0.03) + (crowns.bronze * 0.02);

  // Listen for rare pull notifications
  useEffect(() => {
    if (!window.fbDb) return;
    const ref = window.fbDb.ref('notifications').orderByChild('timestamp').limitToLast(6);
    const handler = ref.on('value', snapshot => {
      const notifs = [];
      snapshot.forEach(child => { const d = child.val(); if (d && d.name) notifs.push(d); });
      notifs.reverse();
      // Only show notifications from last 24 hours
      const cutoff = Date.now() - 86400000;
      setRareNotifs(notifs.filter(n => n.timestamp > cutoff));
    });
    return () => ref.off('value', handler);
  }, []);
  // Congratulations history (permanent, all entries)
  useEffect(() => {
    if (!window.fbDb) return;
    const ref = window.fbDb.ref('notifications/congrats').orderByChild('timestamp');
    const handler = ref.on('value', snapshot => {
      const items = [];
      snapshot.forEach(child => { const d = child.val(); if (d && d.name) items.push(d); });
      items.sort((a, b) => a.timestamp - b.timestamp);
      setCongratsHistory(items);
    });
    return () => ref.off('value', handler);
  }, []);
  // ONE-TIME: clear all existing item requests
  useEffect(() => {
    if (!window.fbDb || localStorage.getItem('_clearReqs_v1')) return;
    window.fbDb.ref('notifications/itemRequests').remove().catch(() => {});
    localStorage.setItem('_clearReqs_v1', '1');
  }, []);
  // Item requests (wishlist) - realtime, max 2 per player shown
  useEffect(() => {
    if (!window.fbDb) return;
    const ref = window.fbDb.ref('notifications/itemRequests').orderByChild('timestamp').limitToLast(20);
    const handler = ref.on('value', snapshot => {
      const reqs = [];
      snapshot.forEach(child => { const d = child.val(); if (d && d.name && d.typeId && d.rank && d.icon && d.itemName) reqs.push({ fbKey: child.key, ...d }); });
      reqs.reverse();
      // Show max 2 per player
      const perPlayer = {};
      const filtered = reqs.filter(r => {
        perPlayer[r.name] = (perPlayer[r.name] || 0) + 1;
        return perPlayer[r.name] <= 2;
      });
      setItemRequests(filtered);
    });
    return () => ref.off('value', handler);
  }, []);
  // Gift history (who sent what to whom) - realtime
  useEffect(() => {
    if (!window.fbDb) return;
    const ref = window.fbDb.ref('notifications/giftHistory').orderByChild('timestamp').limitToLast(20);
    const handler = ref.on('value', snapshot => {
      const hist = [];
      snapshot.forEach(child => { const d = child.val(); if (d && d.sender && d.receiver) hist.push(d); });
      hist.reverse();
      setGiftHistory(hist);
    });
    return () => ref.off('value', handler);
  }, []);
  // Daily Missions loading (simplified v3)
  useEffect(() => {
    const today = missionDate;
    const missions = generateDailyMissions(today);
    setDailyMissions(missions);
    setDailyCompleted({});
    setDailyProgress({});
    if (!window.fbDb) return;   // Firebase未接続でもミッション自体は表示する(進捗は0のまま)

    const ref = window.fbDb.ref('dailyMissions/' + today);
    const handler = ref.on('value', snapshot => {
      const data = snapshot.val() || {};
      const progress = {};
      const completed = {};
      missions.forEach(m => {
        const mData = data[m.id] || {};
        const contribs = mData.contributions || {};
        const total = Object.values(contribs).reduce((s, v) => s + (v || 0), 0);
        progress[m.id] = { total, target: m.target };
        completed[m.id] = total >= m.target;
      });
      setDailyProgress(progress);
      setDailyCompleted(completed);
      const allDone = missions.every(m => completed[m.id]);
      if (allDone && nickname && window.fbDb) {
        const claimRef = window.fbDb.ref('dailyMissions/' + today + '/claimed/' + nickname);
        claimRef.once('value').then(snap => {
          if (!snap.val()) {
            claimRef.set(true).then(() => {   // 書込成功後に付与(失敗時の翌回二重付与を防止)
              setCoins(c => c + 2000);
              setSaveMsg('🎉 デイリーミッション全達成！ +🪙2,000');
              setTimeout(() => setSaveMsg(''), 3000);
            }).catch(() => {});
          }
        });
      }
    });
    return () => ref.off('value', handler);
  }, [loaded, slotId, missionDate, nickname]);   // nicknameを依存に追加(未設定→設定後も全達成報酬が配られるように)

  // Phase 1: Called immediately when game ends - coins + scores recorded instantly
  const handleMiniGameScore = useCallback((gameId, earned) => {
    const boosted = nickname === 'ココミ' ? Math.round(earned * 1.3) : earned;
    // 芸術品セット効果: 獲得コイン+5%(コインのみ。スコア・ランキング・ミッションはboostedのまま)
    const gained = setBonusesRef.current.art
      ? Math.round(boosted * (1 + SET_BONUS_EFFECTS.art.rate)) : boosted;
    setCoins(p => p + gained);
    if (!nickname) {   // 無言欠落の可視化: 記録されないことをその場で知らせる(2026-08-24 RCA)
      setSaveMsg('⚠️ ニックネーム未設定のため、スコア・プレイ回数・デイリーミッションは記録されません');
      setTimeout(() => setSaveMsg(''), 5000);
    }
    // スコアは世代キー(scoreKeyOf)で記録する(godAnother=第8次で世代交代済み)
    const sk = scoreKeyOf(gameId);
    setBestScores(prev => {
      const isNewBest = boosted > (prev[sk] || 0);
      if (isNewBest) {
        setNewRecord({ gameId, score: boosted, prev: prev[sk] || 0 });
        setTimeout(() => setNewRecord(null), 3000);
      }
      const updated = isNewBest ? { ...prev, [sk]: boosted } : prev;
      if (isNewBest && nickname && window.fbDb) {
        window.fbDb.ref('rankings/' + nickname + '/bestScores/' + sk).set(boosted).catch(() => {});
      }
      return updated;
    });
    setPlayCounts(prev => {
      const updated = { ...prev, [gameId]: (prev[gameId] || 0) + 1 };
      if (nickname && window.fbDb) {
        // サーバ側加算(transaction)に変更: ローカル絶対値のsetだと端末間・リロードで巻き戻る(2026-08-24 RCA)
        window.fbDb.ref('rankings/' + nickname + '/playCounts/' + gameId).transaction(cur => (cur || 0) + 1).catch(() => {});
      }
      return updated;
    });
    setWeeklyScores(prev => {
      const weekId = getWeekId();
      const weekData = prev._weekId === weekId ? prev : { _weekId: weekId };
      const isNewWeekBest = boosted > (weekData[sk] || 0);
      const updated = isNewWeekBest ? { ...weekData, [sk]: boosted } : weekData;
      if (isNewWeekBest && nickname && window.fbDb) {
        window.fbDb.ref('weeklyRankings/' + weekId + '/' + nickname + '/' + sk).set(boosted).catch(() => {});
      }
      const today = getLocalDate();
      if (nickname && window.fbDb) {
        window.fbDb.ref('dailyRankings/' + today + '/' + nickname + '/' + sk).transaction(current => Math.max(current || 0, boosted)).catch(() => {});
      }
      return updated;
    });
    contributeMission('minigame', 1);
    if (gameId === 'tap') contributeMission('tap', boosted);
    if (gameId === 'timing') contributeMission('timing', boosted);
    if (gameId === 'shooting') contributeMission('shooting', boosted);
    if (gameId === 'quickdraw') contributeMission('quickdraw', boosted);
    if (gameId === 'memory') contributeMission('memory', boosted);
    if (gameId === 'godAnother') contributeMission('godAnother', boosted);
    if (gameId === 'juggler') contributeMission('juggler', boosted);
  }, [nickname, contributeMission]);
  // Phase 2: Called after result screen delay - closes game and returns to menu
  const handleMiniGameClose = useCallback(() => {
    bgm.stop();
    setMiniGame(null);
  }, []);
  // Combined handler for backward compatibility: score immediately, close after delay
  const handleMiniGameDone = useCallback((gameId, earned) => {
    handleMiniGameScore(gameId, earned);
    handleMiniGameClose();
  }, [handleMiniGameScore, handleMiniGameClose]);

  // Loading screen
  // Calculate power from a save data object
  const calcPower = (col) => {
    if (!col) return 0;
    return Object.entries(col).reduce((s, [k, v]) => {
      const count = typeof v === 'number' ? v : v?.count || 0;
      return s + entryPower(k, count);
    }, 0);
  };

  // Back to slot select
  const [prevSlotId, setPrevSlotId] = useState(null);
  const backToSlots = useCallback(async () => {
    if (slotId !== null) {
      setPrevSlotId(slotId);
      saveToSlot(slotId, true);
    }
    setTimeout(() => { setSlotId(null); setScreen("home"); }, 500);
  }, [slotId, saveToSlot]);

  if (!loaded) {
    return (
      <div className="G">
        <style>{CSS}</style>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16,
          background: 'url(bg.jpg) center top / cover no-repeat' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 30%, rgba(0,0,0,0) 20%, rgba(6,6,15,0.7) 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            {/* 金彫金ワードマーク(404時は金グラデ文字にフォールバック) */}
            <img src="assets/ui/hd-logo.webp" alt="TREASURE GACHA"
              style={{ height: 34, display: 'block', margin: '0 auto 8px', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}
              onError={e => { e.currentTarget.style.display = 'none'; const n = e.currentTarget.nextSibling; if (n) n.style.display = 'block'; }} />
            <div style={{ display: 'none', fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900,
              background: 'linear-gradient(180deg, #f5e3b0, #c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: 4, marginBottom: 8, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}>TREASURE GACHA</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, fontWeight: 700, color: 'rgba(201,168,76,0.65)', letterSpacing: 3 }}>LOADING...</div>
          </div>
        </div>
      </div>
    );
  }

  // Slot selection screen
  if (slotId === null) {
    return (
      <div className="G">
        <style>{CSS}</style>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24, position: 'relative',
          background: 'url(bg.jpg) center top / cover no-repeat' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 30%, rgba(6,6,15,0.85) 55%, rgba(6,6,15,0.95) 100%)', pointerEvents: 'none' }} />
          <div style={{ height: 160 }} />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', width: '100%' }}>
          {/* 金彫金ワードマーク(404時は金グラデ文字にフォールバック) */}
          <img src="assets/ui/hd-logo.webp" alt="TREASURE GACHA"
            style={{ height: 40, display: 'block', margin: '0 auto 6px', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}
            onError={e => { e.currentTarget.style.display = 'none'; const n = e.currentTarget.nextSibling; if (n) n.style.display = 'block'; }} />
          <div style={{ display: 'none', fontFamily: "'Orbitron',sans-serif", fontSize: 24, fontWeight: 900,
            background: 'linear-gradient(180deg, #f5e3b0, #c9a84c, #f5e3b0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: 4, marginBottom: 4, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}>
            TREASURE GACHA
          </div>
          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: 'rgba(201,168,76,0.6)', letterSpacing: 4, marginBottom: 28 }}>
            SELECT SAVE SLOT
          </div>

          {/* Nickname input */}
          <div style={{ marginBottom: 20, width: '100%', maxWidth: 340 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'rgba(255,255,255,0.5)' }}>ニックネーム</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="名前を入力..."
                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 10,
                  padding: '8px 12px', fontSize: 14, color: '#fff', fontFamily: "'Noto Sans JP',sans-serif", outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(139,92,246,0.25)'}
              />
              <button className="btn bs" style={{ fontSize: 12, padding: '8px 14px' }}
                onClick={async () => {
                  const oldNick = await window.storage.get('tgacha-nickname');
                  const oldName = oldNick?.value || '';
                  await window.storage.set('tgacha-nickname', nickname);
                  // Migrate Firebase ranking data to new nickname
                  if (window.fbDb && oldName && oldName !== nickname) {
                    try {
                      const oldData = await new Promise(r => window.fbDb.ref('rankings/' + oldName).once('value', s => r(s.val())));
                      if (oldData) {
                        await window.fbDb.ref('rankings/' + nickname).set({ ...oldData, name: nickname });
                        await window.fbDb.ref('rankings/' + oldName).remove();
                      }
                    } catch(e) {}
                  }
                  setSaveMsg("ニックネームを保存しました"); setTimeout(() => setSaveMsg(""), 2000);
                }}>保存</button>
            </div>
          </div>

          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'rgba(255,255,255,0.6)' }}>セーブスロットを選択</div>
          {!storageOk && (
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: 11, color: '#f87171', textAlign: 'center' }}>
              ⚠️ ストレージに接続できません。セーブ機能が制限されています。<br/>Claude.aiにログインした状態でアクセスしてください。
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 340 }}>
            {[1, 2, 3].map(id => {
              const data = slotPreviews[id - 1];
              const pwr = data ? calcPower(data.collection) + URA_ITEMS.filter(u => (data.uraObtained || []).includes(u.id)).reduce((s, u) => s + u.value, 0) : 0;
              const colCnt = data ? Object.keys(data.collection || {}).length : 0;
              const slotCleared = data ? BASE_TYPES.every(t => maxEffCount(data.collection || {}, t.id) > 0) : false;
              return (
                <div key={id} style={{
                  background: slotCleared ? 'linear-gradient(180deg, rgba(46,36,18,0.75), rgba(20,15,9,0.85))'
                    : data ? 'linear-gradient(180deg, rgba(32,25,15,0.72), rgba(14,11,7,0.85))' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${slotCleared ? 'rgba(255,215,0,0.4)' : data ? 'rgba(201,168,76,0.32)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 10, padding: 14,
                  boxShadow: data ? 'inset 0 1px 0 rgba(240,214,145,0.10), 0 2px 8px rgba(0,0,0,0.45)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 14,
                  cursor: 'pointer', transition: 'all 0.2s',
                }} onClick={() => { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); mainBgmAudio.play().catch(() => {}); loadSlot(id); }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(240,214,145,0.7)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = slotCleared ? 'rgba(255,215,0,0.4)' : data ? 'rgba(201,168,76,0.32)' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'none'; }}
                >
                  {/* Slot number: 金彫金風ナンバープレート */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 6, flexShrink: 0,
                    background: data ? 'linear-gradient(180deg, #2f2516 0%, #1a1409 55%, #251d12 100%)' : 'rgba(255,255,255,0.04)',
                    border: data ? '1px solid rgba(201,168,76,0.55)' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: data ? 'inset 0 1px 0 rgba(240,214,145,0.2), inset 0 -3px 8px rgba(0,0,0,0.7), 0 0 8px rgba(201,168,76,0.12)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Orbitron',sans-serif", fontSize: 20, fontWeight: 900,
                    color: data ? '#f2e0aa' : 'rgba(255,255,255,0.18)',
                    textShadow: data ? '0 0 8px rgba(201,168,76,0.45), 0 1px 2px rgba(0,0,0,0.85)' : 'none',
                  }}>{id}</div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {data ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 5, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 8, letterSpacing: 2, fontWeight: 700, color: 'rgba(232,213,163,0.5)', whiteSpace: 'nowrap' }}>総資産</span>
                          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, fontWeight: 700, color: '#f2e0aa',
                            textShadow: '0 0 8px rgba(201,168,76,0.35)' }}>
                            {formatYen(pwr)}
                          </span>
                          {slotCleared && <span className="rank-rainbow" style={{ fontSize: 9, fontWeight: 900, fontFamily: "'Orbitron',sans-serif" }}>CLEAR</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '2px 10px', fontSize: 10, color: 'rgba(232,213,163,0.45)', letterSpacing: 0.3, flexWrap: 'wrap' }}>
                          <span style={{ whiteSpace: 'nowrap' }}>展示 {colCnt}/69</span>
                          <span style={{ whiteSpace: 'nowrap' }}>ガチャ {(data.totalPulls || 0).toLocaleString()}</span>
                          <span style={{ whiteSpace: 'nowrap' }}>コイン {(data.coins || 0).toLocaleString()}</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 13, color: 'rgba(232,213,163,0.28)', letterSpacing: 1 }}>— 空きスロット —</div>
                    )}
                  </div>

                  {/* Delete button for slots with data */}
                  {data && (
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(id); }}
                      style={{ background: 'linear-gradient(180deg, #3b2018, #24100b)', border: '1px solid rgba(201,168,76,0.32)', borderRadius: 5, padding: '4px 9px',
                        fontSize: 10, color: '#d8a08c', cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif", fontWeight: 700 }}>
                      削除
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Back to home button when coming from slot change */}
          {prevSlotId !== null && (
            <button className="btn bs" style={{ marginTop: 20, fontSize: 13, padding: '10px 24px' }}
              onClick={() => { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); mainBgmAudio.play().catch(() => {}); loadSlot(prevSlotId); }}>
              🏠 ホームに戻る（スロット{prevSlotId}）
            </button>
          )}
        </div>
        </div>

        {/* Delete confirmation modal */}
        {confirmDeleteId && (
          <div className="mo" onClick={() => setConfirmDeleteId(null)}>
            <div className="mc" style={{ borderColor: 'rgba(239,68,68,0.4)' }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>⚠️</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#ef4444', marginBottom: 8 }}>データ削除</div>
              <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 20 }}>
                スロット{confirmDeleteId}のデータを<br/>本当に削除しますか？
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn" onClick={() => deleteSlot(confirmDeleteId)}
                  style={{ fontSize: 13, padding: '10px 20px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444' }}>
                  削除する
                </button>
                <button className="btn bs" style={{ fontSize: 13, padding: '10px 20px' }}
                  onClick={() => setConfirmDeleteId(null)}>
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="G">
      <style>{CSS}</style>
      <div className="hdr">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* ロゴ: 金彫金ワードマーク(404時はonErrorで従来の文字ロゴにフォールバック) */}
          <img src="assets/ui/hd-logo.webp" alt="TREASURE GACHA" className="hdr-logo"
            onError={e => { const n = e.currentTarget.nextSibling; if (n) n.style.display = 'block'; e.currentTarget.style.display = 'none'; }} />
          <div className="hdr-t" style={{ display: 'none' }}>TREASURE GACHA</div>
          <div className="hdr-slot">SLOT {slotId}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {(() => {
            const muted = (volMain === 0 && volGame === 0 && volSfxState === 0);
            return (
              <button onClick={() => setShowVolPanel(v => !v)} title="音量" className={`hdr-ib${muted ? ' off' : ''}`}>
                {/* 音量アイコン(404時はonErrorで従来の絵文字にフォールバック) */}
                <img src={`assets/ui/hd-vol-${muted ? 'off' : 'on'}.webp`} alt=""
                  onError={e => { const n = e.currentTarget.nextSibling; if (n) n.style.display = 'inline'; e.currentTarget.style.display = 'none'; }} />
                <span style={{ display: 'none' }}>{muted ? '🔇' : '🔊'}</span>
              </button>
            );
          })()}
          <button onClick={() => setShowSaveModal(true)} className="hdr-ib" title="セーブ">
            {/* セーブアイコン(404時はonErrorで従来の絵文字にフォールバック) */}
            <img src="assets/ui/hd-save.webp" alt=""
              onError={e => { const n = e.currentTarget.nextSibling; if (n) n.style.display = 'inline'; e.currentTarget.style.display = 'none'; }} />
            <span style={{ display: 'none' }}>💾</span>
          </button>
          <div className="coin">
            {/* 金貨アイコン(404時はonErrorで従来の絵文字にフォールバック) */}
            {renderCoinIcon(15)}
            {coins.toLocaleString()}
          </div>
        </div>
      </div>
      {showVolPanel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowVolPanel(false)}>
          <div style={{ position: 'absolute', top: 50, right: 8, background: 'rgba(20,15,35,0.97)', border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: 14, padding: '16px 18px', minWidth: 220, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 14, color: '#a78bfa' }}>音量設定</div>
            {[
              { label: 'BGM', icon: '🎵', val: volMain, set: (v) => {
                const nv = parseFloat(v); setVolMain(nv); volMainBgm = nv;
                mainBgmControl.setVolume(nv);
                if (nv === 0) { stopMainBgm(); }
                else if (!mainBgmRef.current && screen !== 'minigame') { resumeMainBgm(); }
                localStorage.setItem('gacha_volumes', JSON.stringify({ main: nv, game: volGame, sfx: volSfxState }));
              }},
              { label: 'ゲーム音', icon: '🎮', val: volGame, set: (v) => {
                const nv = parseFloat(v); setVolGame(nv); volGameBgm = nv;
                if (bgmMaster) bgmMaster.gain.value = nv;
                if (nv === 0) bgm.stop();
                localStorage.setItem('gacha_volumes', JSON.stringify({ main: volMain, game: nv, sfx: volSfxState }));
              }},
              { label: '効果音', icon: '🔔', val: volSfxState, set: (v) => {
                const nv = parseFloat(v); setVolSfxState(nv); volSfx = nv;
                if (sfxMaster) sfxMaster.gain.value = nv;
                localStorage.setItem('gacha_volumes', JSON.stringify({ main: volMain, game: volGame, sfx: nv }));
              }},
            ].map(s => (
              <div key={s.label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{s.icon} {s.label}</span>
                  <span style={{ fontSize: 10, opacity: 0.5 }}>{Math.round(s.val * 100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={s.val}
                  onChange={e => s.set(e.target.value)}
                  style={{ width: '100%', accentColor: '#a78bfa', height: 6 }} />
              </div>
            ))}
            <button onClick={() => {
              setVolMain(0); setVolGame(0); setVolSfxState(0);
              volMainBgm = 0; volGameBgm = 0; volSfx = 0;
              mainBgmControl.setVolume(0); stopMainBgm(); bgm.stop();
              if (bgmMaster) bgmMaster.gain.value = 0;
              if (sfxMaster) sfxMaster.gain.value = 0;
              localStorage.setItem('gacha_volumes', JSON.stringify({ main: 0, game: 0, sfx: 0 }));
            }} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '6px 0', fontSize: 11, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', marginTop: 4 }}>
              🔇 全てOFF
            </button>
          </div>
        </div>
      )}
      {saveMsg && (
        <div className="gbanner">
          {saveMsg}
        </div>
      )}
      {newRecord && (
        <div className="gbanner" style={{ padding: '8px 24px' }}>
          <div className="gb-k">NEW RECORD</div>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, fontWeight: 900, letterSpacing: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {renderCoinIcon(15)}{newRecord.score}
          </div>
        </div>
      )}
      {showLoginBonus && loginBonusInfo && (
        <div className="gbanner" style={{ top: 60, padding: '10px 24px' }}>
          <div className="gb-k">DAILY LOGIN BONUS</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <span>{loginBonusInfo.streak}日連続！ +</span>{renderCoinIcon(14)}<span>{loginBonusInfo.coins.toLocaleString()}</span>
          </div>
          {loginBonusInfo.streak >= 2 && <div className="gb-sub">コイン自動回復 +{loginBonusInfo.streak}%UP</div>}
        </div>
      )}
      <div className="cnt">
        {/* HOME */}
        {screen === "home" && (
          <div>
            {/* Hero section */}
            <div className="hero-bg">

              <div style={{ textAlign: 'center', paddingTop: 140 }}>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 26, fontWeight: 900,
                  background: 'linear-gradient(180deg, #e8d5a3, #c9a84c, #e8d5a3)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  letterSpacing: 4, lineHeight: 1.2,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                  position: 'relative', zIndex: 1 }}>
                  TREASURE<br/>GACHA
                </div>

                {isComplete && (
                  <div style={{ marginTop: 6, position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'inline-block', padding: '3px 16px', borderRadius: 16, position: 'relative',
                      background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(236,72,153,0.15))',
                      boxShadow: '0 0 15px rgba(255,215,0,0.2)' }}>
                      <div style={{ position: 'absolute', inset: -1, borderRadius: 16,
                        background: 'linear-gradient(90deg, #ff6b6b, #ffd93d, #6bff6b, #6bc5ff, #d06bff, #ff6b6b) border-box',
                        backgroundSize: '200% 100%', animation: 'rainbowText 2s linear infinite',
                        WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor', maskComposite: 'exclude', pointerEvents: 'none' }} />
                      <span className="rank-rainbow" style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, fontWeight: 900, letterSpacing: 2 }}>🏆 GAME CLEAR</span>
                    </div>
                  </div>
                )}

                {/* Rank + Title */}
              {(() => {
                const RANKS = [
                  { min: 0, icon: '🌱', name: '拾い屋見習い' },
                  { min: 1000000000, icon: '🪙', name: '古銭集め' },
                  { min: 2000000000, icon: '💰', name: '骨董好き' },
                  { min: 3000000000, icon: '🔍', name: 'トレジャーハンター' },
                  { min: 4000000000, icon: '🗝️', name: '熟練ハンター' },
                  { min: 5000000000, icon: '🏺', name: '遺跡探検家' },
                  { min: 6000000000, icon: '💎', name: '宝石鑑定士' },
                  { min: 7000000000, icon: '🏆', name: '財宝コレクター' },
                  { min: 8000000000, icon: '🎖️', name: '大富豪' },
                  { min: 10000000000, icon: '👑', name: '宝物庫の主' },
                  { min: 20000000000, icon: '🌙', name: '伝説の蒐集家' },
                  { min: 30000000000, icon: '⭐', name: '王室鑑定官' },
                  { min: 40000000000, icon: '🌟', name: '世界の大富豪' },
                  { min: 50000000000, icon: '🔱', name: '財閥の長' },
                  { min: 65000000000, icon: '💫', name: '秘宝の守護者' },
                  { min: 80000000000, icon: '🔮', name: '古代遺産の主' },
                  { min: 100000000000, icon: '🌠', name: '全大陸の富者' },
                  { min: 200000000000, icon: '👁️', name: '超越蒐集家' },
                  { min: 300000000000, icon: '🕊️', name: '万物の所有者' },
                  { min: 500000000000, icon: '⚜️', name: '天界の管理者' },
                  { min: 700000000000, icon: '🐉', name: '龍神の使い' },
                  { min: 900000000000, icon: '🪽', name: '神域の番人' },
                  { min: 1100000000000, icon: '👼', name: '天上の支配者' },
                  { min: 1300000000000, icon: '🌌', name: '宇宙の創造主' },
                  { min: 1500000000000, icon: '☀️', name: '伝説のトレジャーマスター' },
                ];
                let rankIdx = 0;
                for (let i = RANKS.length - 1; i >= 0; i--) {
                  if (totalPower >= RANKS[i].min) { rankIdx = i; break; }
                }
                const r = RANKS[rankIdx];
                const rn = rankIdx + 1;
                const rankStyle = rn >= 25 ? {
                  fontSize: 14, background: 'linear-gradient(90deg, #ff6b6b, #ffd93d, #6bff6b, #6bc5ff, #d06bff, #ff6b6b)',
                  backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  animation: 'rainbowText 2s linear infinite',
                  filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.6))',
                } : rn >= 24 ? {
                  fontSize: 13, background: 'linear-gradient(135deg, #ffd700, #fff, #ffd700)',
                  backgroundSize: '300% 300%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  animation: 'gradShift 2s ease infinite',
                  filter: 'drop-shadow(0 0 4px rgba(255,215,0,0.5))',
                } : rn >= 22 ? {
                  fontSize: 13, color: '#ffd700',
                  textShadow: '0 0 8px rgba(255,215,0,0.4)',
                } : rn >= 20 ? {
                  fontSize: 12, color: '#fbbf24',
                  textShadow: '0 0 6px rgba(251,191,36,0.3)',
                } : rn >= 18 ? {
                  fontSize: 12, background: 'linear-gradient(135deg, #c084fc, #ec4899)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 3px rgba(192,132,252,0.4))',
                } : rn >= 16 ? {
                  fontSize: 12, color: '#c084fc',
                } : {
                  fontSize: 12, color: 'rgba(255,255,255,0.6)',
                };
                return (
                  <div style={{ marginTop: 10, position: 'relative', zIndex: 1 }}>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: 4,
                      color: 'rgba(232,213,163,0.8)', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                      Rank {rn} / 25
                    </div>
                    <div style={{ marginTop: 5, display: 'flex', justifyContent: 'center' }}>
                      <div className="gplate" style={{ padding: '3px 13px 3px 9px', borderRadius: 14 }}>
                        {/* 称号紋章(404時はonErrorで従来の絵文字がそのまま床) */}
                        <span style={{ display: 'inline-block', lineHeight: 0 }}>
                          <img src="assets/ui/hex-open.webp" alt=""
                            style={{ width: 17, height: 17, objectFit: 'contain', display: 'block' }}
                            onError={e => { const n = e.currentTarget.nextSibling; if (n) n.style.display = 'inline'; e.currentTarget.style.display = 'none'; }} />
                          <span style={{ display: 'none', fontSize: 14, lineHeight: 1 }}>{r.icon}</span>
                        </span>
                        <span style={{ fontWeight: 900, fontSize: (rankStyle.fontSize || 12) + 8, ...rankStyle }}>
                          {r.name}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

                {/* Total Assets - with decorative line */}
                <div style={{ marginTop: 14, position: 'relative', zIndex: 1 }}>
                  {/* 飾り罫(divider.webp)。404時は下地の1px金罫がそのまま床 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 6 }}>
                    <div className="scrh-d f" style={{ width: 62, backgroundColor: 'transparent',
                      backgroundImage: 'url(assets/ui/divider.webp), linear-gradient(90deg, rgba(201,168,76,0.45), transparent)',
                      backgroundSize: 'contain, 100% 1px', backgroundRepeat: 'no-repeat, no-repeat',
                      backgroundPosition: 'center, center' }} />
                    <div style={{ fontSize: 10, color: 'rgba(232,213,163,0.72)', letterSpacing: 5, fontWeight: 700,
                      fontFamily: "'Rajdhani',sans-serif", whiteSpace: 'nowrap' }}>TOTAL ASSETS</div>
                    <div className="scrh-d" style={{ width: 62, backgroundColor: 'transparent',
                      backgroundImage: 'url(assets/ui/divider.webp), linear-gradient(90deg, rgba(201,168,76,0.45), transparent)',
                      backgroundSize: 'contain, 100% 1px', backgroundRepeat: 'no-repeat, no-repeat',
                      backgroundPosition: 'center, center' }} />
                  </div>
                  <div style={{ fontFamily: "'Orbitron','Noto Sans JP',sans-serif", fontSize: 20, fontWeight: 900,
                    background: 'linear-gradient(180deg, #e8d5a3, #c9a84c)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }}>
                    {formatYen(totalPower)}
                  </div>
                </div>

                {/* Medal Bars - Weekly (gacha bonus) + All-time */}
                <div style={{ marginTop: 10, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                  {/* All-time */}
                  <div>
                    <div style={{ fontSize: 10, textAlign: 'center', marginBottom: 5, fontFamily: "'Noto Sans JP',sans-serif",
                      fontWeight: 700, letterSpacing: 3, color: 'rgba(232,213,163,0.7)' }}>歴代ランキング</div>
                    <div className="gplate" style={{ display: 'flex', gap: 0, borderRadius: 6, overflow: 'hidden', padding: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 11px', borderRight: '1px solid rgba(201,168,76,0.22)' }}
                        title={crownsAll.goldGames.join(', ')}>
                        {renderMedalIcon(1, '👑')}
                        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Orbitron',sans-serif", color: '#f2e0aa' }}>x{crownsAll.gold}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 11px', borderRight: '1px solid rgba(201,168,76,0.22)' }}
                        title={crownsAll.silverGames.join(', ')}>
                        {renderMedalIcon(2, '🥈')}
                        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Orbitron',sans-serif", color: '#d8e2ee' }}>x{crownsAll.silver}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 11px' }}
                        title={crownsAll.bronzeGames.join(', ')}>
                        {renderMedalIcon(3, '🥉')}
                        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Orbitron',sans-serif", color: '#dda06a' }}>x{crownsAll.bronze}</span>
                      </div>
                    </div>
                  </div>
                  {/* Weekly */}
                  <div>
                    <div style={{ fontSize: 10, textAlign: 'center', marginBottom: 5, fontFamily: "'Noto Sans JP',sans-serif",
                      fontWeight: 700, letterSpacing: 3, color: 'rgba(232,213,163,0.7)' }}>週間ランキング</div>
                    <div className="gplate" style={{ display: 'flex', gap: 0, borderRadius: 6, overflow: 'hidden', padding: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 11px', borderRight: '1px solid rgba(201,168,76,0.22)' }}
                        title={crowns.goldGames.join(', ')}>
                        {renderMedalIcon(1, '👑')}
                        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Orbitron',sans-serif", color: '#f2e0aa' }}>x{crowns.gold}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 11px', borderRight: '1px solid rgba(201,168,76,0.22)' }}
                        title={crowns.silverGames.join(', ')}>
                        {renderMedalIcon(2, '🥈')}
                        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Orbitron',sans-serif", color: '#d8e2ee' }}>x{crowns.silver}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 11px' }}
                        title={crowns.bronzeGames.join(', ')}>
                        {renderMedalIcon(3, '🥉')}
                        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Orbitron',sans-serif", color: '#dda06a' }}>x{crowns.bronze}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rare pull notifications + Congratulations history */}
              {(rareNotifs.length > 0 || congratsHistory.length > 0) && (
                <div style={{ margin: '12px 0', position: 'relative', zIndex: 1 }}>
                  {rareNotifs.slice(0, 6).map((n, i) => {
                    const d = new Date(n.timestamp);
                    const ts = `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
                    return (
                      <div key={'r'+i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
                        fontSize: 10, opacity: 0.85, justifyContent: 'center',
                        borderBottom: i < Math.min(rareNotifs.length, 6) - 1 ? '1px solid rgba(201,168,76,0.10)' : 'none' }}>
                        <span style={{ fontSize: 8, color: 'rgba(232,213,163,0.35)', fontFamily: "'Rajdhani',sans-serif", letterSpacing: 0.5 }}>{ts}</span>
                        <span>{n.icon}</span>
                        <span style={{ color: '#c084fc' }}>{n.name}</span>
                        <span>が</span>
                        <span style={{ fontWeight: 700, color: n.isUra ? '#c0a0ff' : n.isSynth ? '#4ade80' : n.rank >= 10 ? '#ff6b81' : n.rank === 9 ? '#ffd700' : '#c8d6e5' }}>
                          {n.isSynth ? '⚗️' : '★'}{n.rank} {n.item}
                        </span>
                      </div>
                    );
                  })}
                  {congratsHistory.length > 0 && (
                    <div style={{ marginTop: 6, paddingTop: 7, borderTop: '1px solid rgba(201,168,76,0.28)' }}>
                      {congratsHistory.map((c, i) => {
                        const d = new Date(c.timestamp);
                        const ts = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
                        const tierColor = c.tier >= 3 ? '#00ffcc' : c.tier === 2 ? '#ff69b4' : '#ffd700';
                        return (
                          <div key={'c'+i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
                            fontSize: 10, justifyContent: 'center',
                            borderBottom: i < congratsHistory.length - 1 ? '1px solid rgba(201,168,76,0.10)' : 'none' }}>
                            <span style={{ fontSize: 8, color: 'rgba(232,213,163,0.4)', fontFamily: "'Rajdhani',sans-serif", letterSpacing: 0.5 }}>{ts}</span>
                            <span>{c.icon}</span>
                            <span style={{ color: '#c084fc', fontWeight: 700 }}>{c.name}</span>
                            <span>が</span>
                            <span style={{ fontWeight: 900, color: tierColor, letterSpacing: 1 }}>
                              🎊 {c.tierLabel} {c.item}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Odometer */}
              <div className="odo-wrap" style={{ textAlign: 'center' }}>
                <div className="odo-label">TOTAL GACHA</div>
                <div className="odo-digits">
                  {String(Math.min(totalPulls, 99999)).padStart(5, '0').split('').map((d, i) => (
                    <div key={i} className={`odo-d ${totalPulls > 0 && i >= 5 - String(totalPulls).length ? 'lit' : 'dim'}`}>
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pending Gifts Banner */}
            {pendingGifts.length > 0 && (
              <div onClick={receiveGifts} style={{ margin: '12px 0', padding: '12px 16px', borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(74,222,128,0.05))',
                border: '1px solid rgba(74,222,128,0.3)', cursor: 'pointer', textAlign: 'center',
                position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#4ade80' }}>
                  🎁 {pendingGifts.length}件のギフトが届いています！
                </div>
                <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>タップして受け取る</div>
              </div>
            )}

            {/* Daily Missions - compact */}
            {dailyMissions.length > 0 && (
              <div style={{ margin: '10px 0', position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 9, textAlign: 'center', opacity: 0.4, marginBottom: 2,
                  fontFamily: "'Rajdhani',sans-serif", letterSpacing: 3 }}>DAILY MISSION</div>
                <div style={{ fontSize: 8, textAlign: 'center', opacity: 0.3, marginBottom: 5 }}>全達成で 🪙2,000 ／ みんなの合計で達成</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {dailyMissions.map(m => {
                    const prog = dailyProgress[m.id] || { total: 0, contributions: {}, target: m.target };
                    const done = dailyCompleted[m.id];
                    const pct = Math.min(100, (prog.total / m.target) * 100);
                    // 未達成の行はゴッドアナザー計器盤と同じ9スライス枠(panel.webp)で装飾。達成済みは緑の差別化を優先して現行のまま
                    return (
                      <div key={m.id} style={{ padding: '5px 10px', borderRadius: 8,
                        background: done ? 'rgba(74,222,128,0.06)' : 'rgba(50,40,70,0.4)',
                        border: `1px solid ${done ? 'rgba(74,222,128,0.2)' : 'rgba(139,92,246,0.1)'}`,
                        ...(done ? {} : { borderImage: 'url(assets/god-another/panel.webp) 60 fill / 7px stretch', borderWidth: 7, borderStyle: 'solid' }) }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: done ? '#4ade80' : 'rgba(255,255,255,0.7)', flex: 1 }}>
                            {done ? '✅' : '◻️'} {m.text}
                          </div>
                          <div style={{ fontSize: 9, fontWeight: 900, fontFamily: "'Orbitron',sans-serif",
                            color: done ? '#4ade80' : '#c084fc', marginLeft: 6, whiteSpace: 'nowrap' }}>
                            {m.type === 'gift' ? formatYen(prog.total) : prog.total.toLocaleString()}/{m.type === 'gift' ? formatYen(m.target) : m.target.toLocaleString()}
                          </div>
                        </div>
                        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginTop: 3 }}>
                          <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`,
                            background: done ? '#4ade80' : 'linear-gradient(90deg, #a78bfa, #c084fc)',
                            transition: 'width 0.3s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Compact stats row */}
            <div style={{ display: 'flex', gap: 6, position: 'relative', zIndex: 1, margin: '12px 0' }}>
              <div style={{ flex: 1, padding: '6px 8px', borderRadius: 8,
                background: 'linear-gradient(180deg, rgba(50,40,70,0.5), rgba(30,22,45,0.6))',
                border: '1px solid rgba(139,92,246,0.12)', textAlign: 'center' }}>
                <div style={{ fontSize: 8, opacity: 0.4 }}>🏛️ 展示室</div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 900, color: '#c084fc' }}>
                  {colCount}<span style={{ fontSize: 8, opacity: 0.4 }}>/69</span>
                </div>
              </div>
              <div style={{ flex: 1, padding: '6px 8px', borderRadius: 8,
                background: 'linear-gradient(180deg, rgba(50,40,70,0.5), rgba(30,22,45,0.6))',
                border: '1px solid rgba(139,92,246,0.12)', textAlign: 'center' }}>
                <div style={{ fontSize: 8, opacity: 0.4 }}>🪙 コイン</div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 900, color: '#fbbf24' }}>
                  {coins.toLocaleString()}
                </div>
              </div>
              <div style={{ flex: 1, padding: '6px 8px', borderRadius: 8,
                background: 'linear-gradient(180deg, rgba(50,40,70,0.5), rgba(30,22,45,0.6))',
                border: '1px solid rgba(139,92,246,0.12)', textAlign: 'center' }}>
                <div style={{ fontSize: 8, opacity: 0.4 }}>📅 連続</div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 900, color: '#4ade80' }}>
                  {loginStreak}<span style={{ fontSize: 8, opacity: 0.4 }}>日</span>
                </div>
              </div>
            </div>

            {/* ★MAX TREASURE - Crystal showcase with ornate header */}
            <div style={{ margin: '16px 0', position: 'relative', zIndex: 1 }}>
              {/* Ornate header bar */}
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ display: 'inline-block', padding: '5px 28px', position: 'relative',
                  background: 'linear-gradient(180deg, rgba(60,45,80,0.8), rgba(35,25,55,0.9))',
                  border: '1px solid rgba(167,139,250,0.35)', borderRadius: 6,
                  boxShadow: '0 3px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
                  <span style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', fontSize: 6, color: 'rgba(167,139,250,0.5)' }}>◆</span>
                  <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 4,
                    color: 'rgba(200,180,240,0.8)', textShadow: '0 0 8px rgba(139,92,246,0.3)' }}>MAX TREASURE</span>
                </div>
              </div>
              {/* Crystal slots on floating platforms */}
              {/* 神域解放後は7個になるため折返し許可(44px×7+gapは狭い端末で溢れる) */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                {typesFor(collection).map((type, i) => {
                  const owned = maxCounts[i] > 0;
                  const monster = MONSTERS[type.id][10];
                  return (
                    <div key={type.id} style={{ textAlign: 'center', position: 'relative' }}>
                      {/* Crystal */}
                      <div style={{
                        width: 44, height: 52,
                        clipPath: 'polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)',
                        background: owned
                          ? `url(assets/ui/hex-open.webp) center/cover no-repeat, linear-gradient(160deg, ${type.color}dd, ${type.color}66, ${type.color}bb)`
                          : 'url(assets/ui/hex-locked.webp) center/cover no-repeat, linear-gradient(160deg, rgba(80,70,100,0.4), rgba(50,40,70,0.3), rgba(80,70,100,0.4))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.3s', position: 'relative',
                        filter: owned ? `drop-shadow(0 0 8px ${type.color}60)` : 'none',
                      }}>
                        {owned && <div style={{ position: 'absolute', inset: 0,
                          background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.3), transparent 60%)`,
                          clipPath: 'polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)' }} />}
                        {owned ? (
                          <span style={{ position: 'relative', zIndex: 1, filter: `drop-shadow(0 0 4px ${type.color})` }}>
                            {renderItemIcon({ ...monster, rank: 11 }, 28, { borderRadius: 6, filter: 'brightness(1.1)' })}
                          </span>
                        ) : (
                          <span style={{ fontSize: 14, opacity: 0.15, position: 'relative', zIndex: 1 }}>?</span>
                        )}
                      </div>
                      {/* Floating platform */}
                      <div style={{ width: 36, height: 8, margin: '2px auto 0', borderRadius: '50%',
                        background: owned
                          ? `radial-gradient(ellipse, ${type.color}30, transparent 70%)`
                          : 'radial-gradient(ellipse, rgba(100,80,140,0.2), transparent 70%)' }} />
                      <div style={{ fontSize: 6, fontWeight: 700, marginTop: 1,
                        color: owned ? type.color : 'rgba(255,255,255,0.12)',
                        textShadow: owned ? `0 0 4px ${type.color}` : 'none' }}>
                        {type.name}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Count */}
              <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, fontWeight: 900 }}>
                {congratsTier >= 3 ? (
                  <span className="rank-ultimate" style={{ fontSize: 12 }}>✨ ULTIMATE ✨</span>
                ) : congratsTier === 2 ? (
                  <span className="rank-congrats" style={{ fontSize: 12 }}>🌈 RAINBOW 🌈</span>
                ) : congratsTier === 1 ? (
                  <span className="rank-diamond" style={{ fontSize: 12 }}>👑 COMPLETE 👑</span>
                ) : (
                  <span style={{ color: 'rgba(167,139,250,0.4)' }}>{maxCounts.filter(c => c > 0).length} / {maxCounts.length}</span>
                )}
              </div>
            </div>

            {/* Gacha button - image banner */}
            <div onClick={() => nav("gacha")} style={{
              margin: '16px auto 0', maxWidth: 340, cursor: 'pointer',
              borderRadius: 12, overflow: 'hidden', position: 'relative', zIndex: 1,
              boxShadow: '0 6px 24px rgba(0,0,0,0.5), 0 0 20px rgba(200,180,140,0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5), 0 0 30px rgba(200,180,140,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.5), 0 0 20px rgba(200,180,140,0.1)'; }}
            >
              <img src="btn-gacha.webp" alt="ガチャを引く" style={{ width: '100%', display: 'block', filter: 'brightness(1.05)' }} />
              {/* Shimmer overlay */}
              <div style={{ position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.12) 45%, rgba(255,215,0,0.08) 50%, rgba(255,255,255,0.12) 55%, transparent 70%)',
                backgroundSize: '250% 250%', animation: 'gradShift 4s ease infinite', pointerEvents: 'none' }} />
            </div>

            {/* Menu grid - floating island style 3x2 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 340,
              margin: '20px auto 0', position: 'relative', zIndex: 1 }}>
              {[
                { screen: 'minigame', icon: '🎮', img: 'assets/ui/ico-minigame.webp', label: 'コイン稼ぎ', glow: 'rgba(245,158,11,0.2)' },
                { screen: 'synth', icon: '⚗️', img: 'assets/ui/ico-synth.webp', label: '合成', glow: 'rgba(74,222,128,0.2)' },
                { screen: 'collection', icon: '🏛️', img: 'assets/ui/ico-collection.webp', label: '展示室', glow: 'rgba(96,165,250,0.2)' },
                { screen: 'spend', icon: '🍽️', img: 'assets/ui/ico-spend.webp', label: '資産を使う', glow: 'rgba(192,132,252,0.2)' },
                { screen: 'ranking', icon: '🏆', img: 'assets/ui/ico-ranking.webp', label: 'ランキング', glow: 'rgba(251,191,36,0.25)' },
                { screen: 'history', icon: '📋', img: 'assets/ui/ico-history.webp', label: 'ゲーム履歴', glow: 'rgba(148,163,184,0.15)' },
              ].map(m => (
                <div key={m.screen} onClick={() => nav(m.screen)} style={{
                  textAlign: 'center', cursor: 'pointer', transition: 'all 0.25s', position: 'relative',
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  {m.img ? (
                    <>
                      <img src={m.img} alt={m.label} style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 12,
                        filter: `drop-shadow(0 4px 8px rgba(0,0,0,0.5)) drop-shadow(0 0 6px ${m.glow})` }}
                        onError={e => { e.currentTarget.style.display = 'none';
                          const fb = e.currentTarget.nextElementSibling; if (fb) fb.style.display = 'block'; }} />
                      {/* 画像が読めない環境では従来の絵文字にフォールバック */}
                      <div style={{ display: 'none', fontSize: 34, marginBottom: 2,
                        filter: `drop-shadow(0 4px 8px rgba(0,0,0,0.5)) drop-shadow(0 0 8px ${m.glow})` }}>{m.icon}</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 34, marginBottom: 2,
                      filter: `drop-shadow(0 4px 8px rgba(0,0,0,0.5)) drop-shadow(0 0 8px ${m.glow})` }}>{m.icon}</div>
                  )}
                  {/* Floating platform glow */}
                  <div style={{ width: 50, height: 10, margin: '0 auto', borderRadius: '50%',
                    background: `radial-gradient(ellipse, ${m.glow}, transparent 70%)` }} />
                  {/* Label */}
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginTop: 2,
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{m.label}</div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', fontSize: 10, opacity: 0.2, marginTop: 20 }}>
              🪙 2秒ごとに1コイン自動回復 ／ 離脱時最大5,000コイン
            </div>

            {/* Item Request Section */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#f472b6', marginBottom: 8, textAlign: 'center' }}>💌 アイテムリクエスト</div>
              {itemRequests.length > 0 ? (
                <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '6px 10px', border: '1px solid rgba(244,114,182,0.15)', marginBottom: 8 }}>
                  {itemRequests.map((req, i) => {
                    const myItem = collection[`${req.typeId}_${req.rank}`];
                    const canSend = myItem && myItem.count > 1 && req.name !== nickname && req.rank < 11;
                    const isMyRequest = req.name === nickname;
                    return (
                      <div key={req.fbKey} onClick={() => canSend && setShowRequestConfirm(req)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0',
                          borderBottom: i < itemRequests.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          fontSize: 10, cursor: canSend ? 'pointer' : 'default',
                          opacity: canSend ? 1 : isMyRequest ? 0.8 : 0.5 }}>
                        <span style={{ fontSize: 16 }}>{req.icon}</span>
                        <span style={{ color: '#f472b6', fontWeight: 700 }}>{req.name}</span>
                        <span style={{ opacity: 0.5 }}>が</span>
                        <span style={{ fontWeight: 700, color: req.rank >= 10 ? '#ff6b81' : req.rank >= 8 ? '#ffd700' : req.rarity?.color || '#fff' }}>
                          ★{req.rank} {req.itemName}
                        </span>
                        {!isMyRequest && <span style={{ opacity: 0.4 }}>を求めています</span>}
                        {canSend && <span style={{ marginLeft: 'auto', fontSize: 12 }}>🎁</span>}
                        {isMyRequest && <span onClick={e => { e.stopPropagation();
                          if (window.fbDb) window.fbDb.ref('notifications/itemRequests/' + req.fbKey).remove().catch(() => {});
                          setSaveMsg('リクエストをキャンセルしました'); setTimeout(() => setSaveMsg(''), 2000);
                        }} style={{ marginLeft: 'auto', fontSize: 9, padding: '2px 8px', borderRadius: 6,
                          background: 'rgba(255,100,100,0.15)', border: '1px solid rgba(255,100,100,0.3)',
                          color: '#ff6b6b', cursor: 'pointer', fontWeight: 700 }}>✕ 取消</span>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 9, opacity: 0.2, textAlign: 'center', marginBottom: 8 }}>リクエストはありません</div>
              )}
              {nickname && nickname.trim() && (
                <button onClick={() => {
                  setRequestMode(true);
                  nav('collection');
                }} style={{ width: '100%', padding: '8px 0', borderRadius: 10, fontSize: 11, fontWeight: 700,
                  background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.25)',
                  color: '#f472b6', cursor: 'pointer' }}>
                  💌 アイテムをリクエストする
                </button>
              )}
              {/* Gift History toggle */}
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <span onClick={() => setShowGiftHistory(v => !v)}
                  style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', cursor: 'pointer' }}>
                  {showGiftHistory ? '▼' : '▶'} プレゼント履歴
                </span>
              </div>
              {showGiftHistory && (
                <div style={{ marginTop: 6, background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '6px 8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  {giftHistory.length > 0 ? giftHistory.map((h, i) => {
                    const d = new Date(h.timestamp);
                    const ts = `${d.getMonth()+1}/${d.getDate()}`;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0',
                        borderBottom: i < giftHistory.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                        fontSize: 9, opacity: 0.5 }}>
                        <span style={{ opacity: 0.5, minWidth: 28 }}>{ts}</span>
                        <span>{h.icon}</span>
                        <span style={{ color: '#c084fc' }}>{h.receiver}</span>
                        <span style={{ opacity: 0.4 }}>←</span>
                        <span style={{ color: '#4ade80' }}>{h.sender}</span>
                        <span style={{ opacity: 0.3, marginLeft: 'auto', whiteSpace: 'nowrap' }}>★{h.rank} {h.item}</span>
                      </div>
                    );
                  }) : (
                    <div style={{ fontSize: 8, opacity: 0.2, textAlign: 'center', padding: 6 }}>履歴はありません</div>
                  )}
                </div>
              )}
            </div>

            {/* Request confirm modal */}
            {showRequestConfirm && (
              <div className="mo" onClick={() => setShowRequestConfirm(null)}>
                <div className="mc" onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>{showRequestConfirm.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>
                    ★{showRequestConfirm.rank} {showRequestConfirm.itemName}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>
                    {showRequestConfirm.name} にプレゼントしますか？
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button className="btn bp" style={{ fontSize: 13, padding: '10px 20px' }}
                      onClick={() => {
                        const req = showRequestConfirm;
                        const itemKey = `${req.typeId}_${req.rank}`;
                        // Re-check item availability before sending
                        const currentItem = collection[itemKey];
                        if (!currentItem || currentItem.count <= 1) {
                          setSaveMsg('⚠️ アイテムが不足しています');
                          setTimeout(() => setSaveMsg(''), 2000);
                          setShowRequestConfirm(null);
                          return;
                        }
                        // First remove request, then send gift (gift history is recorded in sendGift for ★7+)
                        if (window.fbDb) {
                          window.fbDb.ref('notifications/itemRequests/' + req.fbKey).remove().then(() => {
                            sendGift(itemKey, req.name);
                          }).catch(() => {
                            sendGift(itemKey, req.name);
                          });
                        } else {
                          sendGift(itemKey, req.name);
                        }
                        setShowRequestConfirm(null);
                      }}>
                      🎁 送る
                    </button>
                    <button className="btn bs" style={{ fontSize: 13, padding: '10px 20px' }}
                      onClick={() => setShowRequestConfirm(null)}>
                      キャンセル
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* GACHA */}
        {screen === "gacha" && (
          <div>
            {gachaPhase === "idle" && (
              <div style={{ textAlign: 'center' }}>
                {/* Hero chest display */}
                <div style={{ position: 'relative', margin: '0 -16px', padding: '28px 16px 24px',
                  background: 'linear-gradient(160deg, rgba(139,92,246,0.12) 0%, rgba(236,72,153,0.08) 50%, rgba(245,158,11,0.06) 100%)',
                  backgroundImage: "url(assets/ui/gacha-bg.webp), linear-gradient(160deg, rgba(139,92,246,0.12) 0%, rgba(236,72,153,0.08) 50%, rgba(245,158,11,0.06) 100%)",
                  backgroundSize: 'cover', backgroundPosition: 'center 30%',
                  borderBottom: '1px solid rgba(139,92,246,0.1)', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,6,20,0.35)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', width: 100, height: 100, background: 'rgba(255,215,0,0.15)', borderRadius: '50%', filter: 'blur(40px)', top: -20, right: 20 }} />
                  <div style={{ position: 'absolute', width: 70, height: 70, background: 'rgba(139,92,246,0.2)', borderRadius: '50%', filter: 'blur(30px)', bottom: 0, left: 30 }} />

                  {/* 4 chest showcase - image based */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16, position: 'relative', zIndex: 1 }}>
                    {[
                      { img: 'chest-wood.webp', label: '★1-2', border: '#C4A54D', labelColor: 'rgba(255,255,255,0.4)' },
                      { img: 'chest-silver.webp', label: '★3-4', border: '#E8EDF3', labelColor: '#c8d6e5', glow: '0 0 8px rgba(200,214,229,0.3)' },
                      { img: 'chest-gold.webp', label: '★5-7', border: '#FFE44D', labelColor: '#ffd700', glow: '0 0 12px rgba(255,215,0,0.4)', shimmer: true },
                      { img: 'chest-rainbow.webp', label: '★8+', border: 'rgba(255,255,255,0.6)', labelColor: '#ff6b81', glow: '0 0 15px rgba(200,100,255,0.4), 0 0 30px rgba(100,200,255,0.2)', rainbow: true },
                    ].map((c, i) => (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ width: 62, height: 62, borderRadius: 14, position: 'relative', overflow: 'hidden',
                          border: `2px solid ${c.border}`,
                          boxShadow: `${c.glow || 'none'}, 0 4px 12px rgba(0,0,0,0.4)`,
                        }}>
                          <img src={c.img} alt={c.label} style={{ width: '100%', height: '100%', objectFit: 'cover',
                            filter: c.shimmer ? 'brightness(1.1)' : c.rainbow ? 'brightness(1.15)' : 'none' }} />
                          {c.shimmer && <div style={{ position: 'absolute', inset: 0,
                            background: 'linear-gradient(135deg, transparent 30%, rgba(255,215,0,0.2) 45%, rgba(255,255,255,0.25) 50%, rgba(255,215,0,0.2) 55%, transparent 70%)',
                            backgroundSize: '250% 250%', animation: 'gradShift 3s ease infinite', pointerEvents: 'none' }} />}
                          {c.rainbow && <>
                            <div style={{ position: 'absolute', inset: 0,
                              background: 'linear-gradient(135deg, transparent 20%, rgba(255,255,255,0.2) 40%, rgba(200,100,255,0.15) 50%, rgba(100,200,255,0.15) 60%, transparent 80%)',
                              backgroundSize: '300% 300%', animation: 'gradShift 2s ease infinite', pointerEvents: 'none' }} />
                          </>}
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: c.labelColor, marginTop: 4,
                          textShadow: i >= 2 ? `0 0 6px ${c.labelColor}` : 'none' }}>{c.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ position: 'relative', zIndex: 1, mixBlendMode: 'screen' }}>
                    <img src="assets/ui/gacha-logo.webp" alt="GACHA"
                      style={{ maxWidth: 'min(76%, 300px)', display: 'block', margin: '0 auto', filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.6))' }}
                      onError={e => { e.currentTarget.style.display = 'none'; const f = e.currentTarget.nextSibling; if (f) f.style.display = 'block'; }} />
                    <div style={{ display: 'none', fontFamily: "'Orbitron',sans-serif", fontSize: 30, fontWeight: 900, letterSpacing: 8,
                      background: 'linear-gradient(135deg, #c084fc, #f472b6, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      GACHA
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(180,160,220,0.7)', marginTop: 6, position: 'relative', zIndex: 1 }}>
                    宝箱を開けてトレジャーを手に入れよう！
                  </div>
                </div>

                {/* Crown Bonus indicator */}
                {getCrownLevel(crownBonus) && (
                  <div style={{ marginBottom: 12, padding: '10px 18px', borderRadius: 12, textAlign: 'center', maxWidth: 300, margin: '12px auto 0',
                    backdropFilter: 'blur(8px)',
                    ...(getCrownLevel(crownBonus) === 'super' ? {
                      background: 'linear-gradient(135deg, rgba(80,40,120,0.5), rgba(60,30,100,0.6))',
                      border: '1px solid rgba(167,139,250,0.5)',
                      boxShadow: '0 4px 16px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
                      animation: 'crownPulse 2s ease-in-out infinite',
                    } : getCrownLevel(crownBonus) === 'major' ? {
                      background: 'linear-gradient(135deg, rgba(70,35,110,0.5), rgba(50,25,85,0.6))',
                      border: '1px solid rgba(167,139,250,0.35)',
                      boxShadow: '0 4px 16px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
                    } : {
                      background: 'rgba(60,30,100,0.4)',
                      border: '1px solid rgba(139,92,246,0.25)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                    }),
                  }}>
                    <div style={{ fontSize: 10, opacity: 0.5, fontFamily: "'Rajdhani',sans-serif", letterSpacing: 2, marginBottom: 3 }}>
                      GAME RANKING BONUS
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#fbbf24' }}>
                      {getCrownLevel(crownBonus) === 'super' ? (
                        <span className="rank-rainbow">🔥 レア確率 超UP！！ 🔥</span>
                      ) : getCrownLevel(crownBonus) === 'major' ? (
                        <span>✨ レア確率 大幅UP！ ✨</span>
                      ) : (
                        <span>レア確率UP！</span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.5, marginTop: 3 }}>
                      👑×{crowns.gold} 🥈×{crowns.silver} 🥉×{crowns.bronze} → ★7以上優遇
                    </div>
                  </div>
                )}

                {/* Pull buttons */}
                <div style={{ display: 'flex', gap: 10, maxWidth: 320, margin: '16px auto', padding: '0 8px' }}>
                  <button className="btn gpb gpb10 gpb-lg" disabled={coins < gachaCost10} onClick={() => pull(10)}
                    style={{ flex: 1 }}>
                    <span className="gpb-bg" />
                    <img src="assets/ui/btn-p10.webp" alt="" className="gpb-img"
                      onError={e => { e.currentTarget.style.display = 'none'; }} />
                    <span className="gpb-shine" />
                    <span className="gpb-label">10連</span>
                    <span className="gpb-cost">🪙 {gachaCost10}</span>
                  </button>
                  <button className="btn gpb gpb40 gpb-lg" disabled={coins < gachaCost40} onClick={() => pull(40)}
                    style={{ flex: 1 }}>
                    <span className="gpb-bg" />
                    <img src="assets/ui/btn-p40.webp" alt="" className="gpb-img"
                      onError={e => { e.currentTarget.style.display = 'none'; }} />
                    <span className="gpb-shine" />
                    <span className="gpb-label">40連</span>
                    <span className="gpb-cost">🪙 {gachaCost40}</span>
                  </button>
                </div>

                {/* Probability table */}
                <div style={{ maxWidth: 320, margin: '0 auto' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', marginBottom: 8, opacity: 0.5 }}>出現確率</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {[
                      { label: "★10 ゴッド", rate: "1/8192", color: "#ff6b81", bg: "rgba(255,107,129,0.08)", icon: "💎", cls: "rank-rainbow" },
                      { label: "★9 ミシカル", rate: "2/8192", color: "#ffd700", bg: "rgba(255,215,0,0.08)", icon: "💎", cls: "rank-gold" },
                      { label: "★8 レジェンド", rate: "0.11%", color: "#c8d6e5", bg: "rgba(200,214,229,0.08)", icon: "💎", cls: "rank-silver" },
                      { label: "★7 エピック", rate: "0.4%", color: "#ff4757", bg: "rgba(255,71,87,0.06)", icon: "👑", cls: "" },
                      { label: "★6 ウルトラ", rate: "0.8%", color: "#e67e22", bg: "rgba(230,126,34,0.06)", icon: "👑", cls: "" },
                      { label: "★5 SSレア", rate: "3%", color: "#9b59b6", bg: "rgba(155,89,182,0.06)", icon: "👑", cls: "" },
                      { label: "★4 Sレア", rate: "8%", color: "#3498db", bg: "rgba(52,152,219,0.05)", icon: "🪙", cls: "" },
                      { label: "★3 レア", rate: "21%", color: "#2ecc71", bg: "rgba(46,204,113,0.04)", icon: "🪙", cls: "" },
                      { label: "★1〜2", rate: "66%", color: "rgba(255,255,255,0.35)", bg: "rgba(255,255,255,0.02)", icon: "📦", cls: "" },
                    ].map((r, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', padding: '5px 10px',
                        background: r.bg, borderRadius: 8,
                        borderLeft: `3px solid ${r.color}`,
                      }}>
                        <span style={{ fontSize: 10, marginRight: 6 }}>{r.icon}</span>
                        <span className={r.cls} style={{ fontSize: 11, fontWeight: 700, color: r.cls ? undefined : r.color, flex: 1 }}>{r.label}</span>
                        <span className={r.cls} style={{ fontSize: 11, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, color: r.cls ? undefined : r.color }}>{r.rate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {gachaPhase === "chests" && (
              <div className="gs">
                {/* Pull buttons pinned ABOVE the chests/results so their screen position never shifts between consecutive pulls */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button className="btn gpb gpb10 gpb-sm" disabled={!allOpened || coins < gachaCost10} onClick={() => pull(10)}>
                    <span className="gpb-bg" />
                    <img src="assets/ui/btn-p10.webp" alt="" className="gpb-img"
                      onError={e => { e.currentTarget.style.display = 'none'; }} />
                    <span className="gpb-shine" />
                    <span className="gpb-label">10連</span>
                    <span className="gpb-cost">🪙{gachaCost10}</span>
                  </button>
                  <button className="btn gpb gpb40 gpb-sm" disabled={!allOpened || coins < gachaCost40} onClick={() => pull(40)}>
                    <span className="gpb-bg" />
                    <img src="assets/ui/btn-p40.webp" alt="" className="gpb-img"
                      onError={e => { e.currentTarget.style.display = 'none'; }} />
                    <span className="gpb-shine" />
                    <span className="gpb-label">40連</span>
                    <span className="gpb-cost">🪙{gachaCost40}</span>
                  </button>
                </div>
                {!allOpened && <p style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>開封中...</p>}
                {allOpened && <p style={{ fontSize: 16, fontWeight: 900 }}>🎉 結果</p>}
                <div className={gachaChests.length >= 40 ? 'cr cr-40' : 'cr'} style={{ gridTemplateColumns: gachaChests.length >= 40 ? 'repeat(8, 1fr)' : 'repeat(5, 1fr)' }}>
                  {gachaChests.map((ct, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {!opened.has(i) ? (
                        <div className="chest" style={{ margin: '0 auto', position: 'relative' }}>
                          <img src={ct === 'rainbow' ? 'chest-rainbow.png' : ct === 'gold' ? 'chest-gold.png' : ct === 'silver' ? 'chest-silver.png' : 'chest-wood.png'}
                            alt="chest" className="chest-img" style={{ borderRadius: 10, objectFit: 'cover',
                              filter: ct === 'rainbow'
                                ? 'drop-shadow(0 0 8px rgba(200,100,255,0.6)) drop-shadow(0 0 16px rgba(100,200,255,0.4)) brightness(1.15)'
                                : ct === 'gold'
                                  ? 'drop-shadow(0 0 6px rgba(255,215,0,0.6)) drop-shadow(0 0 12px rgba(255,215,0,0.3)) brightness(1.1)'
                                  : 'none' }} />
                          {/* Gold shimmer overlay */}
                          {ct === 'gold' && <div style={{ position: 'absolute', inset: 0, borderRadius: 10,
                            background: 'linear-gradient(135deg, transparent 30%, rgba(255,215,0,0.15) 45%, rgba(255,255,255,0.2) 50%, rgba(255,215,0,0.15) 55%, transparent 70%)',
                            backgroundSize: '250% 250%', animation: 'gradShift 3s ease infinite', pointerEvents: 'none' }} />}
                          {/* Rainbow glow overlay */}
                          {ct === 'rainbow' && <>
                            <div style={{ position: 'absolute', inset: -2, borderRadius: 12,
                              background: 'conic-gradient(from 0deg, rgba(255,107,107,0.3), rgba(255,217,61,0.3), rgba(107,255,107,0.3), rgba(107,197,255,0.3), rgba(208,107,255,0.3), rgba(255,107,107,0.3))',
                              animation: 'synthMaxRotate 3s linear infinite', pointerEvents: 'none',
                              WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                              WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
                            <div style={{ position: 'absolute', inset: 0, borderRadius: 10,
                              background: 'linear-gradient(135deg, transparent 20%, rgba(255,255,255,0.2) 40%, rgba(200,100,255,0.15) 50%, rgba(100,200,255,0.15) 60%, transparent 80%)',
                              backgroundSize: '300% 300%', animation: 'gradShift 2s ease infinite', pointerEvents: 'none' }} />
                          </>}
                        </div>
                      ) : (
                        <div className={`rc ${gachaResults[i].rank >= 10 ? 'rank10-card' : gachaResults[i].rank === 9 ? 'rank9-card' : gachaResults[i].rank === 8 ? 'rank8-card' : gachaResults[i].rank === 7 ? 'rank7-card' : gachaResults[i].rank === 6 ? 'rank6-card' : ''}`}
                          style={{ borderColor: gachaResults[i].rarity.color, cursor: 'pointer', position: 'relative' }}
                          onClick={() => setModal(gachaResults[i])}>
                          <div>{gachaResults[i].img ? renderItemIcon(gachaResults[i], gachaChests.length >= 40 ? 18 : 30) : <span style={{ fontSize: gachaChests.length >= 40 ? 16 : 26 }}>{gachaResults[i].icon}</span>}</div>
                          {gachaChests.length < 40 && <div className={gachaResults[i].rank >= 10 ? 'rank-rainbow' : gachaResults[i].rank === 9 ? 'rank-gold' : gachaResults[i].rank === 8 ? 'rank-silver' : gachaResults[i].rank === 7 ? 'rank-epic' : gachaResults[i].rank === 6 ? 'rank-ultra' : ''}
                            style={{ fontSize: 8, fontWeight: 900, color: gachaResults[i].rarity.color, marginTop: 2, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', padding: '0 1px' }}>{gachaResults[i].name}</div>}
                          <div className={gachaResults[i].rank >= 10 ? 'rank-rainbow' : gachaResults[i].rank === 9 ? 'rank-gold' : gachaResults[i].rank === 8 ? 'rank-silver' : gachaResults[i].rank === 7 ? 'rank-epic' : gachaResults[i].rank === 6 ? 'rank-ultra' : ''}
                            style={{ fontSize: 8, color: gachaResults[i].rarity.color }}>{renderStars(gachaResults[i].rank)}</div>
                          {/* 宝箱開封4コマ(A7 2026-08-25): カードの上に120ms間隔で4コマ重ねて開封感を出す。404はonErrorで個別に消え、下のカードがそのまま床(現行動作) */}
                          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                            {[1, 2, 3, 4].map(f => (
                              <img key={f} src={`assets/gacha/chest-${ct}-f${f}.webp`} alt=""
                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8,
                                  opacity: 0, animation: 'chestFrame4 480ms linear forwards', animationDelay: `${(f - 1) * 120}ms` }}
                                onError={e => { e.currentTarget.style.display = 'none'; }} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {/* Best pull highlight */}
                {allOpened && (() => {
                  const rares = gachaResults.filter(r => r.rank >= 6).sort((a, b) => b.rank - a.rank);
                  if (rares.length === 0) return null;
                  return (
                    <div style={{ margin: '10px auto', maxWidth: 320, padding: '10px 12px', borderRadius: 14,
                      background: 'linear-gradient(160deg, rgba(50,40,70,0.9), rgba(30,22,45,0.95))',
                      border: '1px solid rgba(139,92,246,0.3)',
                      boxShadow: '0 0 16px rgba(139,92,246,0.15)' }}>
                      <div style={{ fontSize: 9, opacity: 0.5, letterSpacing: 3, fontFamily: "'Rajdhani',sans-serif", marginBottom: 8, textAlign: 'center' }}>
                        RARE ITEMS
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                        {rares.map((item, idx) => {
                          const rkCls = item.rank >= 10 ? 'rank-rainbow' : item.rank === 9 ? 'rank-gold' : item.rank === 8 ? 'rank-silver' : item.rank === 7 ? 'rank-epic' : 'rank-ultra';
                          return (
                            <div key={idx} onClick={() => setModal(item)} style={{ textAlign: 'center', cursor: 'pointer',
                              padding: '6px 8px', borderRadius: 10,
                              background: `${item.rarity.color}10`, border: `1px solid ${item.rarity.color}30`,
                              boxShadow: `0 0 8px ${item.rarity.color}15`, minWidth: 60 }}>
                              <div style={{ fontSize: 32, filter: `drop-shadow(0 0 6px ${item.rarity.color})` }}>{renderItemIcon(item, 32)}</div>
                              <div className={rkCls} style={{ fontSize: 9, fontWeight: 900 }}>{item.name}</div>
                              <div style={{ fontSize: 8, color: item.rarity.color }}>{renderStars(item.rank)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* MINIGAME SELECT */}
        {screen === "minigame" && !miniGame && (
          <div>
            {/* ヘッダー: 宝物庫アーチのヒーロー帯(画像404時は従来の帯なし表示が床) */}
            <div style={{ position: 'relative', margin: '0 -16px 16px', padding: '18px 16px 14px', overflow: 'hidden',
              backgroundImage: 'linear-gradient(180deg, rgba(10,6,20,0.25), rgba(10,6,20,0.55)), url(assets/ui/minigame-hero.webp)',
              backgroundSize: 'cover', backgroundPosition: 'center 35%',
              borderBottom: '1px solid rgba(201,162,39,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative' }}>
                <span style={{ fontSize: 10, color: 'rgba(255,216,110,0.55)' }}>✦</span>
                <span style={{ fontSize: 18, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 6, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                  <img src="nav-game.png" alt="ゲーム" style={{ width: 24, height: 24, objectFit: 'contain' }} /> ミニゲーム
                </span>
                <span style={{ fontSize: 10, color: 'rgba(255,216,110,0.55)' }}>✦</span>
              </div>
            </div>
            {/* Game Categories */}
            <div>
            {[
              { label: '⚡ アクション', color: 'rgba(139,92,246,0.2)', bg: 'linear-gradient(180deg, rgba(75,70,90,0.85), rgba(45,40,58,0.95))', border: 'rgba(139,92,246,0.2)',
                games: [
                  { id: "tap", icon: "👊", img: "assets/ui/gi-tap.webp", name: "連打バトル" },
                  { id: "shooting", icon: "🎯", img: "assets/ui/gi-shooting.webp", name: "シューティング" },
                  { id: "gem", icon: "💎", img: "assets/ui/gi-gem.webp", name: "ジュエルキャッチ" },
                  { id: "timing", icon: "⏱️", img: "assets/ui/gi-timing.webp", name: "ルパンタイマー" },
                  { id: "tower", icon: "🪙", img: "assets/ui/gi-tower.webp", name: "コインタワー" },
                  { id: "memory", icon: "🃏", img: "assets/ui/gi-memory.webp", name: "神経衰弱" },
                  { id: "quickdraw", icon: "🔫", img: "assets/ui/gi-quickdraw.webp", name: "早撃ちガンマン" },
                ]},
              { label: '🏃 アドベンチャー', color: 'rgba(74,222,128,0.2)', bg: 'linear-gradient(180deg, rgba(40,70,50,0.85), rgba(25,45,32,0.95))', border: 'rgba(74,222,128,0.2)',
                games: [
                  { id: "coinRunner", icon: "🏃", img: "assets/ui/gi-coinRunner.webp", name: "コインランナー" },
                  { id: "juggler", icon: "🎰", img: "assets/ui/gi-juggler.webp", name: "ジャグラー" },
                  { id: "batting", icon: "⚾", img: "assets/ui/gi-batting.webp", name: "バッティングヒーロー" },
                  { id: "godAnother", icon: "⚡", img: "assets/ui/gi-godAnother.webp", name: "ゴッドアナザー" },
                  { id: "pinball", icon: "🎱", img: "assets/ui/gi-pinball.webp", name: "ピンボール" },
                  { id: "chainBurst", icon: "💥", img: "assets/ui/gi-chainBurst.webp", name: "チェインバースト" },
                ]},
              { label: '📐 計算', color: 'rgba(251,191,36,0.2)', bg: 'linear-gradient(180deg, rgba(65,60,55,0.85), rgba(38,35,32,0.95))', border: 'rgba(160,140,100,0.2)',
                games: [
                  { id: "mathEasy", icon: "➕", img: "assets/ui/gi-mathEasy.webp", name: "初級 足し引き" },
                  { id: "kuku", icon: "🔢", img: "assets/ui/gi-kuku.webp", name: "初級 九九" },
                  { id: "mathMid", icon: "📐", img: "assets/ui/gi-mathMid.webp", name: "中級 足し引き" },
                  { id: "mathHardAdd", icon: "🧮", img: "assets/ui/gi-mathHardAdd.webp", name: "上級 足し引き" },
                  { id: "mathHardMult", icon: "✖️", img: "assets/ui/gi-mathHardMult.webp", name: "上級 掛け割り" },
                ]},
            ].map(cat => (
              <div key={cat.label} style={{ marginBottom: 12 }}>
                {/* カテゴリ見出し: 左右に金の唐草帯(画像404時は帯が消えるだけ) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,224,150,0.75)', letterSpacing: 1, whiteSpace: 'nowrap' }}>{cat.label}</div>
                  <div style={{ flex: 1, height: 10, backgroundImage: 'url(assets/ui/divider.webp)', backgroundSize: 'auto 100%', backgroundRepeat: 'no-repeat', backgroundPosition: 'left center', opacity: 0.7 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {cat.games.map(g => (
              <div key={g.id} onClick={() => { sfx('click'); setMiniGame(g.id); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 12px',
                  background: cat.bg,
                  border: `1px solid ${cat.border}`,
                  borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'; }}>
                {/* Icon box */}
                <div style={{ width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, rgba(60,55,80,0.9), rgba(45,40,60,0.95))',
                  borderRadius: 10, flexShrink: 0, overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                  {g.img ? (
                    <img src={g.img} alt="" style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'cover', display: 'block' }}
                      onError={e => { e.currentTarget.style.display='none'; const f=e.currentTarget.nextSibling; if(f) f.style.display='block'; }} />
                  ) : null}
                  <span style={{ display: g.img ? 'none' : 'block', fontSize: 22, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>{g.icon}</span>
                </div>
                {/* Name */}
                <span style={{ fontSize: 13, fontWeight: 700,
                  color: 'rgba(220,215,235,0.9)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{g.name}</span>
              </div>
                  ))}
                </div>
              </div>
            ))}
            </div>
          </div>
        )}
        {screen === "minigame" && miniGame === "tap" && <TapGame onScore={(c) => handleMiniGameScore('tap', c)} onClose={handleMiniGameClose} />}
        {screen === "minigame" && miniGame === "coinRunner" && <CoinRunnerGame onScore={(c) => handleMiniGameScore('coinRunner', c)} onClose={handleMiniGameClose} />}
        {screen === "minigame" && miniGame === "juggler" && <JugglerGame onScore={(c) => handleMiniGameScore('juggler', c)} onClose={handleMiniGameClose} />}
        {screen === "minigame" && miniGame === "godAnother" && <GodAnotherGame onScore={(c) => handleMiniGameScore('godAnother', c)} onClose={handleMiniGameClose} />}
        {screen === "minigame" && miniGame === "batting" && <BattingGame onScore={(c) => handleMiniGameScore('batting', c)} onClose={handleMiniGameClose} />}
        {screen === "minigame" && miniGame === "pinball" && <PinballGame onScore={(c) => handleMiniGameScore('pinball', c)} onClose={handleMiniGameClose} />}
        {screen === "minigame" && miniGame === "chainBurst" && <ChainBurstGame onScore={(c) => handleMiniGameScore('chainBurst', c)} onClose={handleMiniGameClose} />}
        {screen === "minigame" && miniGame === "gem" && <GemCatchGame onScore={(c) => handleMiniGameScore('gem', c)} onClose={handleMiniGameClose} />}
        {screen === "minigame" && miniGame === "timing" && <TimingGame onScore={(c) => handleMiniGameScore('timing', c)} onClose={handleMiniGameClose} />}
        {screen === "minigame" && miniGame === "tower" && <CoinTowerGame onScore={(c) => handleMiniGameScore('tower', c)} onClose={handleMiniGameClose} />}
        {screen === "minigame" && miniGame === "memory" && <MemoryGame onScore={(c) => handleMiniGameScore('memory', c)} onClose={handleMiniGameClose} />}
        {screen === "minigame" && miniGame === "quickdraw" && <QuickDrawGame onScore={(c) => handleMiniGameScore('quickdraw', c)} onClose={handleMiniGameClose} />}
        {screen === "minigame" && miniGame === "shooting" && <ShootingGame onScore={(c) => handleMiniGameScore('shooting', c)} onClose={handleMiniGameClose} />}
        {screen === "minigame" && miniGame === "mathEasy" && <MathEasyGame onScore={(c) => handleMiniGameScore('mathEasy', c)} onClose={handleMiniGameClose} />}
        {screen === "minigame" && miniGame === "kuku" && <KukuGame onScore={(c) => handleMiniGameScore('kuku', c)} onClose={handleMiniGameClose} />}
        {screen === "minigame" && miniGame === "mathMid" && <MathMidGame onScore={(c) => handleMiniGameScore('mathMid', c)} onClose={handleMiniGameClose} />}
        {screen === "minigame" && miniGame === "mathHardAdd" && <MathHardAddGame onScore={(c) => handleMiniGameScore('mathHardAdd', c)} onClose={handleMiniGameClose} />}
        {screen === "minigame" && miniGame === "mathHardMult" && <MathHardMultGame onScore={(c) => handleMiniGameScore('mathHardMult', c)} onClose={handleMiniGameClose} />}

        {/* COLLECTION */}
        {screen === "collection" && <CollectionView collection={collection} onSelect={setModal} setBonuses={setBonuses}
          uraUnlocked={uraUnlocked} uraObtained={uraObtained} showUraMuseum={showUraMuseum} setShowUraMuseum={setShowUraMuseum}
          requestMode={requestMode} onRequest={(item) => {
            const trimName = (nickname || '').trim();
            if (!trimName || !window.fbDb || item.rank >= 11) return;
            const reqRef = window.fbDb.ref('notifications/itemRequests');
            reqRef.orderByChild('name').equalTo(trimName).once('value').then(snap => {
              const existing = [];
              snap.forEach(child => existing.push({ key: child.key, ts: child.val().timestamp || 0 }));
              if (existing.length >= 2) {
                setSaveMsg('⚠️ リクエストは最大2個までです。先にキャンセルしてください');
                setTimeout(() => setSaveMsg(''), 3000);
                setRequestMode(false);
                return Promise.reject('max_reached');
              }
            }).then(() => {
              return reqRef.push({
                name: trimName, typeId: item.typeId, rank: item.rank, icon: item.icon || item.typeEmoji,
                itemName: item.name, rarity: { color: item.rarity.color, label: item.rarity.label },
                timestamp: Date.now()
              });
            }).then(() => {
              setSaveMsg(`💌 ★${item.rank} ${item.name} をリクエストしました！`);
              setTimeout(() => setSaveMsg(''), 3000);
              setRequestMode(false);
              nav('home');
            }).catch(() => {
              setSaveMsg('⚠️ リクエストに失敗しました');
              setTimeout(() => setSaveMsg(''), 3000);
            });
          }} onCancelRequest={() => setRequestMode(false)} />}

        {/* SYNTH */}
        {screen === "synth" && (
          <SynthView collection={collection} synthResult={synthResult}
            onFindCandidates={findSynthCandidates} onFindPrism={findPrismCandidates}
            onSynthSingle={doSynthSingle} onSynthAll={doSynthAll} />
        )}

        {/* SPEND */}
        {screen === "spend" && (() => {
          const grossAssets = Object.entries(collection).reduce((sum, [k, m]) => sum + entryPower(k, m.count || 0, m.rank), 0)
            + URA_ITEMS.filter(u => uraObtained.includes(u.id)).reduce((s, u) => s + u.value, 0);
          const available = grossAssets - totalSpent;
          return (
            <div>
              <div style={{ margin: '0 -16px', padding: '20px 16px 16px',
                background: 'linear-gradient(160deg, rgba(236,72,153,0.1) 0%, rgba(245,158,11,0.06) 100%)',
                borderBottom: '1px solid rgba(236,72,153,0.1)', marginBottom: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>🍽️ 資産を使う</div>
                <div style={{ fontSize: 11, opacity: 0.4 }}>集めた資産で家族へのご褒美に</div>
              </div>

              {/* Balance summary */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <div style={{ flex: 1, padding: '10px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, opacity: 0.4 }}>総資産額</div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#fbbf24' }}>{formatYen(grossAssets)}</div>
                </div>
                <div style={{ flex: 1, padding: '10px 8px', borderRadius: 12, background: 'rgba(236,72,153,0.06)', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, opacity: 0.4 }}>使用済み</div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#ec4899' }}>{totalSpent > 0 ? '-' + formatYen(totalSpent) : '0円'}</div>
                </div>
                <div style={{ flex: 1, padding: '10px 8px', borderRadius: 12, background: 'rgba(74,222,128,0.06)', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, opacity: 0.4 }}>残り</div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: available >= 0 ? '#4ade80' : '#ef4444' }}>{formatYen(available)}</div>
                </div>
              </div>

              {/* Input form */}
              <SpendForm available={available} spending={spending} onSpend={(amount, memo) => {
                setSpending(prev => [...prev, { amount, memo, date: Date.now() }]);
                setSaveMsg("🍽️ " + formatYen(amount) + " を使用しました");
                setTimeout(() => setSaveMsg(""), 2500);
              }} />

              {/* History */}
              {spending.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>利用履歴（{spending.length}件）</div>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {[...spending].reverse().map((e, i) => {
                      const realIdx = spending.length - 1 - i;
                      return (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                          borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 12,
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700 }}>{e.memo}</div>
                            <div style={{ fontSize: 10, opacity: 0.4 }}>{new Date(e.date).toLocaleDateString('ja-JP')} {new Date(e.date).toLocaleTimeString('ja-JP', {hour:'2-digit',minute:'2-digit'})}</div>
                          </div>
                          <span style={{ color: '#ec4899', fontWeight: 900, fontFamily: "'Orbitron',sans-serif", fontSize: 11, marginRight: 6 }}>
                            -{formatYen(e.amount)}
                          </span>
                          {e.paid ? (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap' }}>✅ 入金済み</span>
                          ) : (
                            <button onClick={() => {
                              if (confirm('入金をもらいましたか？')) {
                                setSpending(prev => {
                                  const n = [...prev];
                                  n[realIdx] = { ...n[realIdx], paid: true };
                                  return n;
                                });
                              }
                            }} style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              💰 入金確認
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        {/* RANKING */}
        {screen === "ranking" && <RankingScreen />}

        {/* GAME HISTORY */}
        {screen === "history" && <GameHistoryScreen />}
      </div>

      {/* NAV */}
      <div className="nav">
        {[
          { id: "home", img: "nav-home.webp", label: "ホーム" },
          { id: "gacha", img: "nav-gacha.webp", label: "ガチャ" },
          { id: "minigame", img: "nav-game.webp", label: "ゲーム" },
          { id: "collection", img: "nav-collection.webp", label: "展示室" },
          { id: "synth", img: "nav-synth.webp", label: "合成" },
        ].map(n => (
          <button key={n.id} className={`nb ${screen === n.id ? 'act' : ''}`} onClick={() => nav(n.id)}>
            <img src={n.img} alt="" style={{ width: 42, height: 42, objectFit: 'contain',
              filter: screen === n.id
                ? 'brightness(1.15) drop-shadow(0 0 5px rgba(240,214,145,0.75)) drop-shadow(0 0 12px rgba(201,168,76,0.35))'
                : 'brightness(0.62) saturate(0.85)',
              transition: 'filter 0.3s' }} />
            <span className="nb-l">{n.label}</span>
            {screen === n.id && <span className="nb-ind" />}
          </button>
        ))}
      </div>

      {/* MODAL */}
      {modal && (() => {
        const rkCls = modal.prism ? 'rank-rainbow' : modal.rank >= 11 ? 'rank-diamond' : modal.rank === 10 ? 'rank-rainbow' : modal.rank === 9 ? 'rank-gold' : modal.rank === 8 ? 'rank-silver' : modal.rank === 7 ? 'rank-epic' : modal.rank === 6 ? 'rank-ultra' : '';
        const cardCls = modal.rank >= 11 ? 'rank11-card' : modal.rank === 10 ? 'rank10-card' : modal.rank === 9 ? 'rank9-card' : modal.rank === 8 ? 'rank8-card' : modal.rank === 7 ? 'rank7-card' : modal.rank === 6 ? 'rank6-card' : '';
        return (
        <div className="mo" onClick={() => setModal(null)}>
          <div className={`mc ${cardCls}`} style={{ borderColor: modal.rarity.color }} onClick={e => e.stopPropagation()}>
            <div>{modal.img ? renderItemIcon(modal, 80) : <span style={{ fontSize: 64 }}>{modal.icon}</span>}</div>
            <div className={rkCls} style={{ fontSize: 20, fontWeight: 900, color: rkCls ? undefined : modal.rarity.color, marginTop: 8 }}>{modal.name}</div>
            <div className={rkCls} style={{ color: rkCls ? undefined : modal.rarity.color, letterSpacing: 2, marginTop: 4, fontSize: 14 }}>
              {renderStars(modal.rank)}
            </div>
            <div className={rkCls} style={{ fontSize: 12, color: rkCls ? undefined : modal.rarity.color, fontWeight: 700 }}>{modal.rarity.label}</div>
            <div style={{ fontSize: 12, opacity: 0.6, margin: '8px 0' }}>{modal.desc}</div>
            <div style={{ fontSize: 12 }}>
              <span style={{ color: modal.typeColor }}>{modal.typeEmoji} {modal.typeName}</span>
              {modal.count && <span style={{ marginLeft: 10, opacity: 0.5 }}>×{modal.count}</span>}
            </div>
            <div style={{ margin: '10px 0', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 3 }}>資産価値</div>
              <span style={{ fontFamily: "'Noto Sans JP',sans-serif", fontSize: 14, fontWeight: 900, color: '#c084fc' }}>
                {formatYen(itemUnitPower(modal))}
              </span>
              {modal.count > 1 && (
                <span style={{ fontSize: 11, opacity: 0.4, marginLeft: 8 }}>
                  (合計: {formatYen(itemUnitPower(modal) * modal.count)})
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
              {modal.count > 1 && modal.rank < 11 && (
                <button className="btn" style={{ fontSize: 12, padding: '8px 14px',
                  background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#c084fc' }}
                  onClick={() => { setShowGiftModal({ key: `${modal.typeId}_${modal.rank}`, item: modal }); setModal(null); setGiftRecipient(''); }}>
                  🎁 ギフト
                </button>
              )}
              <button className="btn bs" style={{ fontSize: 12, padding: '8px 14px' }} onClick={() => setModal(null)}>閉じる</button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* GAME CLEAR */}
      {showClear && showClearTier && (() => {
        // CONGRATS三部作(A7 2026-08-25): tier別動画のテーブル引き。カード演出(旧Tier2/3の絵文字演出)を常に土台として敷き、
        // 動画は上に重ねるだけ。onError/404で動画層を非表示にすれば下のカード演出がそのまま床(現行動作)になる。
        const CONGRATS_MOVIE = { 1: 'congrats-tier1.mp4', 2: 'congrats-tier2.mp4', 3: 'congrats-tier3.mp4' };
        const movieSrc = CONGRATS_MOVIE[showClearTier.tier];
        const clearMsg = showClearTier.tier === 1
          ? 'おめでとうございます！全ての伝説のトレジャーを集めました。'
          : showClearTier.tier === 2 ? '素晴らしい！全★MAXを3個ずつ揃えました！' : '圧巻！裏アイテム全66種を制覇しました！';
        return (
          <>
            {/* カード演出(土台/フォールバック層。動画404時はこれがそのまま見える) */}
            <div className="mo">
              <div className="rare-flash" style={{ background: `linear-gradient(135deg, ${showClearTier.tierColor}99, rgba(255,105,180,0.5), rgba(123,104,238,0.5))`, animationDuration: '0.8s' }} />
              <div className="rare-flash" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.6), transparent 50%)', animationDuration: '1s', animationDelay: '0.3s' }} />
              <div className="rare-flash" style={{ background: `linear-gradient(45deg, rgba(255,105,180,0.5), rgba(0,255,204,0.4), rgba(123,104,238,0.5))`, animationDuration: '1.2s', animationDelay: '0.6s' }} />
              {showClearTier.tier >= 3 && <>
                <div className="rare-flash" style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.5), transparent 40%)', animationDuration: '1.5s', animationDelay: '0.9s' }} />
                <div className="rare-flash" style={{ background: 'conic-gradient(from 0deg, rgba(255,0,0,0.3), rgba(0,255,0,0.3), rgba(0,0,255,0.3), rgba(255,0,0,0.3))', animationDuration: '1.8s', animationDelay: '1.2s' }} />
              </>}
              <div className="rare-shake" style={{ position: 'fixed', inset: 0, zIndex: 9997, pointerEvents: 'none' }} />
              <div className="rare-shake" style={{ position: 'fixed', inset: 0, zIndex: 9996, pointerEvents: 'none', animationDelay: '0.5s' }} />
              {showClearTier.tier >= 3 && <div className="rare-shake" style={{ position: 'fixed', inset: 0, zIndex: 9995, pointerEvents: 'none', animationDelay: '1.0s' }} />}
              <div style={{
                background: 'radial-gradient(circle, rgba(25,10,5,0.98), rgba(0,0,0,0.99))',
                borderRadius: 24, padding: '32px 24px', maxWidth: 360, width: '100%',
                textAlign: 'center', border: '2px solid transparent',
                position: 'relative', overflow: 'hidden',
                animation: 'congratsGlow 2s ease-in-out infinite',
              }} onClick={e => e.stopPropagation()}>
                <div style={{ position: 'absolute', inset: -2, borderRadius: 26,
                  background: showClearTier.tier <= 2
                    ? 'conic-gradient(from 0deg, #ff6b6b, #ffd93d, #6bff6b, #6bc5ff, #d06bff, #ff6b6b) border-box'
                    : 'conic-gradient(from 0deg, #00ffcc, #ffd700, #ff69b4, #7b68ee, #00ffcc) border-box',
                  animation: 'synthMaxRotate 4s linear infinite',
                  WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor', maskComposite: 'exclude', pointerEvents: 'none',
                }} />
                <div style={{
                  fontSize: showClearTier.tier >= 3 ? 100 : 90, marginBottom: 12,
                  animation: 'synthMaxIcon 1.2s cubic-bezier(0.34,1.56,0.64,1) forwards, heroIconFloat 2s ease-in-out 1.2s infinite',
                  filter: showClearTier.tier >= 3
                    ? `drop-shadow(0 0 30px ${showClearTier.tierColor}) drop-shadow(0 0 60px rgba(255,215,0,0.7)) drop-shadow(0 0 90px rgba(255,105,180,0.5)) drop-shadow(0 0 120px rgba(123,104,238,0.3))`
                    : `drop-shadow(0 0 25px ${showClearTier.tierColor}) drop-shadow(0 0 50px ${showClearTier.tierColor}99) drop-shadow(0 0 80px rgba(255,215,0,0.4))` }}>
                  {showClearTier.icon}
                </div>
                {showClearTier.tier >= 3 && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -70%)',
                  width: 200, height: 200, borderRadius: '50%', border: '2px solid transparent',
                  background: 'conic-gradient(from 0deg, #ff6b6b, #ffd93d, #6bff6b, #6bc5ff, #d06bff, #ff6b6b) border-box',
                  WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor', maskComposite: 'exclude',
                  animation: 'synthMaxRotate 2s linear infinite', opacity: 0.5, pointerEvents: 'none' }} />}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -70%)',
                  width: 180, height: 180, borderRadius: '50%', animation: 'synthMaxPulse 1.5s ease-in-out infinite', pointerEvents: 'none' }} />
                <div className="rank-congrats" style={{ fontFamily: "'Orbitron',sans-serif",
                  fontSize: showClearTier.tier >= 3 ? 24 : 22, fontWeight: 900, letterSpacing: showClearTier.tier >= 3 ? 5 : 3, marginBottom: 4 }}>CONGRATULATIONS</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: showClearTier.tierColor, letterSpacing: 2, marginBottom: 4 }}>{showClearTier.tierLabel}</div>
                <div className="rank-congrats" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>{showClearTier.name}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
                  {BASE_TYPES.map((type, i) => (
                    <div key={type.id} style={{ filter: `drop-shadow(0 0 8px ${type.color})`,
                      animation: `heroIconFloat ${2 + i * 0.3}s ease-in-out infinite` }}>{renderItemIcon(MONSTERS[type.id][10], 44)}</div>
                  ))}
                </div>
                <div style={{ background: `linear-gradient(135deg, ${showClearTier.tierColor}18, rgba(255,105,180,0.05))`,
                  border: `1px solid ${showClearTier.tierColor}50`, borderRadius: 12, padding: '10px 16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4 }}>展示室報酬</div>
                  <div className="rank-congrats" style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 900 }}>{showClearTier.icon} {showClearTier.name} 獲得！</div>
                  <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 4, fontWeight: 700 }}>資産価値: 1,000億円</div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 16 }}>
                  {clearMsg}
                </div>
                <button className="btn bp" disabled={!clearReady}
                  style={{ fontSize: 14, padding: '12px 32px', opacity: clearReady ? 1 : 0.3, transition: 'opacity 0.5s' }}
                  onClick={() => { setShowClear(false); congratsShownRef.current = false; resumeMainBgm(); }}>
                  {clearReady ? '受け取る' : '...'}
                </button>
              </div>
            </div>
            {/* 動画層(あれば上に重ねる。onErrorで自身を隠し、下のカード演出を床として見せる) */}
            {movieSrc && (
              <div className="congrats-video-layer" style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                onClick={e => e.stopPropagation()}>
                <div className="rare-flash" style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.4), transparent 60%)', animationDuration: '1.2s', zIndex: 10005 }} />
                <div className="rare-flash" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,105,180,0.2), rgba(123,104,238,0.2))', animationDuration: '1.5s', animationDelay: '0.5s', zIndex: 10005 }} />
                <div className="rare-shake" style={{ position: 'fixed', inset: 0, zIndex: 10001, pointerEvents: 'none' }} />
                <div style={{ position: 'fixed', inset: 0, zIndex: 10006, pointerEvents: 'none', overflow: 'hidden' }}>
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} style={{ position: 'absolute', left: `${5 + (i * 47 + 13) % 90}%`, top: `${(i * 31 + 7) % 100}%`,
                      width: 4 + (i % 3) * 2, height: 4 + (i % 3) * 2, borderRadius: '50%',
                      background: ['#ffd700', '#fff', '#ff69b4', '#7b68ee', '#00ffcc'][i % 5],
                      boxShadow: `0 0 ${6 + (i % 4) * 3}px currentColor`,
                      animation: `heroIconFloat ${1.5 + (i % 5) * 0.4}s ease-in-out ${(i % 7) * 0.3}s infinite`, opacity: 0.8 }} />
                  ))}
                </div>
                <video key={`congrats-video-${showClearTier.tier}`} src={movieSrc} autoPlay playsInline muted preload="none"
                  ref={el => { if (el) { el.play().catch(() => {}); } }}
                  style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '130%', height: '130%', objectFit: 'contain', zIndex: 10003 }}
                  onError={e => { const layer = e.currentTarget.closest('.congrats-video-layer'); if (layer) layer.style.display = 'none'; }}
                  onLoadedData={() => {
                    try {
                      const a = audioCtx; if (!a) return; if (a.state === 'suspended') a.resume();
                      const now = a.currentTime;
                      const pf = (freq, start, dur, type, vol) => {
                        const o = a.createOscillator(), g = a.createGain();
                        o.connect(g); g.connect(a.destination); o.type = type;
                        o.frequency.setValueAtTime(freq, now + start);
                        g.gain.setValueAtTime(0, now + start);
                        g.gain.linearRampToValueAtTime(vol, now + start + 0.05);
                        g.gain.setValueAtTime(vol, now + start + dur * 0.7);
                        g.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
                        o.start(now + start); o.stop(now + start + dur + 0.01);
                      };
                      pf(523,0,0.4,'sine',0.15); pf(659,0,0.4,'sine',0.12); pf(784,0,0.4,'sine',0.12);
                      pf(587,0.4,0.3,'sine',0.12); pf(740,0.4,0.3,'sine',0.1);
                      pf(659,0.7,0.3,'sine',0.12); pf(831,0.7,0.3,'sine',0.1);
                      pf(784,1.0,0.8,'sine',0.15); pf(988,1.0,0.8,'sine',0.12);
                      pf(1175,1.0,0.8,'sine',0.1); pf(1568,1.0,0.8,'triangle',0.06);
                      pf(1047,1.8,1.2,'sine',0.08); pf(1319,1.8,1.2,'sine',0.06);
                      pf(1568,2.0,1.5,'sine',0.05); pf(2093,2.2,1.8,'triangle',0.03);
                      pf(784,3.0,2.5,'sine',0.1); pf(988,3.0,2.5,'sine',0.08);
                      pf(1175,3.0,2.5,'sine',0.06); pf(1568,3.2,2.5,'triangle',0.04);
                      pf(2093,5.0,2.0,'sine',0.04); pf(2637,5.5,1.5,'sine',0.03);
                    } catch(e) {}
                  }}
                />
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10004,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.85) 40%)', padding: '60px 20px 30px', textAlign: 'center' }}>
                  <div className="rank-congrats" style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, fontWeight: 900, letterSpacing: 3, marginBottom: 6 }}>CONGRATULATIONS</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: showClearTier.tierColor, letterSpacing: 2, marginBottom: 4 }}>{showClearTier.tierLabel}</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
                    {BASE_TYPES.map((type, i) => (
                      <div key={type.id} style={{ filter: `drop-shadow(0 0 8px ${type.color})`,
                        animation: `heroIconFloat ${2 + i * 0.3}s ease-in-out infinite` }}>{renderItemIcon(MONSTERS[type.id][10], 40)}</div>
                    ))}
                  </div>
                  <div style={{ background: `linear-gradient(135deg, ${showClearTier.tierColor}18, rgba(255,105,180,0.05))`,
                    border: `1px solid ${showClearTier.tierColor}50`, borderRadius: 12, padding: '8px 16px', marginBottom: 12, display: 'inline-block' }}>
                    <div className="rank-congrats" style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 900 }}>{showClearTier.icon} {showClearTier.name} 獲得！</div>
                    <div style={{ fontSize: 10, color: '#fbbf24', marginTop: 2, fontWeight: 700 }}>資産価値: 1,000億円</div>
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 12 }}>{clearMsg}</div>
                  <button className="btn bp" disabled={!clearReady}
                    style={{ fontSize: 14, padding: '12px 32px', opacity: clearReady ? 1 : 0.3, transition: 'opacity 0.5s' }}
                    onClick={() => { setShowClear(false); congratsShownRef.current = false; resumeMainBgm(); }}>
                    {clearReady ? '受け取る' : '...'}
                  </button>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Ura item reveal - same effect as ★10 GOD */}
      {rareEffect && rareEffect.type === 'uraItem' && (
        <>
          <div className="rare-flash" style={{ background: 'linear-gradient(135deg, rgba(255,107,107,0.4), rgba(255,209,61,0.4), rgba(107,255,107,0.4), rgba(107,197,255,0.4), rgba(208,107,255,0.4))' }} />
          <div className="rare-shake" style={{ position: 'fixed', inset: 0, zIndex: 9997, pointerEvents: 'none' }} />
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(circle, rgba(80,40,0,0.9), rgba(0,0,0,0.95))', pointerEvents: 'auto' }}>
            <div className="rare-rainbow" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 70, lineHeight: 0, marginBottom: 16, animation: 'synthMaxIcon 1s cubic-bezier(0.34,1.56,0.64,1) forwards, heroIconFloat 2s ease-in-out 1s infinite',
                filter: 'drop-shadow(0 0 20px rgba(255,107,129,0.8)) drop-shadow(0 0 40px rgba(255,215,0,0.5))' }}>
                {renderItemIcon(rareEffect.uraItem, 70, { filter: 'none' })}
              </div>
              <div className="rare-god-text" style={{ fontSize: 32, fontWeight: 900,
                background: 'linear-gradient(90deg, #ff6b6b, #ffd93d, #6bff6b, #6bc5ff, #d06bff, #ff6b6b)',
                backgroundSize: '200% 100%', animation: 'rainbowText 1.5s linear infinite',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 15px rgba(255,215,0,0.6))',
                fontFamily: "'Orbitron',sans-serif", letterSpacing: 8 }}>
                S H A D O W
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'rgba(255,215,0,0.8)', marginTop: 12, fontFamily: "'Orbitron',sans-serif" }}>
                {rareEffect.uraItem.name}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,215,0,0.5)', marginTop: 6, fontFamily: "'Rajdhani',sans-serif", letterSpacing: 4 }}>
                ★ {rareEffect.uraItem.rank} — {(rareEffect.uraItem.value / 100000000).toLocaleString()}億円
              </div>
            </div>
          </div>
        </>
      )}
      {/* Rare gacha effects */}
      {rareEffect && rareEffect.type === 'god' && (
        <>
          <div className="rare-flash" style={{ background: 'linear-gradient(135deg, rgba(255,107,107,0.4), rgba(255,209,61,0.4), rgba(107,255,107,0.4), rgba(107,197,255,0.4), rgba(208,107,255,0.4))' }} />
          <div className="rare-shake" style={{ position: 'fixed', inset: 0, zIndex: 9997, pointerEvents: 'none' }} />
          {/* ★10カットイン(A7 2026-08-25): mixBlendMode:screenで全画面重ね。404ならonErrorで自身を消し現行演出のみ床になる */}
          <img src="assets/gacha/cut-r10.webp" alt=""
            style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 9997,
              mixBlendMode: 'screen', pointerEvents: 'none', opacity: 0, animation: 'rareFlash 3.5s ease-out forwards' }}
            onError={e => { e.currentTarget.style.display = 'none'; }} />
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(circle, rgba(80,40,0,0.9), rgba(0,0,0,0.95))', pointerEvents: 'none' }}>
            <div className="rare-rainbow" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 60, lineHeight: 0, marginBottom: 16, animation: 'heroIconFloat 1.5s ease-in-out infinite',
                filter: 'drop-shadow(0 0 20px rgba(255,107,129,0.8)) drop-shadow(0 0 40px rgba(255,215,0,0.5))' }}>
                {rareEffect.item ? renderItemIcon(rareEffect.item, 60, { filter: 'none' }) : '💎'}
              </div>
              <div className="rare-god-text" style={{ fontSize: 32, fontWeight: 900,
                background: 'linear-gradient(90deg, #ff6b6b, #ffd93d, #6bff6b, #6bc5ff, #d06bff, #ff6b6b)',
                backgroundSize: '200% 100%', animation: 'rainbowText 1.5s linear infinite',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 15px rgba(255,215,0,0.6))',
                fontFamily: "'Orbitron',sans-serif", letterSpacing: 8 }}>
                G O D 降 臨
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,215,0,0.6)', marginTop: 8, fontFamily: "'Rajdhani',sans-serif", letterSpacing: 4 }}>
                ★ ★ ★ ★ ★ ★ ★ ★ ★ ★
              </div>
            </div>
          </div>
        </>
      )}
      {rareEffect && rareEffect.type === 'mythic' && (
        <>
          <div className="rare-flash" style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.4), transparent 70%)' }} />
          {/* ★9カットイン(A7 2026-08-25) */}
          <img src="assets/gacha/cut-r9.webp" alt=""
            style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 9997,
              mixBlendMode: 'screen', pointerEvents: 'none', opacity: 0, animation: 'rareFlash 2.5s ease-out forwards' }}
            onError={e => { e.currentTarget.style.display = 'none'; }} />
        </>
      )}
      {rareEffect && rareEffect.type === 'legend' && (
        <>
          <div className="rare-flash" style={{ background: 'radial-gradient(circle, rgba(200,214,229,0.4), transparent 60%)' }} />
          {/* ★8カットイン(A7 2026-08-25) */}
          <img src="assets/gacha/cut-r8.webp" alt=""
            style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 9997,
              mixBlendMode: 'screen', pointerEvents: 'none', opacity: 0, animation: 'rareFlash 1.5s ease-out forwards' }}
            onError={e => { e.currentTarget.style.display = 'none'; }} />
        </>
      )}
      {rareEffect && rareEffect.type === 'epic' && (
        <div className="rare-flash" style={{ background: 'radial-gradient(circle, rgba(255,71,87,0.25), transparent 65%)', animationDuration: '0.35s' }} />
      )}
      {rareEffect && rareEffect.type === 'ultra' && (
        <div className="rare-flash" style={{ background: 'radial-gradient(circle, rgba(230,126,34,0.2), transparent 70%)', animationDuration: '0.3s' }} />
      )}
      {rareEffect && rareEffect.type === 'ssrare' && (
        <div className="rare-flash" style={{ background: 'radial-gradient(circle, rgba(155,89,182,0.15), transparent 70%)', animationDuration: '0.25s' }} />
      )}

      {/* Cue effects (gacha foreshadowing) */}
      {/* Sparkle patterns (★5-6) */}
      {cueEffect === 'sparkle' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.3), transparent 70%)', animation: 'rareFlash 0.3s ease-out forwards' }} />
        </div>
      )}
      {cueEffect === 'sparkle2' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.25), transparent 60%)', animation: 'rareFlash 0.35s ease-out forwards' }} />
        </div>
      )}
      {/* Metal patterns (★7) */}
      {cueEffect === 'metal' && (
        <div className="rare-flash" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.25), transparent 60%)', animationDuration: '0.25s' }} />
      )}
      {cueEffect === 'metal2' && (
        <div className="rare-flash" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.2), transparent 40%, transparent 60%, rgba(255,255,255,0.15))', animationDuration: '0.3s' }} />
      )}
      {/* Heavy patterns (★8) */}
      {cueEffect === 'heavy' && (
        <div className="rare-shake" style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', background: 'radial-gradient(circle, rgba(167,139,250,0.15), transparent 60%)' }} />
      )}
      {cueEffect === 'heavy2' && (
        <div className="rare-shake" style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 80%, rgba(200,100,50,0.2), transparent 60%)' }} />
      )}
      {/* Mythic patterns (★9+) */}
      {cueEffect === 'mythic' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', background: 'radial-gradient(circle, rgba(255,215,0,0.2), rgba(0,0,0,0.6) 70%)', animation: 'rareFlash 0.6s ease-out forwards' }} />
      )}
      {cueEffect === 'mythic2' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 60%, rgba(100,50,200,0.3), rgba(0,0,0,0.7) 60%)', animation: 'rareFlash 0.7s ease-out forwards' }} />
      )}

      {/* ★MAX Retry Dialog */}
      {synthRetry && !rareEffect && (
        <div className="mo" onClick={acceptSynthRetry}>
          <div className="mc" style={{ borderColor: 'rgba(255,215,0,0.4)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{synthRetry.resultIcon}</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fbbf24', marginBottom: 4 }}>
              {synthRetry.resultName}が出ました
            </div>
            <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 16 }}>
              ★MAXを4種類以上持っているため、<br/>1回だけやり直せます！
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn bp" style={{ fontSize: 13, padding: '10px 20px',
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
                onClick={doSynthMaxRetry}>
                🔄 やり直す
              </button>
              <button className="btn bs" style={{ fontSize: 13, padding: '10px 20px' }}
                onClick={acceptSynthRetry}>
                このままでOK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVE MODAL */}
      {showSaveModal && (
        <div className="mo" onClick={() => setShowSaveModal(false)}>
          <div className="mc" style={{ borderColor: 'rgba(139,92,246,0.4)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>💾</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#c084fc', marginBottom: 4 }}>セーブ</div>
            <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 16 }}>保存するスロットを選んでください</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map(id => {
                const data = slotPreviews[id - 1];
                const isCurrent = id === slotId;
                const pwr = data ? calcPower(data.collection) + URA_ITEMS.filter(u => (data.uraObtained || []).includes(u.id)).reduce((s, u) => s + u.value, 0) : 0;
                return (
                  <div key={id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12,
                    background: isCurrent ? 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.1))' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${isCurrent ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                    <span style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 900, fontSize: 16,
                      color: isCurrent ? '#c084fc' : 'rgba(255,255,255,0.3)' }}>{id}</span>
                    <span style={{ flex: 1, textAlign: 'left', fontSize: 12 }}>
                      {data ? (
                        <>
                          <span style={{ color: '#fbbf24', fontWeight: 700 }}>💰{formatYen(pwr)}</span>
                          <span style={{ opacity: 0.4, marginLeft: 6 }}>📖{Object.keys(data.collection || {}).length}/69</span>
                        </>
                      ) : (
                        <span style={{ opacity: 0.3 }}>空きスロット</span>
                      )}
                      {isCurrent && <span style={{ marginLeft: 6, fontSize: 9, color: '#a78bfa', fontWeight: 700 }}>現在</span>}
                    </span>
                    <button className="btn bp" style={{ fontSize: 10, padding: '6px 10px' }} onClick={() => saveToSlot(id)}>保存</button>
                    {data && (
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(id); }}
                        style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '6px 8px',
                          fontSize: 10, color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}>
                        🗑
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Delete confirmation */}
            {confirmDeleteId && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 12,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 700, marginBottom: 8 }}>
                  スロット{confirmDeleteId}を削除しますか？
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button onClick={() => deleteSlot(confirmDeleteId)}
                    style={{ background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.5)', borderRadius: 8,
                      padding: '6px 16px', fontSize: 12, color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                    削除する
                  </button>
                  <button onClick={() => setConfirmDeleteId(null)}
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
                      padding: '6px 16px', fontSize: 12, color: '#fff', cursor: 'pointer' }}>
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            <button className="btn bs" style={{ marginTop: 14, fontSize: 12, padding: '8px 20px' }}
              onClick={() => setShowSaveModal(false)}>
              戻る
            </button>

            {/* Storage diagnostic */}
            <div style={{ marginTop: 12, fontSize: 9, opacity: 0.3 }}>
              storage: {window.storage ? '✅' : '❌'}
            </div>
            {storageLog.length > 0 && (
              <div style={{ marginTop: 6, maxHeight: 80, overflowY: 'auto', fontSize: 8, opacity: 0.3, textAlign: 'left', padding: '4px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 6 }}>
                {storageLog.slice(-5).map((l, i) => (
                  <div key={i}>{new Date(l.t).toLocaleTimeString('ja-JP')} {l.m}</div>
                ))}
              </div>
            )}

            {/* Emergency force save */}
            <button style={{ marginTop: 6, fontSize: 9, opacity: 0.3, background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => saveToSlot(slotId || 1)}>
              ⚙️ 強制セーブ（トラブル時用）
            </button>
          </div>
        </div>
      )}

      {/* GIFT MODAL */}
      {showGiftModal && (
        <div className="mo" onClick={() => setShowGiftModal(null)}>
          <div className="mc" style={{ borderColor: 'rgba(139,92,246,0.4)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{showGiftModal.item.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#c084fc', marginBottom: 4 }}>
              🎁 ギフトを送る
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
              {showGiftModal.item.name}（{showGiftModal.item.rarity.label}）
            </div>
            <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 12 }}>
              資産価値: {formatYen(POWER_VALUES[showGiftModal.item.rank - 1])}
            </div>
            <div style={{ fontSize: 11, marginBottom: 8 }}>送り先のニックネーム:</div>
            <input type="text" value={giftRecipient} onChange={e => setGiftRecipient(e.target.value)}
              placeholder="相手の名前..." style={{ width: '80%', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(139,92,246,0.25)', borderRadius: 10, padding: '8px 12px',
              fontSize: 14, color: '#fff', outline: 'none', textAlign: 'center', marginBottom: 12 }} />
            <div style={{ fontSize: 9, opacity: 0.4, marginBottom: 12 }}>
              本日の残り: {3 - (lastGiftDate === getLocalDate() ? giftsSentToday : 0)}回
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn bp" style={{ fontSize: 13, padding: '10px 20px' }}
                disabled={!giftRecipient || giftRecipient === nickname}
                onClick={() => sendGift(showGiftModal.key, giftRecipient)}>
                🎁 送る
              </button>
              <button className="btn bs" style={{ fontSize: 13, padding: '10px 20px' }}
                onClick={() => setShowGiftModal(null)}>キャンセル</button>
            </div>
          </div>
        </div>
      )}

      {/* GIFT RECEIVED NOTIFICATION */}
      {showGiftReceived && (
        <div className="mo" onClick={() => setShowGiftReceived(null)}>
          <div className="mc" style={{ borderColor: 'rgba(74,222,128,0.4)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎁</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#4ade80', marginBottom: 12 }}>
              ギフトが届きました！
            </div>
            {showGiftReceived.map((g, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
                justifyContent: 'center', fontSize: 13 }}>
                <span style={{ fontSize: 24 }}>{g.icon}</span>
                <span style={{ fontWeight: 700 }}>{g.name}</span>
                <span style={{ opacity: 0.5 }}>from</span>
                <span style={{ color: '#c084fc' }}>{g.from}</span>
              </div>
            ))}
            <button className="btn bp" style={{ marginTop: 12, fontSize: 13, padding: '10px 24px' }}
              onClick={() => setShowGiftReceived(null)}>受け取る！</button>
          </div>
        </div>
      )}
    </div>
  );
}
