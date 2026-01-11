// Sound utility for chess game audio feedback

class ChessSoundManager {
    private sounds: Map<string, HTMLAudioElement> = new Map();
    private isMuted: boolean = false;

    constructor() {
        this.loadSounds();
    }

    private loadSounds() {
        const soundFiles = {
            move: '/assets/move-self.mp3',
            capture: '/assets/capture.mp3',
            notify: '/assets/notify.mp3',
            castle: '/assets/castle.mp3',
            check: '/assets/move-check.mp3',
            promote: '/assets/promote.mp3',
        };

        Object.entries(soundFiles).forEach(([key, path]) => {
            const audio = new Audio(path);
            audio.preload = 'auto';
            this.sounds.set(key, audio);
        });
    }

    private play(soundKey: string) {
        if (this.isMuted) return;

        const sound = this.sounds.get(soundKey);
        if (sound) {
            // Clone the audio to allow rapid successive plays
            const clone = sound.cloneNode() as HTMLAudioElement;
            clone.volume = 0.5; // Set to 50% volume
            clone.play().catch((error) => {
                console.error(`Error playing ${soundKey} sound:`, error);
            });
        }
    }

    // Play sound for a normal move
    playMove() {
        this.play('move');
    }

    // Play sound for capturing a piece
    playCapture() {
        this.play('capture');
    }

    // Play sound for castling
    playCastle() {
        this.play('castle');
    }

    // Play sound for check
    playCheck() {
        this.play('check');
    }

    // Play sound for pawn promotion
    playPromotion() {
        this.play('promote');
    }

    // Play notification sound (chat, game end, etc.)
    playNotify() {
        this.play('notify');
    }

    // Determine and play the appropriate sound based on move data
    playMoveSound(move: {
        from: string;
        to: string;
        captured?: string;
        promotion?: string;
        flags?: string;
    }, isCheck: boolean) {
        // Priority order: promotion > capture > castle > check > normal move
        if (move.promotion) {
            this.playPromotion();
        } else if (move.captured) {
            this.playCapture();
        } else if (move.flags?.includes('k') || move.flags?.includes('q')) {
            // Castling (kingside or queenside)
            this.playCastle();
        } else if (isCheck) {
            this.playCheck();
        } else {
            this.playMove();
        }
    }

    // Mute/unmute sounds
    setMuted(muted: boolean) {
        this.isMuted = muted;
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    isSoundMuted() {
        return this.isMuted;
    }
}

// Export a singleton instance
export const soundManager = new ChessSoundManager();
