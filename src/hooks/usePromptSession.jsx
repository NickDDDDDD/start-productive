// src/hooks/usePromptSession.js
import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Chrome Prompt API Hook
 * - 只在挂载时检测支持与 availability（不自动建会话）
 * - 通过 initSession() 在用户手势里创建会话
 * - ready === 是否已有会话（而非 availability===available）
 */
export function usePromptSession() {
  const [supported, setSupported] = useState(false);
  const [availability, setAvailability] = useState("unavailable"); // unavailable | downloadable | downloading | available
  const [downloading, setDownloading] = useState({ loaded: 0 });
  const [error, setError] = useState(null);

  const sessionRef = useRef(null);
  const abortRef = useRef(null);
  const [hasSession, setHasSession] = useState(false); // <-- 新增：真正的 ready 来源

  // 检测支持 + availability
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const ok = typeof window !== "undefined" && !!window.LanguageModel;
        setSupported(ok);
        if (!ok) return;
        const avail = await window.LanguageModel.availability();
        if (!cancelled) setAvailability(avail);
      } catch (e) {
        if (!cancelled) setError(e);
      }
    })();

    return () => {
      cancelled = true;
      try {
        sessionRef.current?.destroy?.();
      } catch {}
      sessionRef.current = null;
      setHasSession(false);
      abortRef.current?.abort?.();
      abortRef.current = null;
    };
  }, []);

  const refreshAvailability = useCallback(async () => {
    if (!supported) return "unavailable";
    try {
      const avail = await window.LanguageModel.availability();
      setAvailability(avail);
      return avail;
    } catch (e) {
      setError(e);
      return "unavailable";
    }
  }, [supported]);

  // 在用户点击时调用；需要时会触发下载
  const initSession = useCallback(async () => {
    if (!supported)
      throw new Error("Prompt API not supported in this environment.");

    // 已有会话就复用
    if (sessionRef.current) {
      setHasSession(true);
      return sessionRef.current;
    }

    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const s = await window.LanguageModel.create({
        signal: controller.signal,
        monitor(m) {
          m.addEventListener("downloadprogress", (e) => {
            setAvailability("downloading");
            setDownloading({ loaded: e?.loaded ?? 0 });
          });
        },
      });

      sessionRef.current = s;
      setHasSession(true);

      const avail2 = await window.LanguageModel.availability();
      setAvailability(avail2);
      return s;
    } catch (e) {
      setError(e);
      setHasSession(false);
      throw e;
    }
  }, [supported]);

  const destroySession = useCallback(() => {
    try {
      sessionRef.current?.destroy?.();
    } catch {}
    sessionRef.current = null;
    setHasSession(false);
    setDownloading({ loaded: 0 });
  }, []);

  const prompt = useCallback(async (text, options) => {
    if (!sessionRef.current)
      throw new Error("Prompt session not ready. Call initSession() first.");
    return sessionRef.current.prompt(text, options);
  }, []);

  const promptStreaming = useCallback(async function* (text, options) {
    if (!sessionRef.current)
      throw new Error("Prompt session not ready. Call initSession() first.");
    const stream = await sessionRef.current.promptStreaming(text, options);
    for await (const chunk of stream) yield chunk;
  }, []);

  // ✅ 关键：ready 基于会话是否存在
  const ready = hasSession;
  const needsDownload =
    supported &&
    (availability === "downloadable" || availability === "downloading");

  return {
    supported,
    availability,
    downloading,
    error,
    ready,
    needsDownload,
    initSession,
    destroySession,
    refreshAvailability,
    prompt,
    promptStreaming,
  };
}
