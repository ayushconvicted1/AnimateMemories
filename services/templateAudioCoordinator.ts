/**
 * Template Audio Coordinator
 *
 * Enforces strict mutual exclusion for template audio playback:
 * ONLY ONE template video can play sound at any given time across the entire app.
 *
 * - When a template card un-mutes, all other template audio sources mute immediately.
 * - When a card scrolls out of view, stops playing, or unmounts, audio stops cleanly.
 * - Templates with audio (e.g. Mic Drop Rap, Groove Duo) start muted ("Sound Off") by default
 *   to avoid uninvited audio bursts.
 */
import { useEffect, useState, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";

type Listener = (activeId: string | null) => void;

class TemplateAudioCoordinator {
  private activeId: string | null = null;
  private listeners: Set<Listener> = new Set();

  constructor() {
    // Cut off template audio immediately when app moves to background or becomes inactive
    if (typeof AppState !== "undefined" && AppState.addEventListener) {
      AppState.addEventListener("change", (state: AppStateStatus) => {
        if (state !== "active") {
          this.stopAudio();
        }
      });
    }
  }

  getActiveId(): string | null {
    return this.activeId;
  }

  isAudioActive(id: string): boolean {
    return Boolean(id && this.activeId === id);
  }

  playAudio(id: string): void {
    if (!id || this.activeId === id) return;
    this.activeId = id;
    this.notify();
  }

  stopAudio(id?: string): void {
    if (id && this.activeId !== id) return;
    if (this.activeId === null) return;
    this.activeId = null;
    this.notify();
  }

  toggleAudio(id: string): boolean {
    if (!id) return false;
    if (this.activeId === id) {
      this.activeId = null;
      this.notify();
      return false;
    } else {
      this.activeId = id;
      this.notify();
      return true;
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.activeId);
      } catch (err) {
        console.warn("[TemplateAudioCoordinator] listener error:", err);
      }
    });
  }
}

export const templateAudioCoordinator = new TemplateAudioCoordinator();

/**
 * Checks if a given template (object or slug) has audio support.
 * Covers database flags (`hasAudio` / `hasaudio`) and known audio presets (`mic-drop-rap`, `groove-duo`).
 */
export function isAudioTemplate(templateOrSlug: any): boolean {
  if (!templateOrSlug) return false;
  if (typeof templateOrSlug === "string") {
    const s = templateOrSlug.toLowerCase().trim();
    return s === "mic-drop-rap" || s === "groove-duo";
  }
  const slug = (templateOrSlug.slug || templateOrSlug.id || "").toString().toLowerCase().trim();
  if (slug === "mic-drop-rap" || slug === "groove-duo") return true;
  const name = (templateOrSlug.name || "").toString().toLowerCase().trim();
  if (name === "mic drop rap" || name === "groove duo") return true;
  return Boolean(
    templateOrSlug.hasAudio ||
    templateOrSlug.hasaudio ||
    templateOrSlug.isAudio ||
    templateOrSlug.audio
  );
}

/**
 * React hook to bind a component to the global audio coordinator.
 */
export function useTemplateAudio(id?: string | null, hasAudio = false) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(() =>
    Boolean(hasAudio && id && templateAudioCoordinator.isAudioActive(id))
  );

  useEffect(() => {
    if (!hasAudio || !id) {
      setIsPlayingAudio(false);
      return;
    }

    // Set initial state
    setIsPlayingAudio(templateAudioCoordinator.isAudioActive(id));

    const unsubscribe = templateAudioCoordinator.subscribe((activeId) => {
      setIsPlayingAudio(activeId === id);
    });

    return () => {
      unsubscribe();
      // When unmounting while playing, silence audio
      if (templateAudioCoordinator.isAudioActive(id)) {
        templateAudioCoordinator.stopAudio(id);
      }
    };
  }, [id, hasAudio]);

  const toggleSound = useCallback(
    (e?: any) => {
      e?.stopPropagation?.();
      if (!id || !hasAudio) return;
      templateAudioCoordinator.toggleAudio(id);
    },
    [id, hasAudio]
  );

  const stopSound = useCallback(() => {
    if (!id) return;
    templateAudioCoordinator.stopAudio(id);
  }, [id]);

  return {
    isPlayingAudio,
    toggleSound,
    stopSound,
  };
}
