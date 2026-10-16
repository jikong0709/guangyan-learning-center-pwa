(function () {
  "use strict";

  var config = window.MeihaoSupabaseConfig;
  var progress = window.MeihaoLearningProgress;
  var statusEl = document.querySelector("#authStatus");
  var loginBtn = document.querySelector("#googleLoginBtn");
  var logoutBtn = document.querySelector("#logoutBtn");
  var currentUser = null;
  var uploadTimer = null;
  var PROGRESS_KEY = "english-elementary-v2";

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.classList.toggle("auth-error", !!isError);
  }

  function copy(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  function mergeFlags(local, remote) {
    var result = {};
    [remote, local].forEach(function (source) {
      if (!source || typeof source !== "object") return;
      Object.keys(source).forEach(function (key) {
        if (source[key]) result[key] = true;
      });
    });
    return result;
  }

  function mergeMaxNumbers(local, remote) {
    var result = {};
    [remote, local].forEach(function (source) {
      if (!source || typeof source !== "object") return;
      Object.keys(source).forEach(function (key) {
        var value = Number(source[key]);
        if (Number.isFinite(value)) result[key] = Math.max(Number(result[key] || 0), value);
      });
    });
    return result;
  }

  function mergeState(local, remote) {
    local = copy(local);
    remote = copy(remote);
    var merged = copy(local);
    merged.schemaVersion = progress.schemaVersion;
    merged.completed = mergeFlags(local.completed, remote.completed);
    merged.weekPassed = mergeFlags(local.weekPassed, remote.weekPassed);
    merged.started = mergeFlags(local.started, remote.started);
    merged.scores = mergeMaxNumbers(local.scores, remote.scores);
    merged.weekScores = mergeMaxNumbers(local.weekScores, remote.weekScores);
    merged.wrong = mergeMaxNumbers(local.wrong, remote.wrong);
    merged.activityDates = Array.from(new Set([].concat(remote.activityDates || [], local.activityDates || []))).sort();
    merged.sampleBest = Math.max(Number(remote.sampleBest || 0), Number(local.sampleBest || 0));
    merged.samplePassed = remote.samplePassed === true || local.samplePassed === true;
    merged.migrationNotice = local.migrationNotice === true;
    return merged;
  }

  if (!statusEl || !loginBtn || !logoutBtn) return;

  if (!config || !progress || !window.supabase || !config.publishableKey || config.publishableKey.indexOf("__") === 0) {
    loginBtn.hidden = true;
    logoutBtn.hidden = true;
    setStatus("登入服務尚未設定", true);
    return;
  }

  var client = window.supabase.createClient(config.url, config.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  function renderSession(user) {
    currentUser = user || null;
    loginBtn.hidden = !!currentUser;
    logoutBtn.hidden = !currentUser;
    if (!currentUser) {
      setStatus("未登入｜進度保存在本機", false);
      return;
    }
    var metadata = currentUser.user_metadata || {};
    var name = metadata.full_name || metadata.name || currentUser.email || "已登入";
    setStatus(name + "｜雲端同步中", false);
  }

  async function uploadProgress(state) {
    if (!currentUser) return;
    var payload = {
      user_id: currentUser.id,
      progress_key: PROGRESS_KEY,
      schema_version: progress.schemaVersion,
      state: state
    };
    var result = await client.from("learning_progress").upsert(payload, {
      onConflict: "user_id,progress_key"
    });
    if (result.error) throw result.error;
  }

  async function syncProgress(user) {
    var result = await client
      .from("learning_progress")
      .select("state,schema_version")
      .eq("progress_key", PROGRESS_KEY)
      .maybeSingle();
    if (result.error) throw result.error;
    var merged = mergeState(progress.read(), result.data && result.data.state);
    progress.apply(merged);
    await uploadProgress(merged);
    var metadata = user.user_metadata || {};
    var label = metadata.full_name || metadata.name || user.email || "已登入";
    setStatus(label + "｜雲端已同步", false);
  }

  function scheduleUpload(state) {
    if (!currentUser) return;
    clearTimeout(uploadTimer);
    uploadTimer = setTimeout(function () {
      uploadProgress(state).then(function () {
        var label = statusEl.textContent.split("｜")[0];
        setStatus(label + "｜雲端已同步", false);
      }).catch(function (error) {
        console.warn("雲端進度儲存失敗", error);
        setStatus("已登入｜雲端同步失敗，本機進度仍保留", true);
      });
    }, 900);
  }

  loginBtn.addEventListener("click", async function () {
    loginBtn.disabled = true;
    setStatus("正在前往 Google 登入…", false);
    var result = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: config.redirectTo }
    });
    if (result.error) {
      console.warn("Google 登入啟動失敗", result.error);
      setStatus("Google 登入啟動失敗", true);
      loginBtn.disabled = false;
    }
  });

  logoutBtn.addEventListener("click", async function () {
    logoutBtn.disabled = true;
    var result = await client.auth.signOut();
    if (result.error) {
      console.warn("登出失敗", result.error);
      setStatus("登出失敗，請稍後再試", true);
    }
    logoutBtn.disabled = false;
  });

  document.addEventListener("meihao:progress-changed", function (event) {
    scheduleUpload(event.detail && event.detail.state ? event.detail.state : progress.read());
  });

  client.auth.onAuthStateChange(function (_event, session) {
    renderSession(session && session.user);
    if (session && session.user) {
      setTimeout(function () {
        syncProgress(session.user).catch(function (error) {
          console.warn("雲端進度同步失敗", error);
          setStatus("已登入｜雲端同步失敗，本機進度仍保留", true);
        });
      }, 0);
    }
  });

  client.auth.getSession().then(function (result) {
    if (result.error) throw result.error;
    renderSession(result.data.session && result.data.session.user);
  }).catch(function (error) {
    console.warn("登入狀態讀取失敗", error);
    setStatus("登入狀態讀取失敗，本機功能仍可使用", true);
  });
})();
