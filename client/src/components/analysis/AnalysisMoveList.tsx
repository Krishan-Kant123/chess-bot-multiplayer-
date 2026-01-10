"use client";

import { Card } from "@/components/ui/card";
import type { Move } from "@/lib/api";

interface AnalysisMoveListProps {
    moves: Move[];
    currentMoveIndex: number;
    onMoveClick: (index: number) => void;
}

export function AnalysisMoveList({
    moves,
    currentMoveIndex,
    onMoveClick,
}: AnalysisMoveListProps) {
    return (
        <Card className="p-4 flex-1">
            <h3 className="font-display text-lg mb-4">MOVES</h3>
            <div className="max-h-96 overflow-y-auto font-mono text-sm">
                {moves.length > 0 ? (
                    moves.reduce((acc, move, index) => {
                        if (index % 2 === 0) {
                            acc.push(
                                <div
                                    key={index}
                                    className={`flex gap-4 py-1 px-2 cursor-pointer hover:bg-white/5 rounded ${index === currentMoveIndex || index + 1 === currentMoveIndex
                                            ? "bg-accent/20"
                                            : ""
                                        }`}
                                >
                                    <span className="text-foreground-dim w-6">
                                        {Math.floor(index / 2) + 1}.
                                    </span>
                                    <span
                                        className={`w-16 cursor-pointer ${index === currentMoveIndex ? "text-accent" : ""
                                            }`}
                                        onClick={() => onMoveClick(index)}
                                    >
                                        {move.san || `${move.from}-${move.to}`}
                                    </span>
                                    <span
                                        className={`w-16 cursor-pointer ${index + 1 === currentMoveIndex ? "text-accent" : ""
                                            }`}
                                        onClick={() => onMoveClick(index + 1)}
                                    >
                                        {moves[index + 1]?.san ||
                                            (moves[index + 1]
                                                ? `${moves[index + 1].from}-${moves[index + 1].to}`
                                                : "")}
                                    </span>
                                </div>
                            );
                        }
                        return acc;
                    }, [] as JSX.Element[])
                ) : (
                    <div className="text-foreground-dim text-center py-4">
                        No moves available
                    </div>
                )}
            </div>
        </Card>
    );
}
