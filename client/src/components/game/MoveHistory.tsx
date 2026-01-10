"use client";

import { Card } from "@/components/ui/card";

interface MoveHistoryProps {
    moves: string[];
}

export function MoveHistory({ moves }: MoveHistoryProps) {
    return (
        <Card className="flex-1 p-4 overflow-hidden flex flex-col">
            <h3 className="font-display text-lg mb-4">MOVE HISTORY</h3>
            <div className="flex-1 overflow-y-auto font-mono text-sm">
                {moves.reduce((acc, move, index) => {
                    if (index % 2 === 0) {
                        acc.push(
                            <div key={index} className="flex gap-4 py-1 hover:bg-white/5">
                                <span className="text-foreground-dim w-8">
                                    {Math.floor(index / 2) + 1}.
                                </span>
                                <span className="w-16">{move}</span>
                                <span className="w-16">{moves[index + 1] || ""}</span>
                            </div>
                        );
                    }
                    return acc;
                }, [] as JSX.Element[])}
            </div>
        </Card>
    );
}
